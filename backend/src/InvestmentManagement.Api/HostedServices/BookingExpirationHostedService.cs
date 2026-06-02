using InvestmentManagement.Api.Constants;
using InvestmentManagement.Api.Data;
using InvestmentManagement.Api.Domain.Enums;
using InvestmentManagement.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManagement.Api.HostedServices;

public class BookingExpirationHostedService(IServiceScopeFactory scopeFactory) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpiredBookingsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                var logger = scopeFactory.CreateScope().ServiceProvider
                    .GetRequiredService<ILogger<BookingExpirationHostedService>>();
                logger.LogError(ex, "Error processing expired bookings.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task ProcessExpiredBookingsAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<BookingExpirationHostedService>>();

        var cutoff = DateTime.UtcNow.AddDays(-CampaignConstants.PreBookedExpirationDays);

        var expiredIds = await db.Bookings
            .AsNoTracking()
            .Where(b => b.Status == BookingStatus.PreBooked && b.CreatedAt < cutoff)
            .Select(b => b.Id)
            .ToListAsync(cancellationToken);

        if (expiredIds.Count == 0)
            return;

        foreach (var bookingId in expiredIds)
        {
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

            var booking = await db.Bookings
                .Include(b => b.Campaign)
                .FirstOrDefaultAsync(b => b.Id == bookingId, cancellationToken);

            if (booking is null || booking.Status != BookingStatus.PreBooked || booking.CreatedAt >= cutoff)
            {
                await transaction.RollbackAsync(cancellationToken);
                continue;
            }

            await db.Database.ExecuteSqlInterpolatedAsync(
                $"""SELECT "Id" FROM "Campaigns" WHERE "Id" = {booking.CampaignId} FOR UPDATE""",
                cancellationToken);

            BookingService.RestoreShares(booking.Campaign, booking.ReservedShares);
            booking.Status = BookingStatus.Cancelled;
            booking.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation("Auto-cancelled expired booking {BookingId}", bookingId);
        }
    }
}
