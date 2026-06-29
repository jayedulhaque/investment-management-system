using InvestmentManagement.Api.Contracts.Admin;
using InvestmentManagement.Api.Data;
using InvestmentManagement.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManagement.Api.Services;

public class AdminService(ApplicationDbContext db, IPasswordService passwordService) : IAdminService
{
    public async Task<AdminProfileResponse> GetProfileAsync(Guid adminUserId, CancellationToken cancellationToken = default)
    {
        var admin = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == adminUserId && u.Role == UserRole.Admin, cancellationToken)
            ?? throw new UnauthorizedAccessException("Admin user not found.");

        return new AdminProfileResponse
        {
            Email = admin.Email,
            BKashNumber = admin.BKashNumber ?? string.Empty,
        };
    }

    public async Task UpdateProfileAsync(Guid adminUserId, UpdateAdminProfileRequest request, CancellationToken cancellationToken = default)
    {
        var admin = await db.Users.FirstOrDefaultAsync(u => u.Id == adminUserId && u.Role == UserRole.Admin, cancellationToken)
            ?? throw new UnauthorizedAccessException("Admin user not found.");

        var email = request.Email.Trim().ToLowerInvariant();
        if (email != admin.Email &&
            await db.Users.AnyAsync(u => u.Email == email && u.Id != adminUserId, cancellationToken))
        {
            throw new InvalidOperationException("Email is already in use.");
        }

        admin.Email = email;
        admin.BKashNumber = request.BKashNumber.Trim();

        if (!string.IsNullOrWhiteSpace(request.Password))
            admin.PasswordHash = passwordService.HashPassword(admin, request.Password);

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PendingCompanyResponse>> GetPendingCompaniesAsync(CancellationToken cancellationToken = default)
    {
        return await db.CompanyProfiles
            .AsNoTracking()
            .Where(p => p.ApprovalStatus == ApprovalStatus.Pending)
            .Include(p => p.User)
            .OrderBy(p => p.CompanyName)
            .Select(p => new PendingCompanyResponse
            {
                CompanyProfileId = p.Id,
                UserId = p.UserId,
                Email = p.User.Email,
                CompanyName = p.CompanyName,
                LegalName = p.LegalName,
                RegistrationNumber = p.RegistrationNumber,
                Description = p.Description,
                Website = p.Website,
                Phone = p.Phone,
                ContactEmail = p.ContactEmail,
                Address = p.Address,
                City = p.City,
                Country = p.Country,
                Industry = p.Industry,
                DocumentationUrl = p.DocumentationUrl,
                ApprovalStatus = p.ApprovalStatus.ToString()
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ApprovedCompanyResponse>> GetApprovedCompaniesAsync(
        CancellationToken cancellationToken = default)
    {
        return await db.CompanyProfiles
            .AsNoTracking()
            .Where(p => p.ApprovalStatus == ApprovalStatus.Approved)
            .Include(p => p.User)
            .OrderBy(p => p.CompanyName)
            .Select(p => new ApprovedCompanyResponse
            {
                CompanyProfileId = p.Id,
                UserId = p.UserId,
                Email = p.User.Email,
                CompanyName = p.CompanyName,
                LegalName = p.LegalName,
                RegistrationNumber = p.RegistrationNumber,
                Description = p.Description,
                Website = p.Website,
                Phone = p.Phone,
                ContactEmail = p.ContactEmail,
                Address = p.Address,
                City = p.City,
                Country = p.Country,
                Industry = p.Industry,
                DocumentationUrl = p.DocumentationUrl,
                ApprovalStatus = p.ApprovalStatus.ToString()
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RejectedCompanyResponse>> GetRejectedCompaniesAsync(
        CancellationToken cancellationToken = default)
    {
        return await db.CompanyProfiles
            .AsNoTracking()
            .Where(p => p.ApprovalStatus == ApprovalStatus.Rejected)
            .Include(p => p.User)
            .OrderBy(p => p.CompanyName)
            .Select(p => new RejectedCompanyResponse
            {
                CompanyProfileId = p.Id,
                UserId = p.UserId,
                Email = p.User.Email,
                CompanyName = p.CompanyName,
                LegalName = p.LegalName,
                RegistrationNumber = p.RegistrationNumber,
                Description = p.Description,
                Website = p.Website,
                Phone = p.Phone,
                ContactEmail = p.ContactEmail,
                Address = p.Address,
                City = p.City,
                Country = p.Country,
                Industry = p.Industry,
                DocumentationUrl = p.DocumentationUrl,
                ApprovalStatus = p.ApprovalStatus.ToString()
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<InvestorSummaryResponse>> GetInvestorsAsync(
        CancellationToken cancellationToken = default)
    {
        return await db.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Investor)
            .OrderBy(u => u.Email)
            .Select(u => new InvestorSummaryResponse
            {
                UserId = u.Id,
                Email = u.Email
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<CompanyDetailResponse?> GetCompanyByIdAsync(
        Guid companyProfileId,
        CancellationToken cancellationToken = default)
    {
        return await db.CompanyProfiles
            .AsNoTracking()
            .Include(p => p.User)
            .Where(p => p.Id == companyProfileId)
            .Select(p => new CompanyDetailResponse
            {
                CompanyProfileId = p.Id,
                UserId = p.UserId,
                Email = p.User.Email,
                CompanyName = p.CompanyName,
                LegalName = p.LegalName,
                RegistrationNumber = p.RegistrationNumber,
                Description = p.Description,
                Website = p.Website,
                Phone = p.Phone,
                ContactEmail = p.ContactEmail,
                Address = p.Address,
                City = p.City,
                Country = p.Country,
                Industry = p.Industry,
                DocumentationUrl = p.DocumentationUrl,
                ApprovalStatus = p.ApprovalStatus.ToString()
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task ApproveCompanyAsync(Guid companyProfileId, ApproveCompanyRequest request, CancellationToken cancellationToken = default)
    {
        var profile = await db.CompanyProfiles
            .FirstOrDefaultAsync(p => p.Id == companyProfileId, cancellationToken)
            ?? throw new KeyNotFoundException("Company profile not found.");

        if (profile.ApprovalStatus != ApprovalStatus.Pending)
            throw new InvalidOperationException("Company profile is not pending approval.");

        profile.ApprovalStatus = request.Approve ? ApprovalStatus.Approved : ApprovalStatus.Rejected;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task RejectApprovedCompanyAsync(Guid companyProfileId, CancellationToken cancellationToken = default)
    {
        var profile = await db.CompanyProfiles
            .FirstOrDefaultAsync(p => p.Id == companyProfileId, cancellationToken)
            ?? throw new KeyNotFoundException("Company profile not found.");

        if (profile.ApprovalStatus != ApprovalStatus.Approved)
            throw new InvalidOperationException("Only approved companies can be rejected.");

        profile.ApprovalStatus = ApprovalStatus.Rejected;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteRejectedCompanyAsync(Guid companyProfileId, CancellationToken cancellationToken = default)
    {
        var profile = await db.CompanyProfiles
            .Include(p => p.User)
            .Include(p => p.Campaigns)
            .FirstOrDefaultAsync(p => p.Id == companyProfileId, cancellationToken)
            ?? throw new KeyNotFoundException("Company profile not found.");

        if (profile.ApprovalStatus != ApprovalStatus.Rejected)
            throw new InvalidOperationException("Only rejected companies can be deleted.");

        if (profile.Campaigns.Count > 0)
            throw new InvalidOperationException("Cannot delete a company that has campaigns.");

        db.Users.Remove(profile.User);
        await db.SaveChangesAsync(cancellationToken);
    }
}
