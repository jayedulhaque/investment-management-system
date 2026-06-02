namespace InvestmentManagement.Api.Contracts.Campaigns;

public class CampaignResponse
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public int TotalShares { get; set; }
    public int AvailableShares { get; set; }
    public decimal PricePerShare { get; set; }
    public decimal MinInvestmentThreshold { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public string? BKashTransactionId { get; set; }
    public bool IsActive { get; set; }
}
