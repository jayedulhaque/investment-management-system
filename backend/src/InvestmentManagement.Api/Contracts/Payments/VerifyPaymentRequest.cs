using System.ComponentModel.DataAnnotations;

namespace InvestmentManagement.Api.Contracts.Payments;

public class VerifyPaymentRequest
{
    [Required]
    [MaxLength(100)]
    public string TransactionId { get; set; } = string.Empty;
}
