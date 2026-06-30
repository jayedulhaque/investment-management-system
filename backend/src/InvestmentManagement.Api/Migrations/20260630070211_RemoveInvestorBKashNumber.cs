using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvestmentManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveInvestorBKashNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BKashNumber",
                table: "InvestorProfiles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BKashNumber",
                table: "InvestorProfiles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }
    }
}
