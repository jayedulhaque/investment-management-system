namespace InvestmentManagement.Api.Contracts.Bookings;

public class BookingDetailResponse
{
    public Guid Id { get; set; }
    public Guid CampaignId { get; set; }
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CompanyIndustry { get; set; }
    public string? CompanyCity { get; set; }
    public string? CompanyCountry { get; set; }
    public int ReservedShares { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal PricePerShare { get; set; }
    public decimal EquityPercentageOffered { get; set; }
    public int CampaignTotalShares { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
