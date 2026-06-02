using InvestmentManagement.Api.Payments.Models;

namespace InvestmentManagement.Api.Contracts.Campaigns;

public class CreateCampaignResponse
{
    public CampaignResponse Campaign { get; set; } = null!;
    public PaymentInitResult Payment { get; set; } = null!;
}
