namespace InvestmentManagement.Api.Payments.Models;

public class PaymentInitResult
{
    public bool Success { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public string RedirectUrl { get; set; } = string.Empty;
    public string? BKashNumber { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string? Message { get; set; }
}
