using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using InvestmentManagement.Api.Data;
using InvestmentManagement.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManagement.Api.Authorization;

public class ApprovedCompanyAuthorizationHandler(ApplicationDbContext db)
    : AuthorizationHandler<ApprovedCompanyRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ApprovedCompanyRequirement requirement)
    {
        if (!context.User.IsInRole(nameof(UserRole.Company)))
            return;

        var sub = context.User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? context.User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (sub is null || !Guid.TryParse(sub, out var userId))
            return;

        var approved = await db.CompanyProfiles
            .AsNoTracking()
            .AnyAsync(p => p.UserId == userId && p.ApprovalStatus == ApprovalStatus.Approved);

        if (approved)
            context.Succeed(requirement);
    }
}
