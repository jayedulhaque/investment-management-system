using InvestmentManagement.Api.Contracts.Campaigns;
using InvestmentManagement.Api.Contracts.Common;

namespace InvestmentManagement.Api.Services;

public interface ICampaignService
{
    Task<CreateCampaignResponse> CreateCampaignAsync(Guid companyUserId, CreateCampaignRequest request, CancellationToken cancellationToken = default);
    Task<CampaignResponse> ConfirmPaymentAsync(Guid companyUserId, Guid campaignId, ConfirmCampaignPaymentRequest request, CancellationToken cancellationToken = default);
    Task<PagedResponse<CampaignResponse>> GetActiveCampaignsAsync(ActiveCampaignListQuery query, CancellationToken cancellationToken = default);
    Task<PagedResponse<CampaignResponse>> GetClosedCampaignsAsync(ActiveCampaignListQuery query, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CampaignResponse>> GetCompanyCampaignsAsync(Guid companyUserId, CancellationToken cancellationToken = default);
    Task<CampaignResponse?> GetCampaignAsync(Guid campaignId, CancellationToken cancellationToken = default);
    Task<CompanyPublicResponse?> GetPublicCompanyAsync(Guid companyProfileId, CancellationToken cancellationToken = default);
    Task DeleteCampaignAsync(Guid companyUserId, Guid campaignId, CancellationToken cancellationToken = default);
}
