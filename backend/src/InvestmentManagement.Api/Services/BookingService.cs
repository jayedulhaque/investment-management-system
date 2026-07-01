using System.Data;
using InvestmentManagement.Api.Constants;
using InvestmentManagement.Api.Contracts.Bookings;
using InvestmentManagement.Api.Contracts.Common;
using InvestmentManagement.Api.Data;
using InvestmentManagement.Api.Domain.Entities;
using InvestmentManagement.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManagement.Api.Services;

public class BookingService(ApplicationDbContext db) : IBookingService
{
    private static readonly BookingStatus[] ActiveBookingStatuses =
        [BookingStatus.PreBooked, BookingStatus.Contacted];

    private static readonly BookingStatus[] ActiveListStatuses =
        [BookingStatus.PreBooked, BookingStatus.Contacted, BookingStatus.Confirmed, BookingStatus.ResellPending];

    private static readonly BookingStatus[] InactiveListStatuses =
        [BookingStatus.Cancelled, BookingStatus.Returned];

    public async Task<BookingResponse> CreateBookingAsync(
        Guid investorId,
        CreateBookingRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable, cancellationToken);

        await db.Database.ExecuteSqlInterpolatedAsync(
            $"""SELECT "Id" FROM "Campaigns" WHERE "Id" = {request.CampaignId} FOR UPDATE""",
            cancellationToken);

        var campaign = await db.Campaigns
            .FirstOrDefaultAsync(c => c.Id == request.CampaignId, cancellationToken)
            ?? throw new KeyNotFoundException("Campaign not found.");

        if (!campaign.IsActive || campaign.PaymentStatus != PaymentStatus.Paid)
            throw new InvalidOperationException("Campaign is not active.");

        var investor = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == investorId && u.Role == UserRole.Investor, cancellationToken)
            ?? throw new UnauthorizedAccessException("Investor user not found.");

        if (!investor.IsActive)
            throw new InvalidOperationException("Your investor account is inactive. You cannot book shares.");

        var activeCount = await db.Bookings.CountAsync(
            b => b.InvestorId == investorId && ActiveBookingStatuses.Contains(b.Status),
            cancellationToken);

        if (activeCount >= CampaignConstants.MaxActiveBookingsPerInvestor)
            throw new InvalidOperationException($"Investors may have at most {CampaignConstants.MaxActiveBookingsPerInvestor} active bookings.");

        if (request.ReservedShares > campaign.AvailableShares)
            throw new InvalidOperationException("Requested shares exceed available shares.");

        var totalPrice = request.ReservedShares * campaign.PricePerShare;
        if (totalPrice < campaign.MinInvestmentThreshold)
            throw new InvalidOperationException(
                $"Total order value {totalPrice:0.00} is below minimum threshold {campaign.MinInvestmentThreshold:0.00}.");

        CampaignAvailability.ApplyShareReservation(campaign, request.ReservedShares);

        var now = DateTime.UtcNow;
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            InvestorId = investorId,
            CampaignId = campaign.Id,
            ReservedShares = request.ReservedShares,
            TotalPrice = totalPrice,
            Status = BookingStatus.PreBooked,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Bookings.Add(booking);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return MapBooking(booking);
    }

    public async Task<BookingResponse> CancelBookingAsync(
        Guid investorId,
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable, cancellationToken);

        var booking = await db.Bookings
            .Include(b => b.Campaign)
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.InvestorId != investorId)
            throw new UnauthorizedAccessException("You do not own this booking.");

        if (!ActiveBookingStatuses.Contains(booking.Status))
            throw new InvalidOperationException("Only PreBooked or Contacted bookings can be cancelled.");

        await db.Database.ExecuteSqlInterpolatedAsync(
            $"""SELECT "Id" FROM "Campaigns" WHERE "Id" = {booking.CampaignId} FOR UPDATE""",
            cancellationToken);

        CampaignAvailability.RestoreShares(booking.Campaign, booking.ReservedShares);
        booking.Status = BookingStatus.Cancelled;
        booking.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return MapBooking(booking);
    }

    public async Task<BookingResponse> UpdateBookingStatusAsync(
        Guid companyUserId,
        Guid bookingId,
        UpdateBookingStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<BookingStatus>(request.Status, ignoreCase: true, out var targetStatus))
            throw new InvalidOperationException("Invalid booking status.");

        if (targetStatus is not (BookingStatus.Contacted or BookingStatus.Confirmed))
            throw new InvalidOperationException("Companies may only set status to Contacted or Confirmed.");

        var booking = await db.Bookings
            .Include(b => b.Campaign)
            .ThenInclude(c => c.CompanyProfile)
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Campaign.CompanyProfile.UserId != companyUserId)
            throw new UnauthorizedAccessException("You do not manage this campaign.");

        ValidateCompanyTransition(booking.Status, targetStatus);

        booking.Status = targetStatus;
        booking.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return MapBooking(booking);
    }

    public async Task<BookingResponse> ResellBookingAsync(
        Guid investorId,
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        var booking = await db.Bookings
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.InvestorId != investorId)
            throw new UnauthorizedAccessException("You do not own this booking.");

        if (booking.Status != BookingStatus.Confirmed)
            throw new InvalidOperationException("Only confirmed bookings can request a return.");

        booking.Status = BookingStatus.ResellPending;
        booking.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return MapBooking(booking);
    }

    public async Task<BookingResponse> ApproveResellBookingAsync(
        Guid companyUserId,
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable, cancellationToken);

        var booking = await db.Bookings
            .Include(b => b.Campaign)
            .ThenInclude(c => c.CompanyProfile)
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Campaign.CompanyProfile.UserId != companyUserId)
            throw new UnauthorizedAccessException("You do not manage this campaign.");

        if (booking.Status != BookingStatus.ResellPending)
            throw new InvalidOperationException("Booking does not have a pending resell request.");

        await db.Database.ExecuteSqlInterpolatedAsync(
            $"""SELECT "Id" FROM "Campaigns" WHERE "Id" = {booking.CampaignId} FOR UPDATE""",
            cancellationToken);

        CampaignAvailability.RestoreShares(booking.Campaign, booking.ReservedShares);
        booking.Status = BookingStatus.Returned;
        booking.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return MapBooking(booking);
    }

    public async Task<BookingResponse> RejectResellBookingAsync(
        Guid companyUserId,
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        var booking = await db.Bookings
            .Include(b => b.Campaign)
            .ThenInclude(c => c.CompanyProfile)
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.Campaign.CompanyProfile.UserId != companyUserId)
            throw new UnauthorizedAccessException("You do not manage this campaign.");

        if (booking.Status != BookingStatus.ResellPending)
            throw new InvalidOperationException("Booking does not have a pending resell request.");

        booking.Status = BookingStatus.Confirmed;
        booking.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return MapBooking(booking);
    }

    public async Task<PagedResponse<BookingResponse>> GetInvestorBookingsAsync(
        Guid investorId,
        InvestorBookingListQuery query,
        CancellationToken cancellationToken = default)
    {
        var (page, pageSize) = NormalizePaging(query);
        var statuses = query.Active ? ActiveListStatuses : InactiveListStatuses;

        var filtered = db.Bookings
            .AsNoTracking()
            .Where(b => b.InvestorId == investorId && statuses.Contains(b.Status));

        var totalCount = await filtered.CountAsync(cancellationToken);
        var items = await filtered
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BookingResponse
            {
                Id = b.Id,
                InvestorId = b.InvestorId,
                CampaignId = b.CampaignId,
                CompanyName = b.Campaign.CompanyProfile.CompanyName,
                ReservedShares = b.ReservedShares,
                TotalPrice = b.TotalPrice,
                Status = b.Status.ToString(),
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<BookingResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<BookingDetailResponse> GetInvestorBookingDetailAsync(
        Guid investorId,
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        var booking = await db.Bookings
            .AsNoTracking()
            .Where(b => b.Id == bookingId && b.InvestorId == investorId)
            .Select(b => new BookingDetailResponse
            {
                Id = b.Id,
                CampaignId = b.CampaignId,
                CompanyId = b.Campaign.CompanyId,
                CompanyName = b.Campaign.CompanyProfile.CompanyName,
                CompanyIndustry = b.Campaign.CompanyProfile.Industry,
                CompanyCity = b.Campaign.CompanyProfile.City,
                CompanyCountry = b.Campaign.CompanyProfile.Country,
                ReservedShares = b.ReservedShares,
                TotalPrice = b.TotalPrice,
                PricePerShare = b.Campaign.PricePerShare,
                EquityPercentageOffered = b.Campaign.EquityPercentageOffered,
                CampaignTotalShares = b.Campaign.TotalShares,
                Status = b.Status.ToString(),
                IsActive = ActiveListStatuses.Contains(b.Status),
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Booking not found.");

        return booking;
    }

    public async Task<PagedResponse<BookingResponse>> GetCompanyBookingsAsync(
        Guid companyUserId,
        CompanyBookingListQuery query,
        CancellationToken cancellationToken = default)
    {
        var (page, pageSize) = NormalizeCompanyPaging(query);
        var statuses = query.Active ? ActiveListStatuses : InactiveListStatuses;

        var filtered = db.Bookings
            .AsNoTracking()
            .Where(b => b.Campaign.CompanyProfile.UserId == companyUserId && statuses.Contains(b.Status));

        if (query.CampaignId.HasValue)
            filtered = filtered.Where(b => b.CampaignId == query.CampaignId.Value);

        filtered = ApplyCompanyBookingSearch(filtered, query.Search);

        var totalCount = await filtered.CountAsync(cancellationToken);
        var items = await filtered
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(b => new BookingResponse
            {
                Id = b.Id,
                InvestorId = b.InvestorId,
                CampaignId = b.CampaignId,
                ReservedShares = b.ReservedShares,
                TotalPrice = b.TotalPrice,
                Status = b.Status.ToString(),
                InvestorEmail = b.Investor.Email,
                InvestorName = b.Investor.InvestorProfile != null ? b.Investor.InvestorProfile.FullName : null,
                InvestorPhone = b.Investor.InvestorProfile != null ? b.Investor.InvestorProfile.Phone : null,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<BookingResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<CompanyBookingDetailResponse> GetCompanyBookingDetailAsync(
        Guid companyUserId,
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        var booking = await db.Bookings
            .AsNoTracking()
            .Where(b => b.Id == bookingId && b.Campaign.CompanyProfile.UserId == companyUserId)
            .Select(b => new CompanyBookingDetailResponse
            {
                Id = b.Id,
                CampaignId = b.CampaignId,
                ReservedShares = b.ReservedShares,
                TotalPrice = b.TotalPrice,
                PricePerShare = b.Campaign.PricePerShare,
                EquityPercentageOffered = b.Campaign.EquityPercentageOffered,
                CampaignTotalShares = b.Campaign.TotalShares,
                Status = b.Status.ToString(),
                IsActive = ActiveListStatuses.Contains(b.Status),
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt,
                InvestorId = b.InvestorId,
                InvestorEmail = b.Investor.Email,
                InvestorFullName = b.Investor.InvestorProfile != null ? b.Investor.InvestorProfile.FullName : string.Empty,
                InvestorPhone = b.Investor.InvestorProfile != null ? b.Investor.InvestorProfile.Phone : string.Empty,
                InvestorNationalId = b.Investor.InvestorProfile != null ? b.Investor.InvestorProfile.NationalId : string.Empty,
                InvestorDateOfBirth = b.Investor.InvestorProfile != null && b.Investor.InvestorProfile.DateOfBirth.HasValue
                    ? b.Investor.InvestorProfile.DateOfBirth.Value.ToString("yyyy-MM-dd")
                    : null,
                InvestorOccupation = b.Investor.InvestorProfile != null ? b.Investor.InvestorProfile.Occupation : null,
                InvestorAddress = b.Investor.InvestorProfile != null ? b.Investor.InvestorProfile.Address : string.Empty,
                InvestorCity = b.Investor.InvestorProfile != null ? b.Investor.InvestorProfile.City : string.Empty,
                InvestorCountry = b.Investor.InvestorProfile != null ? b.Investor.InvestorProfile.Country : string.Empty,
                InvestorContactEmail = b.Investor.InvestorProfile != null ? b.Investor.InvestorProfile.ContactEmail : null
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException("Booking not found.");

        return booking;
    }

    private static IQueryable<Booking> ApplyCompanyBookingSearch(IQueryable<Booking> query, string? search)
    {
        if (string.IsNullOrWhiteSpace(search))
            return query;

        var term = search.Trim().ToLower();
        return query.Where(b =>
            b.Investor.Email.ToLower().Contains(term) ||
            (b.Investor.InvestorProfile != null && (
                b.Investor.InvestorProfile.FullName.ToLower().Contains(term) ||
                b.Investor.InvestorProfile.Phone.Contains(term) ||
                b.Investor.InvestorProfile.NationalId.ToLower().Contains(term) ||
                b.Investor.InvestorProfile.City.ToLower().Contains(term) ||
                (b.Investor.InvestorProfile.ContactEmail != null &&
                 b.Investor.InvestorProfile.ContactEmail.ToLower().Contains(term)))));
    }


    private static void ValidateCompanyTransition(BookingStatus current, BookingStatus target)
    {
        var valid = (current, target) switch
        {
            (BookingStatus.PreBooked, BookingStatus.Contacted) => true,
            (BookingStatus.Contacted, BookingStatus.Confirmed) => true,
            _ => false
        };

        if (!valid)
            throw new InvalidOperationException($"Cannot transition from {current} to {target}.");
    }

    private static BookingResponse MapBooking(Booking b) => new()
    {
        Id = b.Id,
        InvestorId = b.InvestorId,
        CampaignId = b.CampaignId,
        ReservedShares = b.ReservedShares,
        TotalPrice = b.TotalPrice,
        Status = b.Status.ToString(),
        CreatedAt = b.CreatedAt,
        UpdatedAt = b.UpdatedAt
    };

    private static (int Page, int PageSize) NormalizePaging(InvestorBookingListQuery query)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 50);
        return (page, pageSize);
    }

    private static (int Page, int PageSize) NormalizeCompanyPaging(CompanyBookingListQuery query)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 50);
        return (page, pageSize);
    }
}
