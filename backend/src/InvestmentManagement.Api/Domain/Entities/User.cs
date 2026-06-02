using InvestmentManagement.Api.Domain.Enums;

namespace InvestmentManagement.Api.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? BKashNumber { get; set; }

    public CompanyProfile? CompanyProfile { get; set; }
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
