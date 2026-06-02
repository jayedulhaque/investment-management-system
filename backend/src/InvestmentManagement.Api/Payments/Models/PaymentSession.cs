namespace InvestmentManagement.Api.Payments.Models;

public enum PaymentSessionStatus
{
    Pending,
    Completed,
    Failed
}

public class PaymentSession
{
    public string TransactionId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public Guid UserId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public PaymentSessionStatus Status { get; set; }
    public string? ReferenceKey { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
