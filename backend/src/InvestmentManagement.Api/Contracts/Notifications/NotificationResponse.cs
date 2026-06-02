namespace InvestmentManagement.Api.Contracts.Notifications;

public class NotificationResponse
{
    public Guid Id { get; set; }
    public Guid? CampaignId { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
