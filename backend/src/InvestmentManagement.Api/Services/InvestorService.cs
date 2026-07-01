using System.ComponentModel.DataAnnotations;
using InvestmentManagement.Api.Contracts.Investors;
using InvestmentManagement.Api.Data;
using InvestmentManagement.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManagement.Api.Services;

public class InvestorService(ApplicationDbContext db) : IInvestorService
{
    public async Task<InvestorProfileResponse> GetProfileAsync(
        Guid investorUserId,
        CancellationToken cancellationToken = default)
    {
        var user = await db.Users
            .Include(u => u.InvestorProfile)
            .FirstOrDefaultAsync(u => u.Id == investorUserId && u.Role == UserRole.Investor, cancellationToken)
            ?? throw new UnauthorizedAccessException("Investor user not found.");

        var profile = user.InvestorProfile ?? await CreateDefaultProfileAsync(user, cancellationToken);

        return MapProfile(user.Email, user.IsActive, profile);
    }

    public async Task UpdateProfileAsync(
        Guid investorUserId,
        UpdateInvestorProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateProfileRequest(request);

        var user = await db.Users
            .Include(u => u.InvestorProfile)
            .FirstOrDefaultAsync(u => u.Id == investorUserId && u.Role == UserRole.Investor, cancellationToken)
            ?? throw new UnauthorizedAccessException("Investor user not found.");

        var profile = user.InvestorProfile ?? await CreateDefaultProfileAsync(user, cancellationToken);

        profile.FullName = request.FullName.Trim();
        profile.Phone = request.Phone.Trim();
        profile.NationalId = request.NationalId.Trim();
        profile.DateOfBirth = request.DateOfBirth;
        profile.Occupation = TrimOrNull(request.Occupation);
        profile.Address = request.Address.Trim();
        profile.City = request.City.Trim();
        profile.Country = request.Country.Trim();
        profile.ContactEmail = NormalizeOptionalEmail(request.ContactEmail);

        await db.SaveChangesAsync(cancellationToken);
    }

    private static void ValidateProfileRequest(UpdateInvestorProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new InvalidOperationException("Full name is required.");

        if (string.IsNullOrWhiteSpace(request.Phone))
            throw new InvalidOperationException("Phone is required.");

        if (string.IsNullOrWhiteSpace(request.NationalId))
            throw new InvalidOperationException("National ID is required.");

        if (string.IsNullOrWhiteSpace(request.Address))
            throw new InvalidOperationException("Address is required.");

        if (string.IsNullOrWhiteSpace(request.City))
            throw new InvalidOperationException("City is required.");

        if (string.IsNullOrWhiteSpace(request.Country))
            throw new InvalidOperationException("Country is required.");

        var contactEmail = TrimOrNull(request.ContactEmail);
        if (contactEmail is not null && !new EmailAddressAttribute().IsValid(contactEmail))
            throw new InvalidOperationException("Contact email is not valid.");
    }

    private async Task<Domain.Entities.InvestorProfile> CreateDefaultProfileAsync(
        Domain.Entities.User user,
        CancellationToken cancellationToken)
    {
        var profile = new Domain.Entities.InvestorProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Country = "Bangladesh"
        };

        db.InvestorProfiles.Add(profile);
        await db.SaveChangesAsync(cancellationToken);
        user.InvestorProfile = profile;
        return profile;
    }

    private static InvestorProfileResponse MapProfile(
        string email,
        bool isActive,
        Domain.Entities.InvestorProfile profile) =>
        new()
        {
            Email = email,
            IsActive = isActive,
            FullName = profile.FullName,
            Phone = profile.Phone,
            NationalId = profile.NationalId,
            DateOfBirth = profile.DateOfBirth?.ToString("yyyy-MM-dd"),
            Occupation = profile.Occupation,
            Address = profile.Address,
            City = profile.City,
            Country = profile.Country,
            ContactEmail = profile.ContactEmail,
        };

    private static string? NormalizeOptionalEmail(string? email) =>
        string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();

    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
