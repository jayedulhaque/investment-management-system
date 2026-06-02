using System.ComponentModel.DataAnnotations;

namespace InvestmentManagement.Api.Contracts.Admin;

public class UpdateAdminProfileRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [MinLength(8)]
    public string? Password { get; set; }

    [Required]
    [MaxLength(20)]
    public string BKashNumber { get; set; } = string.Empty;
}
