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
        var email = NormalizeEmail(request.Email);
        var user = await db.Users
            .AsNoTracking()
            .Include(u => u.CompanyProfile)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

        if (user is null || !passwordService.VerifyPassword(user, request.Password))
            throw new UnauthorizedAccessException("Invalid email or password.");

        EnsureCompanyCanLogin(user);

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

        var profile = new InvestorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            FullName = request.FullName.Trim(),
            Phone = request.Phone.Trim(),
            NationalId = request.NationalId.Trim(),
            DateOfBirth = request.DateOfBirth,
            Occupation = TrimOrNull(request.Occupation),
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            Country = request.Country.Trim(),
            ContactEmail = NormalizeOptionalEmail(request.ContactEmail)
        };

        db.Users.Add(user);
        db.InvestorProfiles.Add(profile);
        await db.SaveChangesAsync(cancellationToken);

        return BuildAuthResponse(user);
    }

    public async Task<RegisterCompanyResponse> RegisterCompanyAsync(RegisterCompanyRequest request, CancellationToken cancellationToken = default)
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
            CompanyName = request.CompanyName.Trim(),
            LegalName = TrimOrNull(request.LegalName),
            RegistrationNumber = TrimOrNull(request.RegistrationNumber),
            Description = request.Description.Trim(),
            Website = TrimOrNull(request.Website),
            Phone = TrimOrNull(request.Phone),
            ContactEmail = NormalizeOptionalEmail(request.ContactEmail),
            Address = TrimOrNull(request.Address),
            City = TrimOrNull(request.City),
            Country = TrimOrNull(request.Country),
            Industry = TrimOrNull(request.Industry),
            DocumentationUrl = request.DocumentationUrl.Trim(),
            ApprovalStatus = ApprovalStatus.Pending
        };

        db.Users.Add(user);
        db.CompanyProfiles.Add(profile);
        await db.SaveChangesAsync(cancellationToken);

        return new RegisterCompanyResponse
        {
            Message = "Registration submitted. An admin will review your company. You can sign in after approval.",
            Email = user.Email,
            CompanyName = profile.CompanyName,
            ApprovalStatus = profile.ApprovalStatus.ToString()
        };
    }

    private static void EnsureCompanyCanLogin(User user)
    {
        if (user.Role != UserRole.Company)
            return;

        var profile = user.CompanyProfile
            ?? throw new UnauthorizedAccessException("Company profile not found.");

        switch (profile.ApprovalStatus)
        {
            case ApprovalStatus.Pending:
                throw new UnauthorizedAccessException(
                    "Your company registration is awaiting admin approval. You can sign in after approval.");
            case ApprovalStatus.Rejected:
                throw new UnauthorizedAccessException("Your company registration was rejected.");
        }
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

    private static string? NormalizeOptionalEmail(string? email) =>
        string.IsNullOrWhiteSpace(email) ? null : NormalizeEmail(email);

    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private async Task EnsureEmailAvailableAsync(string email, CancellationToken cancellationToken)
    {
        if (await db.Users.AnyAsync(u => u.Email == email, cancellationToken))
            throw new InvalidOperationException("Email is already registered.");
    }
}
