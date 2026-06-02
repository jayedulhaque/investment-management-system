using InvestmentManagement.Api.Contracts.Notifications;
using InvestmentManagement.Api.Domain.Entities;

namespace InvestmentManagement.Api.Services;

public interface INotificationService
{
    Task NotifyCampaignActivatedAsync(Campaign campaign, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<NotificationResponse>> GetUserNotificationsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken = default);
    Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default);
}
