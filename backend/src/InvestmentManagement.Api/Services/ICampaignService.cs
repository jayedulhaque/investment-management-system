using InvestmentManagement.Api.Contracts.Campaigns;

namespace InvestmentManagement.Api.Services;

public interface ICampaignService
{
    Task<CreateCampaignResponse> CreateCampaignAsync(Guid companyUserId, CreateCampaignRequest request, CancellationToken cancellationToken = default);
    Task<CampaignResponse> ConfirmPaymentAsync(Guid companyUserId, Guid campaignId, ConfirmCampaignPaymentRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CampaignResponse>> GetActiveCampaignsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CampaignResponse>> GetCompanyCampaignsAsync(Guid companyUserId, CancellationToken cancellationToken = default);
    Task<CampaignResponse?> GetCampaignAsync(Guid campaignId, CancellationToken cancellationToken = default);
    Task DeleteCampaignAsync(Guid companyUserId, Guid campaignId, CancellationToken cancellationToken = default);
}
