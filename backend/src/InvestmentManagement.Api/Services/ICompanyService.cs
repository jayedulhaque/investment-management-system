using InvestmentManagement.Api.Contracts.Companies;

namespace InvestmentManagement.Api.Services;

public interface ICompanyService
{
    Task<CompanyProfileResponse> GetProfileAsync(Guid companyUserId, CancellationToken cancellationToken = default);
    Task UpdateProfileAsync(Guid companyUserId, UpdateCompanyProfileRequest request, CancellationToken cancellationToken = default);
}
