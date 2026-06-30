using System.ComponentModel.DataAnnotations;

namespace InvestmentManagement.Api.Contracts.Investors;

public class UpdateInvestorProfileRequest
{
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

    [MaxLength(256)]
    public string? ContactEmail { get; set; }
}
