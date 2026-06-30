namespace InvestmentManagement.Api.Contracts.Admin;

public class CompanyListQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
    public string? Industry { get; set; }
}
