namespace InvestmentManagement.Api.Payments.Models;

public class PaymentVerifyResult
{
    public bool Success { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public DateTime? VerifiedAt { get; set; }
    public string? Message { get; set; }
}
