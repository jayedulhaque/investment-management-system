using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvestmentManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEquityPercentageOffered : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "EquityPercentageOffered",
                table: "Campaigns",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 100m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EquityPercentageOffered",
                table: "Campaigns");
        }
    }
}
