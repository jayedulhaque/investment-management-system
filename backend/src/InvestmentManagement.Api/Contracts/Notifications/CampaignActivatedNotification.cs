namespace InvestmentManagement.Api.Contracts.Notifications;

public class CampaignActivatedNotification
{
    public Guid CampaignId { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
