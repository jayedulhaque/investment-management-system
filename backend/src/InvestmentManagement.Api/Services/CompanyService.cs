using System.ComponentModel.DataAnnotations;
using InvestmentManagement.Api.Contracts.Companies;
using InvestmentManagement.Api.Data;
using InvestmentManagement.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManagement.Api.Services;

public class CompanyService(ApplicationDbContext db) : ICompanyService
{
    public async Task<CompanyProfileResponse> GetProfileAsync(
        Guid companyUserId,
        CancellationToken cancellationToken = default)
    {
        var user = await db.Users
            .AsNoTracking()
            .Include(u => u.CompanyProfile)
            .FirstOrDefaultAsync(u => u.Id == companyUserId && u.Role == UserRole.Company, cancellationToken)
            ?? throw new UnauthorizedAccessException("Company user not found.");

        var profile = user.CompanyProfile
            ?? throw new InvalidOperationException("Company profile not found.");

        return MapProfile(user.Email, profile);
    }

    public async Task UpdateProfileAsync(
        Guid companyUserId,
        UpdateCompanyProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateProfileRequest(request);

        var user = await db.Users
            .Include(u => u.CompanyProfile)
            .FirstOrDefaultAsync(u => u.Id == companyUserId && u.Role == UserRole.Company, cancellationToken)
            ?? throw new UnauthorizedAccessException("Company user not found.");

        var profile = user.CompanyProfile
            ?? throw new InvalidOperationException("Company profile not found.");

        profile.CompanyName = request.CompanyName.Trim();
        profile.LegalName = TrimOrNull(request.LegalName);
        profile.RegistrationNumber = TrimOrNull(request.RegistrationNumber);
        profile.Description = request.Description.Trim();
        profile.Website = TrimOrNull(request.Website);
        profile.Phone = TrimOrNull(request.Phone);
        profile.ContactEmail = NormalizeOptionalEmail(request.ContactEmail);
        profile.Address = TrimOrNull(request.Address);
        profile.City = TrimOrNull(request.City);
        profile.Country = TrimOrNull(request.Country);
        profile.Industry = TrimOrNull(request.Industry);
        profile.DocumentationUrl = request.DocumentationUrl.Trim();

        await db.SaveChangesAsync(cancellationToken);
    }

    private static void ValidateProfileRequest(UpdateCompanyProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CompanyName))
            throw new InvalidOperationException("Company name is required.");

        if (string.IsNullOrWhiteSpace(request.Description))
            throw new InvalidOperationException("Company description is required.");

        ValidateOptionalUrl(request.Website, "Website");
        ValidateRequiredUrl(request.DocumentationUrl, "Documentation URL");

        var contactEmail = TrimOrNull(request.ContactEmail);
        if (contactEmail is not null && !new EmailAddressAttribute().IsValid(contactEmail))
            throw new InvalidOperationException("Contact email is not valid.");
    }

    private static void ValidateOptionalUrl(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        ValidateRequiredUrl(value, fieldName);
    }

    private static void ValidateRequiredUrl(string value, string fieldName)
    {
        var trimmed = value.Trim();
        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new InvalidOperationException(
                $"{fieldName} must be a valid http or https URL (e.g. https://example.com/docs).");
        }
    }

    private static CompanyProfileResponse MapProfile(string email, Domain.Entities.CompanyProfile profile) =>
        new()
        {
            Email = email,
            ApprovalStatus = profile.ApprovalStatus.ToString(),
            CompanyName = profile.CompanyName,
            LegalName = profile.LegalName,
            RegistrationNumber = profile.RegistrationNumber,
            Description = profile.Description,
            Website = profile.Website,
            Phone = profile.Phone,
            ContactEmail = profile.ContactEmail,
            Address = profile.Address,
            City = profile.City,
            Country = profile.Country,
            Industry = profile.Industry,
            DocumentationUrl = profile.DocumentationUrl,
        };

    private static string? NormalizeOptionalEmail(string? email) =>
        string.IsNullOrWhiteSpace(email) ? null : email.Trim().ToLowerInvariant();

    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
