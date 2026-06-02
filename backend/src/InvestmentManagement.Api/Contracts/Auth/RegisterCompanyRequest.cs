using System.ComponentModel.DataAnnotations;

namespace InvestmentManagement.Api.Contracts.Auth;

public class RegisterCompanyRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [Url]
    [MaxLength(2000)]
    public string DocumentationUrl { get; set; } = string.Empty;
}
