namespace InvestmentManagement.Api.Payments.Models;

public class PaymentRequest
{
    public decimal Amount { get; set; }
    public Guid UserId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? ReferenceKey { get; set; }
}
