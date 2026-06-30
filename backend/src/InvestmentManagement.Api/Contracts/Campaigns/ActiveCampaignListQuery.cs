namespace InvestmentManagement.Api.Contracts.Campaigns;

public class ActiveCampaignListQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
    public string? Industry { get; set; }
    public string? City { get; set; }
}
