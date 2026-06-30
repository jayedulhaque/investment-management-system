namespace InvestmentManagement.Api.Contracts.Bookings;

public class InvestorBookingListQuery
{
    public bool Active { get; set; } = true;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 5;
}
