using System.ComponentModel.DataAnnotations;

namespace InvestmentManagement.Api.Contracts.Campaigns;

public class ConfirmCampaignPaymentRequest
{
    [Required]
    [MaxLength(100)]
    public string TransactionId { get; set; } = string.Empty;
}
