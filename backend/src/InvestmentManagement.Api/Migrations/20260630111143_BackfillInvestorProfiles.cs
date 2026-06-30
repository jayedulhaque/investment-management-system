using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvestmentManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class BackfillInvestorProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO "InvestorProfiles" ("Id", "UserId", "FullName", "Phone", "NationalId", "Address", "City", "Country")
                SELECT gen_random_uuid(), u."Id", '', '', '', '', '', 'Bangladesh'
                FROM "Users" u
                LEFT JOIN "InvestorProfiles" ip ON ip."UserId" = u."Id"
                WHERE u."Role" = 'Investor' AND ip."Id" IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
