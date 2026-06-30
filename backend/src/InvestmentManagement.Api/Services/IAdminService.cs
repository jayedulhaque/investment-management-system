using InvestmentManagement.Api.Contracts.Admin;
using InvestmentManagement.Api.Contracts.Common;

namespace InvestmentManagement.Api.Services;

public interface IAdminService
{
    Task<AdminProfileResponse> GetProfileAsync(Guid adminUserId, CancellationToken cancellationToken = default);
    Task UpdateProfileAsync(Guid adminUserId, UpdateAdminProfileRequest request, CancellationToken cancellationToken = default);
    Task<PagedResponse<PendingCompanyResponse>> GetPendingCompaniesAsync(CompanyListQuery query, CancellationToken cancellationToken = default);
    Task<PagedResponse<ApprovedCompanyResponse>> GetApprovedCompaniesAsync(CompanyListQuery query, CancellationToken cancellationToken = default);
    Task<PagedResponse<RejectedCompanyResponse>> GetRejectedCompaniesAsync(CompanyListQuery query, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InvestorSummaryResponse>> GetInvestorsAsync(CancellationToken cancellationToken = default);
    Task<CompanyDetailResponse?> GetCompanyByIdAsync(Guid companyProfileId, CancellationToken cancellationToken = default);
    Task ApproveCompanyAsync(Guid companyProfileId, ApproveCompanyRequest request, CancellationToken cancellationToken = default);
    Task RejectApprovedCompanyAsync(Guid companyProfileId, CancellationToken cancellationToken = default);
    Task DeleteRejectedCompanyAsync(Guid companyProfileId, CancellationToken cancellationToken = default);
}
