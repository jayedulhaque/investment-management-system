using System.ComponentModel.DataAnnotations;

namespace InvestmentManagement.Api.Contracts.Payments;

public class InitiatePaymentRequest
{
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [MaxLength(200)]
    public string? Description { get; set; }

    [MaxLength(100)]
    public string? ReferenceKey { get; set; }
}
