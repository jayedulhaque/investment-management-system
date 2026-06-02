using System.ComponentModel.DataAnnotations;

namespace InvestmentManagement.Api.Contracts.Bookings;

public class UpdateBookingStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}
