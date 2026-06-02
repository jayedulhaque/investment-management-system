using InvestmentManagement.Api.Domain.Entities;
using InvestmentManagement.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InvestmentManagement.Api.Data;

public static class SeedData
{
    public static readonly Guid AdminUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public const string AdminEmail = "admin@investment.local";
    public const string AdminPassword = "Admin@12345";
    public const string AdminBKashNumber = "01700000000";

    // Precomputed with Microsoft.AspNetCore.Identity.PasswordHasher<User> for Admin@12345
    public const string AdminPasswordHash =
        "AQAAAAIAAYagAAAAEOMOKl5MELwHbw57qyzQXyhK3yJUIP/CflvMivG0WKV8D9ZeCDjCrVQR62sHhylLdA==";

    public static void ConfigureSeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = AdminUserId,
            Email = AdminEmail,
            PasswordHash = AdminPasswordHash,
            Role = UserRole.Admin,
            BKashNumber = AdminBKashNumber
        });
    }
}
