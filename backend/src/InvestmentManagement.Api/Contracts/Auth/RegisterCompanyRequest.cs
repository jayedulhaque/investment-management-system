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
    [MaxLength(200)]
    public string CompanyName { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? LegalName { get; set; }

    [MaxLength(100)]
    public string? RegistrationNumber { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Url]
    [MaxLength(2000)]
    public string? Website { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [EmailAddress]
    [MaxLength(256)]
    public string? ContactEmail { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? Country { get; set; }

    [MaxLength(100)]
    public string? Industry { get; set; }

    [Required]
    [Url]
    [MaxLength(2000)]
    public string DocumentationUrl { get; set; } = string.Empty;
}
