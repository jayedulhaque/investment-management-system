namespace InvestmentManagement.Api.Contracts.Bookings;

public class CompanyBookingDetailResponse
{
    public Guid Id { get; set; }
    public Guid CampaignId { get; set; }
    public int ReservedShares { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal PricePerShare { get; set; }
    public decimal EquityPercentageOffered { get; set; }
    public int CampaignTotalShares { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Guid InvestorId { get; set; }
    public string InvestorEmail { get; set; } = string.Empty;
    public string InvestorFullName { get; set; } = string.Empty;
    public string InvestorPhone { get; set; } = string.Empty;
    public string InvestorNationalId { get; set; } = string.Empty;
    public string? InvestorDateOfBirth { get; set; }
    public string? InvestorOccupation { get; set; }
    public string InvestorAddress { get; set; } = string.Empty;
    public string InvestorCity { get; set; } = string.Empty;
    public string InvestorCountry { get; set; } = string.Empty;
    public string? InvestorContactEmail { get; set; }
}
