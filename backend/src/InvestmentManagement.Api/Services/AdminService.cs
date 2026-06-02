using InvestmentManagement.Api.Contracts.Admin;
using InvestmentManagement.Api.Data;
using InvestmentManagement.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManagement.Api.Services;

public class AdminService(ApplicationDbContext db, IPasswordService passwordService) : IAdminService
{
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
            .OrderBy(p => p.User.Email)
            .Select(p => new PendingCompanyResponse
            {
                CompanyProfileId = p.Id,
                UserId = p.UserId,
                Email = p.User.Email,
                DocumentationUrl = p.DocumentationUrl,
                ApprovalStatus = p.ApprovalStatus.ToString()
            })
            .ToListAsync(cancellationToken);
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
}
