namespace InvestmentManagement.Api.Contracts.Admin;

public class InvestorSummaryResponse
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
}
