using InvestmentManagement.Api.Constants;
using InvestmentManagement.Api.Contracts.Campaigns;
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

        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            CompanyId = profile.Id,
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
            Campaign = MapCampaign(campaign),
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

    public async Task<IReadOnlyList<CampaignResponse>> GetActiveCampaignsAsync(CancellationToken cancellationToken = default)
    {
        return await db.Campaigns
            .AsNoTracking()
            .Where(c => c.IsActive && c.PaymentStatus == PaymentStatus.Paid)
            .OrderByDescending(c => c.Id)
            .Select(c => new CampaignResponse
            {
                Id = c.Id,
                CompanyId = c.CompanyId,
                TotalShares = c.TotalShares,
                AvailableShares = c.AvailableShares,
                PricePerShare = c.PricePerShare,
                MinInvestmentThreshold = c.MinInvestmentThreshold,
                PaymentStatus = c.PaymentStatus.ToString(),
                BKashTransactionId = c.BKashTransactionId,
                IsActive = c.IsActive
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<CampaignResponse?> GetCampaignAsync(Guid campaignId, CancellationToken cancellationToken = default)
    {
        var campaign = await db.Campaigns.AsNoTracking().FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);
        return campaign is null ? null : MapCampaign(campaign);
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

    private static CampaignResponse MapCampaign(Campaign c) => new()
    {
        Id = c.Id,
        CompanyId = c.CompanyId,
        TotalShares = c.TotalShares,
        AvailableShares = c.AvailableShares,
        PricePerShare = c.PricePerShare,
        MinInvestmentThreshold = c.MinInvestmentThreshold,
        PaymentStatus = c.PaymentStatus.ToString(),
        BKashTransactionId = c.BKashTransactionId,
        IsActive = c.IsActive
    };
}
