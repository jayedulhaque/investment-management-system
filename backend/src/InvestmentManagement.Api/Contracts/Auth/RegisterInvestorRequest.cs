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

    [Required]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string NationalId { get; set; } = string.Empty;

    public DateOnly? DateOfBirth { get; set; }

    [MaxLength(100)]
    public string? Occupation { get; set; }

    [Required]
    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Country { get; set; } = string.Empty;

    [EmailAddress]
    [MaxLength(256)]
    public string? ContactEmail { get; set; }
}
