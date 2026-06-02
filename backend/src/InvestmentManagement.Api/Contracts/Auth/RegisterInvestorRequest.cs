using System.ComponentModel.DataAnnotations;

namespace InvestmentManagement.Api.Contracts.Auth;

public class RegisterInvestorRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
}
