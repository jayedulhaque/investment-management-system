using InvestmentManagement.Api.Domain.Enums;

namespace InvestmentManagement.Api.Domain.Entities;

public class Campaign
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public int TotalShares { get; set; }
    public int AvailableShares { get; set; }
    public decimal PricePerShare { get; set; }
    public decimal MinInvestmentThreshold { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public string? BKashTransactionId { get; set; }
    public bool IsActive { get; set; }

    public CompanyProfile CompanyProfile { get; set; } = null!;
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
