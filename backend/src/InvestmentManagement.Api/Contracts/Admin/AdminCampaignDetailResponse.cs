using InvestmentManagement.Api.Contracts.Campaigns;

namespace InvestmentManagement.Api.Contracts.Admin;

public class AdminCampaignDetailResponse
{
    public CampaignResponse Campaign { get; set; } = null!;
    public CompanyDetailResponse Company { get; set; } = null!;
    public IReadOnlyList<AdminCampaignBookingResponse> Bookings { get; set; } = [];
    public int TotalBookedShares { get; set; }
}
