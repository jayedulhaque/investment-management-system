namespace InvestmentManagement.Api.Contracts.Admin;

public class PendingCompanyResponse
{
    public Guid CompanyProfileId { get; set; }
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DocumentationUrl { get; set; } = string.Empty;
    public string ApprovalStatus { get; set; } = string.Empty;
}
