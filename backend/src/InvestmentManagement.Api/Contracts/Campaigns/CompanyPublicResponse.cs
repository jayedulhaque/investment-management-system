namespace InvestmentManagement.Api.Contracts.Campaigns;

public class CompanyPublicResponse
{
    public Guid CompanyProfileId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? LegalName { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Industry { get; set; }
    public string? Website { get; set; }
    public string? Phone { get; set; }
    public string? ContactEmail { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
}
