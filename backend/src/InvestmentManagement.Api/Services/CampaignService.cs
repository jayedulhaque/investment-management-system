using InvestmentManagement.Api.Constants;
using InvestmentManagement.Api.Contracts.Campaigns;
using InvestmentManagement.Api.Contracts.Common;
using InvestmentManagement.Api.Data;
using InvestmentManagement.Api.Domain.Entities;
using InvestmentManagement.Api.Domain.Enums;
using InvestmentManagement.Api.Payments;
using InvestmentManagement.Api.Payments.Models;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManagement.Api.Services;

public class CampaignService(
    ApplicationDbContext db,
    IPaymentStrategy paymentStrategy,
    IPaymentSessionStore paymentSessionStore,
    INotificationService notificationService) : ICampaignService
{
    public async Task<CreateCampaignResponse> CreateCampaignAsync(
        Guid companyUserId,
        CreateCampaignRequest request,
        CancellationToken cancellationToken = default)
    {
        var profile = await db.CompanyProfiles
            .FirstOrDefaultAsync(p => p.UserId == companyUserId, cancellationToken)
            ?? throw new InvalidOperationException("Company profile not found.");

        if (profile.ApprovalStatus != ApprovalStatus.Approved)
            throw new InvalidOperationException("Company must be approved before creating campaigns.");

        var hasCampaign = await db.Campaigns.AnyAsync(c => c.CompanyId == profile.Id, cancellationToken);
        if (hasCampaign)
            throw new InvalidOperationException("A company can only have one campaign.");

        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            CompanyId = profile.Id,
            EquityPercentageOffered = request.EquityPercentageOffered,
            TotalShares = request.TotalShares,
            AvailableShares = request.TotalShares,
            PricePerShare = request.PricePerShare,
            MinInvestmentThreshold = request.MinInvestmentThreshold,
            PaymentStatus = PaymentStatus.Pending,
            IsActive = false
        };

        db.Campaigns.Add(campaign);
        await db.SaveChangesAsync(cancellationToken);

        var referenceKey = BuildCampaignReferenceKey(campaign.Id);
        var payment = await paymentStrategy.InitiatePaymentAsync(new PaymentRequest
        {
            Amount = CampaignConstants.ListingFee,
            UserId = companyUserId,
            Description = $"Campaign listing fee for {campaign.Id}",
            ReferenceKey = referenceKey
        }, cancellationToken);

        return new CreateCampaignResponse
        {
            Campaign = MapCampaign(campaign, profile.CompanyName),
            Payment = payment
        };
    }

    public async Task<CampaignResponse> ConfirmPaymentAsync(
        Guid companyUserId,
        Guid campaignId,
        ConfirmCampaignPaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        var campaign = await db.Campaigns
            .Include(c => c.CompanyProfile)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken)
            ?? throw new KeyNotFoundException("Campaign not found.");

        if (campaign.CompanyProfile.UserId != companyUserId)
            throw new UnauthorizedAccessException("You do not own this campaign.");

        if (campaign.PaymentStatus == PaymentStatus.Paid)
            return MapCampaign(campaign);

        await EnsurePaymentCompletedAsync(request.TransactionId, campaignId, cancellationToken);

        campaign.PaymentStatus = PaymentStatus.Paid;
        campaign.BKashTransactionId = request.TransactionId;
        campaign.IsActive = true;

        await db.SaveChangesAsync(cancellationToken);
        await notificationService.NotifyCampaignActivatedAsync(campaign, cancellationToken);
        return MapCampaign(campaign);
    }

    public async Task<PagedResponse<CampaignResponse>> GetActiveCampaignsAsync(
        ActiveCampaignListQuery query,
        CancellationToken cancellationToken = default)
    {
        var (page, pageSize) = NormalizePaging(query);
        var filtered = ApplyCampaignListFilters(
            db.Campaigns
                .AsNoTracking()
                .Include(c => c.CompanyProfile)
                .Where(c => c.IsActive && c.PaymentStatus == PaymentStatus.Paid),
            query);

        var totalCount = await filtered.CountAsync(cancellationToken);
        var campaigns = await filtered
            .OrderBy(c => c.CompanyProfile.CompanyName)
            .ThenByDescending(c => c.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResponse<CampaignResponse>
        {
            Items = campaigns.Select(c => MapCampaign(c)).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<PagedResponse<CampaignResponse>> GetClosedCampaignsAsync(
        ActiveCampaignListQuery query,
        CancellationToken cancellationToken = default)
    {
        var (page, pageSize) = NormalizePaging(query);
        var filtered = ApplyCampaignListFilters(
            db.Campaigns
                .AsNoTracking()
                .Include(c => c.CompanyProfile)
                .Where(c => c.PaymentStatus == PaymentStatus.Paid && !c.IsActive),
            query);

        var totalCount = await filtered.CountAsync(cancellationToken);
        var campaigns = await filtered
            .OrderByDescending(c => c.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResponse<CampaignResponse>
        {
            Items = campaigns.Select(c => MapCampaign(c)).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<IReadOnlyList<CampaignResponse>> GetCompanyCampaignsAsync(
        Guid companyUserId,
        CancellationToken cancellationToken = default)
    {
        var profile = await db.CompanyProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == companyUserId, cancellationToken);

        if (profile is null)
            return Array.Empty<CampaignResponse>();

        var campaigns = await db.Campaigns
            .AsNoTracking()
            .Include(c => c.CompanyProfile)
            .Where(c => c.CompanyId == profile.Id)
            .OrderByDescending(c => c.Id)
            .ToListAsync(cancellationToken);

        return campaigns.Select(c => MapCampaign(c)).ToList();
    }

    public async Task<CampaignResponse?> GetCampaignAsync(Guid campaignId, CancellationToken cancellationToken = default)
    {
        var campaign = await db.Campaigns
            .AsNoTracking()
            .Include(c => c.CompanyProfile)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);
        return campaign is null ? null : MapCampaign(campaign);
    }

    public async Task<CompanyPublicResponse?> GetPublicCompanyAsync(
        Guid companyProfileId,
        CancellationToken cancellationToken = default)
    {
        var profile = await db.CompanyProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(
                p => p.Id == companyProfileId && p.ApprovalStatus == ApprovalStatus.Approved,
                cancellationToken);

        return profile is null ? null : MapPublicCompany(profile);
    }

    public async Task DeleteCampaignAsync(
        Guid companyUserId,
        Guid campaignId,
        CancellationToken cancellationToken = default)
    {
        var campaign = await db.Campaigns
            .Include(c => c.CompanyProfile)
            .Include(c => c.Bookings)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken)
            ?? throw new KeyNotFoundException("Campaign not found.");

        if (campaign.CompanyProfile.UserId != companyUserId)
            throw new UnauthorizedAccessException("You do not own this campaign.");

        var hasActiveBookings = campaign.Bookings.Any(b =>
            b.Status is BookingStatus.PreBooked or BookingStatus.Contacted or BookingStatus.Confirmed);

        if (hasActiveBookings)
            throw new InvalidOperationException("Cannot delete a campaign with active bookings.");

        if (campaign.Bookings.Count > 0)
            db.Bookings.RemoveRange(campaign.Bookings);

        db.Campaigns.Remove(campaign);
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsurePaymentCompletedAsync(
        string transactionId,
        Guid campaignId,
        CancellationToken cancellationToken)
    {
        var referenceKey = BuildCampaignReferenceKey(campaignId);
        var session = paymentSessionStore.Get(transactionId);

        if (session is null || session.Status != PaymentSessionStatus.Completed)
        {
            var verify = await paymentStrategy.VerifyPaymentAsync(transactionId, cancellationToken);
            if (!verify.Success)
                throw new InvalidOperationException(verify.Message ?? "Payment verification failed.");

            session = paymentSessionStore.Get(transactionId);
        }

        if (session is null)
            throw new InvalidOperationException("Payment session not found.");

        if (session.Amount != CampaignConstants.ListingFee)
            throw new InvalidOperationException("Payment amount does not match campaign listing fee.");

        if (!string.Equals(session.ReferenceKey, referenceKey, StringComparison.Ordinal))
            throw new InvalidOperationException("Payment is not linked to this campaign.");
    }

    public static string BuildCampaignReferenceKey(Guid campaignId) => $"campaign:{campaignId}";

    private static CampaignResponse MapCampaign(Campaign c, string? companyName = null)
    {
        var profile = c.CompanyProfile;
        var resolvedName = companyName ?? (profile is not null ? ResolveDisplayCompanyName(profile) : string.Empty);

        return new CampaignResponse
        {
            Id = c.Id,
            CompanyId = c.CompanyId,
            CompanyName = resolvedName,
            Company = profile is not null ? MapPublicCompany(profile) : null,
            EquityPercentageOffered = c.EquityPercentageOffered,
            TotalShares = c.TotalShares,
            AvailableShares = c.AvailableShares,
            PricePerShare = c.PricePerShare,
            MinInvestmentThreshold = c.MinInvestmentThreshold,
            PaymentStatus = c.PaymentStatus.ToString(),
            BKashTransactionId = c.BKashTransactionId,
            IsActive = c.IsActive,
            IsClosed = CampaignAvailability.IsClosed(c)
        };
    }

    private static CompanyPublicResponse MapPublicCompany(CompanyProfile profile) => new()
    {
        CompanyProfileId = profile.Id,
        CompanyName = ResolveDisplayCompanyName(profile),
        LegalName = profile.LegalName,
        Description = profile.Description,
        Industry = profile.Industry,
        Website = profile.Website,
        Phone = profile.Phone,
        ContactEmail = profile.ContactEmail,
        City = profile.City,
        Country = profile.Country
    };

    private static (int Page, int PageSize) NormalizePaging(ActiveCampaignListQuery query)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 50);
        return (page, pageSize);
    }

    private static IQueryable<Campaign> ApplyCampaignListFilters(
        IQueryable<Campaign> query,
        ActiveCampaignListQuery listQuery)
    {
        if (!string.IsNullOrWhiteSpace(listQuery.Search))
        {
            var term = listQuery.Search.Trim().ToLower();
            query = query.Where(c =>
                c.CompanyProfile.CompanyName.ToLower().Contains(term) ||
                (c.CompanyProfile.LegalName != null && c.CompanyProfile.LegalName.ToLower().Contains(term)) ||
                (c.CompanyProfile.Industry != null && c.CompanyProfile.Industry.ToLower().Contains(term)) ||
                (c.CompanyProfile.City != null && c.CompanyProfile.City.ToLower().Contains(term)) ||
                (c.CompanyProfile.Country != null && c.CompanyProfile.Country.ToLower().Contains(term)) ||
                c.CompanyProfile.Description.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(listQuery.Industry))
        {
            var industry = listQuery.Industry.Trim().ToLower();
            query = query.Where(c =>
                c.CompanyProfile.Industry != null &&
                c.CompanyProfile.Industry.ToLower().Contains(industry));
        }

        if (!string.IsNullOrWhiteSpace(listQuery.City))
        {
            var city = listQuery.City.Trim().ToLower();
            query = query.Where(c =>
                c.CompanyProfile.City != null &&
                c.CompanyProfile.City.ToLower().Contains(city));
        }

        return query;
    }

    private static string ResolveDisplayCompanyName(CompanyProfile profile)
    {
        var companyName = profile.CompanyName.Trim();
        if (!string.IsNullOrEmpty(companyName) && !companyName.Contains('@', StringComparison.Ordinal))
            return companyName;

        if (!string.IsNullOrWhiteSpace(profile.LegalName))
            return profile.LegalName.Trim();

        return companyName;
    }
}
