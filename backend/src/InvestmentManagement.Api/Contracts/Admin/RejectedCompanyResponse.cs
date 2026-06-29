namespace InvestmentManagement.Api.Contracts.Admin;

public class RejectedCompanyResponse
{
    public Guid CompanyProfileId { get; set; }
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? LegalName { get; set; }
    public string? RegistrationNumber { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Website { get; set; }
    public string? Phone { get; set; }
    public string? ContactEmail { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? Industry { get; set; }
    public string DocumentationUrl { get; set; } = string.Empty;
    public string ApprovalStatus { get; set; } = string.Empty;
}
