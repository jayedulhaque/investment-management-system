using InvestmentManagement.Api.Data;
using InvestmentManagement.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManagement.Api.Services;

public class AdminBkashResolver(ApplicationDbContext db) : IAdminBkashResolver
{
    public async Task<string> GetReceivingBkashNumberAsync(CancellationToken cancellationToken = default)
    {
        var number = await db.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRole.Admin)
            .Select(u => u.BKashNumber)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(number))
            throw new InvalidOperationException("Admin bKash receiving number is not configured.");

        return number.Trim();
    }
}
