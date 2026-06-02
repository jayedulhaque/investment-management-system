using InvestmentManagement.Api.Contracts.Auth;
using InvestmentManagement.Api.Data;
using InvestmentManagement.Api.Domain.Entities;
using InvestmentManagement.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManagement.Api.Services;

public class AuthService(
    ApplicationDbContext db,
    IPasswordService passwordService,
    IJwtTokenService jwtTokenService) : IAuthService
{
    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant(), cancellationToken);

        if (user is null || !passwordService.VerifyPassword(user, request.Password))
            throw new UnauthorizedAccessException("Invalid email or password.");

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponse> RegisterInvestorAsync(RegisterInvestorRequest request, CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(request.Email);
        await EnsureEmailAvailableAsync(email, cancellationToken);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Role = UserRole.Investor
        };
        user.PasswordHash = passwordService.HashPassword(user, request.Password);

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponse> RegisterCompanyAsync(RegisterCompanyRequest request, CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(request.Email);
        await EnsureEmailAvailableAsync(email, cancellationToken);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Role = UserRole.Company
        };
        user.PasswordHash = passwordService.HashPassword(user, request.Password);

        var profile = new CompanyProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            DocumentationUrl = request.DocumentationUrl.Trim(),
            ApprovalStatus = ApprovalStatus.Pending
        };

        db.Users.Add(user);
        db.CompanyProfiles.Add(profile);
        await db.SaveChangesAsync(cancellationToken);

        return BuildAuthResponse(user);
    }

    private AuthResponse BuildAuthResponse(User user)
    {
        var (token, expiresAt) = jwtTokenService.CreateToken(user);
        return new AuthResponse
        {
            AccessToken = token,
            ExpiresAt = expiresAt,
            Email = user.Email,
            Role = user.Role.ToString(),
            UserId = user.Id
        };
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private async Task EnsureEmailAvailableAsync(string email, CancellationToken cancellationToken)
    {
        if (await db.Users.AnyAsync(u => u.Email == email, cancellationToken))
            throw new InvalidOperationException("Email is already registered.");
    }
}
