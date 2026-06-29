using System.ComponentModel.DataAnnotations;

namespace InvestmentManagement.Api.Contracts.Campaigns;

public class CreateCampaignRequest
{
    [Range(0.01, 100)]
    public decimal EquityPercentageOffered { get; set; }

    [Range(1, int.MaxValue)]
    public int TotalShares { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal PricePerShare { get; set; }

    [Range(0, double.MaxValue)]
    public decimal MinInvestmentThreshold { get; set; }
}
