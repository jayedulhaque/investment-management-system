using InvestmentManagement.Api.Domain.Entities;

namespace InvestmentManagement.Api.Services;

public interface IJwtTokenService
{
    (string Token, DateTime ExpiresAt) CreateToken(User user);
}
