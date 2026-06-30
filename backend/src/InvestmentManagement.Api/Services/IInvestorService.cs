using InvestmentManagement.Api.Contracts.Investors;

namespace InvestmentManagement.Api.Services;

public interface IInvestorService
{
    Task<InvestorProfileResponse> GetProfileAsync(Guid investorUserId, CancellationToken cancellationToken = default);
    Task UpdateProfileAsync(Guid investorUserId, UpdateInvestorProfileRequest request, CancellationToken cancellationToken = default);
}
