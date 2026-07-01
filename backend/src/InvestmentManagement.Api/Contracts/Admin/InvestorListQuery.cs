namespace InvestmentManagement.Api.Contracts.Admin;

public class InvestorListQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
    public string? City { get; set; }
    public bool? Active { get; set; }
}
