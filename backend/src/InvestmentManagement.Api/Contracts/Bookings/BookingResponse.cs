namespace InvestmentManagement.Api.Contracts.Bookings;

public class BookingResponse
{
    public Guid Id { get; set; }
    public Guid InvestorId { get; set; }
    public Guid CampaignId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public int ReservedShares { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? InvestorEmail { get; set; }
    public string? InvestorName { get; set; }
    public string? InvestorPhone { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
