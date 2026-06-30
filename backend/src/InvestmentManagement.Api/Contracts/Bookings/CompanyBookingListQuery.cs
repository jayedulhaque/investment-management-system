namespace InvestmentManagement.Api.Contracts.Bookings;

public class CompanyBookingListQuery
{
    public bool Active { get; set; } = true;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 5;
    public string? Search { get; set; }
    public Guid? CampaignId { get; set; }
}
