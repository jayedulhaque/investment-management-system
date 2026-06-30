using InvestmentManagement.Api.Contracts.Admin;
using InvestmentManagement.Api.Contracts.Common;
using InvestmentManagement.Api.Data;
using InvestmentManagement.Api.Domain.Entities;
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

    public async Task<PagedResponse<PendingCompanyResponse>> GetPendingCompaniesAsync(
        CompanyListQuery query,
        CancellationToken cancellationToken = default)
    {
        return await GetCompaniesPagedAsync<PendingCompanyResponse>(
            ApprovalStatus.Pending,
            query,
            p => new PendingCompanyResponse
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
            },
            cancellationToken);
    }

    public async Task<PagedResponse<ApprovedCompanyResponse>> GetApprovedCompaniesAsync(
        CompanyListQuery query,
        CancellationToken cancellationToken = default)
    {
        return await GetCompaniesPagedAsync<ApprovedCompanyResponse>(
            ApprovalStatus.Approved,
            query,
            p => new ApprovedCompanyResponse
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
            },
            cancellationToken);
    }

    public async Task<PagedResponse<RejectedCompanyResponse>> GetRejectedCompaniesAsync(
        CompanyListQuery query,
        CancellationToken cancellationToken = default)
    {
        return await GetCompaniesPagedAsync<RejectedCompanyResponse>(
            ApprovalStatus.Rejected,
            query,
            p => new RejectedCompanyResponse
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
            },
            cancellationToken);
    }

    private async Task<PagedResponse<T>> GetCompaniesPagedAsync<T>(
        ApprovalStatus status,
        CompanyListQuery query,
        System.Linq.Expressions.Expression<Func<CompanyProfile, T>> selector,
        CancellationToken cancellationToken)
    {
        var (page, pageSize) = NormalizePaging(query);
        var filtered = ApplyCompanyListFilters(
            db.CompanyProfiles.AsNoTracking().Where(p => p.ApprovalStatus == status),
            query);

        var totalCount = await filtered.CountAsync(cancellationToken);
        var items = await filtered
            .OrderBy(p => p.CompanyName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(selector)
            .ToListAsync(cancellationToken);

        return new PagedResponse<T>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    private static (int Page, int PageSize) NormalizePaging(CompanyListQuery query)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 50);
        return (page, pageSize);
    }

    private static IQueryable<CompanyProfile> ApplyCompanyListFilters(
        IQueryable<CompanyProfile> query,
        CompanyListQuery listQuery)
    {
        if (!string.IsNullOrWhiteSpace(listQuery.Search))
        {
            var term = listQuery.Search.Trim().ToLower();
            query = query.Where(p =>
                p.CompanyName.ToLower().Contains(term) ||
                p.User.Email.ToLower().Contains(term) ||
                (p.LegalName != null && p.LegalName.ToLower().Contains(term)) ||
                (p.Industry != null && p.Industry.ToLower().Contains(term)) ||
                (p.City != null && p.City.ToLower().Contains(term)) ||
                (p.Country != null && p.Country.ToLower().Contains(term)) ||
                (p.RegistrationNumber != null && p.RegistrationNumber.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(listQuery.Industry))
        {
            var industry = listQuery.Industry.Trim().ToLower();
            query = query.Where(p => p.Industry != null && p.Industry.ToLower().Contains(industry));
        }

        return query;
    }

    public async Task<IReadOnlyList<InvestorSummaryResponse>> GetInvestorsAsync(
        CancellationToken cancellationToken = default)
    {
        return await db.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Investor)
            .Include(u => u.InvestorProfile)
            .OrderBy(u => u.Email)
            .Select(u => new InvestorSummaryResponse
            {
                UserId = u.Id,
                Email = u.Email,
                FullName = u.InvestorProfile != null ? u.InvestorProfile.FullName : string.Empty,
                Phone = u.InvestorProfile != null ? u.InvestorProfile.Phone : string.Empty,
                NationalId = u.InvestorProfile != null ? u.InvestorProfile.NationalId : string.Empty,
                DateOfBirth = u.InvestorProfile != null && u.InvestorProfile.DateOfBirth != null
                    ? u.InvestorProfile.DateOfBirth.Value.ToString("yyyy-MM-dd")
                    : null,
                Occupation = u.InvestorProfile != null ? u.InvestorProfile.Occupation : null,
                Address = u.InvestorProfile != null ? u.InvestorProfile.Address : string.Empty,
                City = u.InvestorProfile != null ? u.InvestorProfile.City : string.Empty,
                Country = u.InvestorProfile != null ? u.InvestorProfile.Country : string.Empty,
                ContactEmail = u.InvestorProfile != null ? u.InvestorProfile.ContactEmail : null
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
