namespace InvestmentManagement.Api.Contracts.Admin;

public class InvestorDetailResponse
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public string? DateOfBirth { get; set; }
    public string? Occupation { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? ContactEmail { get; set; }
    public int TotalBookings { get; set; }
    public int ActiveBookings { get; set; }
}
