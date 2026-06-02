using InvestmentManagement.Api.Contracts.Auth;

namespace InvestmentManagement.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RegisterInvestorAsync(RegisterInvestorRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RegisterCompanyAsync(RegisterCompanyRequest request, CancellationToken cancellationToken = default);
}
