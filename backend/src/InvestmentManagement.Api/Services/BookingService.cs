using System.Data;
using InvestmentManagement.Api.Constants;
using InvestmentManagement.Api.Contracts.Bookings;
using InvestmentManagement.Api.Data;
using InvestmentManagement.Api.Domain.Entities;
using InvestmentManagement.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManagement.Api.Services;

public class BookingService(ApplicationDbContext db) : IBookingService
{
    private static readonly BookingStatus[] ActiveBookingStatuses =
        [BookingStatus.PreBooked, BookingStatus.Contacted];

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

        campaign.AvailableShares -= request.ReservedShares;

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

        RestoreShares(booking.Campaign, booking.ReservedShares);
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
        await using var transaction = await db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable, cancellationToken);

        var booking = await db.Bookings
            .Include(b => b.Campaign)
            .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.InvestorId != investorId)
            throw new UnauthorizedAccessException("You do not own this booking.");

        if (booking.Status != BookingStatus.Confirmed)
            throw new InvalidOperationException("Only confirmed bookings can be returned to the company.");

        await db.Database.ExecuteSqlInterpolatedAsync(
            $"""SELECT "Id" FROM "Campaigns" WHERE "Id" = {booking.CampaignId} FOR UPDATE""",
            cancellationToken);

        RestoreShares(booking.Campaign, booking.ReservedShares);
        booking.Status = BookingStatus.Returned;
        booking.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return MapBooking(booking);
    }

    public async Task<IReadOnlyList<BookingResponse>> GetInvestorBookingsAsync(
        Guid investorId,
        CancellationToken cancellationToken = default)
    {
        return await db.Bookings
            .AsNoTracking()
            .Where(b => b.InvestorId == investorId)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BookingResponse
            {
                Id = b.Id,
                InvestorId = b.InvestorId,
                CampaignId = b.CampaignId,
                ReservedShares = b.ReservedShares,
                TotalPrice = b.TotalPrice,
                Status = b.Status.ToString(),
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<BookingResponse>> GetCompanyBookingsAsync(
        Guid companyUserId,
        Guid? campaignId,
        CancellationToken cancellationToken = default)
    {
        var query = db.Bookings
            .AsNoTracking()
            .Include(b => b.Campaign)
            .ThenInclude(c => c.CompanyProfile)
            .Where(b => b.Campaign.CompanyProfile.UserId == companyUserId);

        if (campaignId.HasValue)
            query = query.Where(b => b.CampaignId == campaignId.Value);

        return await query
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BookingResponse
            {
                Id = b.Id,
                InvestorId = b.InvestorId,
                CampaignId = b.CampaignId,
                ReservedShares = b.ReservedShares,
                TotalPrice = b.TotalPrice,
                Status = b.Status.ToString(),
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }

    internal static void RestoreShares(Campaign campaign, int shares)
    {
        campaign.AvailableShares = Math.Min(campaign.TotalShares, campaign.AvailableShares + shares);
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
}
