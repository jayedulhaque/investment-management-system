using System.ComponentModel.DataAnnotations;

namespace InvestmentManagement.Api.Contracts.Bookings;

public class CreateBookingRequest
{
    [Required]
    public Guid CampaignId { get; set; }

    [Range(1, int.MaxValue)]
    public int ReservedShares { get; set; }
}
