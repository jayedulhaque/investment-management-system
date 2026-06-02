using InvestmentManagement.Api.Contracts.Notifications;
using InvestmentManagement.Api.Data;
using InvestmentManagement.Api.Domain.Entities;
using InvestmentManagement.Api.Domain.Enums;
using InvestmentManagement.Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManagement.Api.Services;

public class NotificationService(
    ApplicationDbContext db,
    IHubContext<InvestmentHub> hubContext) : INotificationService
{
    public async Task NotifyCampaignActivatedAsync(Campaign campaign, CancellationToken cancellationToken = default)
    {
        var investorIds = await db.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Investor)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        if (investorIds.Count == 0)
            return;

        var message =
            $"New campaign live: {campaign.TotalShares} shares at {campaign.PricePerShare:0.00} BDT/share " +
            $"(min. investment {campaign.MinInvestmentThreshold:0.00} BDT).";
        var createdAt = DateTime.UtcNow;

        foreach (var investorId in investorIds)
        {
            db.Notifications.Add(new Notification
            {
                Id = Guid.NewGuid(),
                UserId = investorId,
                CampaignId = campaign.Id,
                Message = message,
                IsRead = false,
                CreatedAt = createdAt
            });
        }

        await db.SaveChangesAsync(cancellationToken);

        await hubContext.Clients.Group(HubGroups.Investors).SendAsync(
            InvestmentHub.CampaignActivatedEvent,
            new CampaignActivatedNotification
            {
                CampaignId = campaign.Id,
                Message = message,
                CreatedAt = createdAt
            },
            cancellationToken);
    }

    public async Task<IReadOnlyList<NotificationResponse>> GetUserNotificationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationResponse
            {
                Id = n.Id,
                CampaignId = n.CampaignId,
                Message = n.Message,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await db.Notifications.CountAsync(
            n => n.UserId == userId && !n.IsRead,
            cancellationToken);
    }

    public async Task MarkAsReadAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken = default)
    {
        var notification = await db.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Notification not found.");

        notification.IsRead = true;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), cancellationToken);
    }
}
