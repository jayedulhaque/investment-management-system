using InvestmentManagement.Api.Contracts.Admin;
using InvestmentManagement.Api.Contracts.Campaigns;
using InvestmentManagement.Api.Contracts.Common;

namespace InvestmentManagement.Api.Services;

public interface IAdminService
{
    Task<AdminProfileResponse> GetProfileAsync(Guid adminUserId, CancellationToken cancellationToken = default);
    Task UpdateProfileAsync(Guid adminUserId, UpdateAdminProfileRequest request, CancellationToken cancellationToken = default);
    Task<PagedResponse<PendingCompanyResponse>> GetPendingCompaniesAsync(CompanyListQuery query, CancellationToken cancellationToken = default);
    Task<PagedResponse<ApprovedCompanyResponse>> GetApprovedCompaniesAsync(CompanyListQuery query, CancellationToken cancellationToken = default);
    Task<PagedResponse<RejectedCompanyResponse>> GetRejectedCompaniesAsync(CompanyListQuery query, CancellationToken cancellationToken = default);
    Task<PagedResponse<InvestorSummaryResponse>> GetInvestorsAsync(InvestorListQuery query, CancellationToken cancellationToken = default);
    Task<InvestorDetailResponse?> GetInvestorByIdAsync(Guid investorUserId, CancellationToken cancellationToken = default);
    Task SetInvestorActiveStatusAsync(Guid investorUserId, bool isActive, CancellationToken cancellationToken = default);
    Task<PagedResponse<CampaignResponse>> GetActiveCampaignsAsync(ActiveCampaignListQuery query, CancellationToken cancellationToken = default);
    Task<PagedResponse<CampaignResponse>> GetClosedCampaignsAsync(ActiveCampaignListQuery query, CancellationToken cancellationToken = default);
    Task<AdminCampaignDetailResponse?> GetCampaignByIdAsync(Guid campaignId, CancellationToken cancellationToken = default);
    Task<CompanyDetailResponse?> GetCompanyByIdAsync(Guid companyProfileId, CancellationToken cancellationToken = default);
    Task ApproveCompanyAsync(Guid companyProfileId, ApproveCompanyRequest request, CancellationToken cancellationToken = default);
    Task RejectApprovedCompanyAsync(Guid companyProfileId, CancellationToken cancellationToken = default);
    Task DeleteRejectedCompanyAsync(Guid companyProfileId, CancellationToken cancellationToken = default);
}
