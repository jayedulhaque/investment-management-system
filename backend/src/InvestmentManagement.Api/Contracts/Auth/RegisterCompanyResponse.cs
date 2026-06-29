namespace InvestmentManagement.Api.Contracts.Auth;

public class RegisterCompanyResponse
{
    public string Message { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ApprovalStatus { get; set; } = "Pending";
}
