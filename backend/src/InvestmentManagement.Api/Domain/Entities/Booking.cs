using InvestmentManagement.Api.Domain.Enums;

namespace InvestmentManagement.Api.Domain.Entities;

public class Booking
{
    public Guid Id { get; set; }
    public Guid InvestorId { get; set; }
    public Guid CampaignId { get; set; }
    public int ReservedShares { get; set; }
    public decimal TotalPrice { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.PreBooked;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User Investor { get; set; } = null!;
    public Campaign Campaign { get; set; } = null!;
}
