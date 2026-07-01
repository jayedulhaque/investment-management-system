namespace InvestmentManagement.Api.Contracts.Admin;

public class AdminCampaignBookingResponse
{
    public Guid BookingId { get; set; }
    public Guid InvestorUserId { get; set; }
    public string InvestorEmail { get; set; } = string.Empty;
    public string InvestorFullName { get; set; } = string.Empty;
    public string InvestorPhone { get; set; } = string.Empty;
    public string? InvestorNationalId { get; set; }
    public string? InvestorCity { get; set; }
    public string? InvestorCountry { get; set; }
    public string? InvestorContactEmail { get; set; }
    public int ReservedShares { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
