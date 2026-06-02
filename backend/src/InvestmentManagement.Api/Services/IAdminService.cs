using InvestmentManagement.Api.Contracts.Admin;

namespace InvestmentManagement.Api.Services;

public interface IAdminService
{
    Task UpdateProfileAsync(Guid adminUserId, UpdateAdminProfileRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PendingCompanyResponse>> GetPendingCompaniesAsync(CancellationToken cancellationToken = default);
    Task ApproveCompanyAsync(Guid companyProfileId, ApproveCompanyRequest request, CancellationToken cancellationToken = default);
}
