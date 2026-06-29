using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvestmentManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyProfileDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "CompanyProfiles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "CompanyProfiles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanyName",
                table: "CompanyProfiles",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ContactEmail",
                table: "CompanyProfiles",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "CompanyProfiles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "CompanyProfiles",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Industry",
                table: "CompanyProfiles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalName",
                table: "CompanyProfiles",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "CompanyProfiles",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegistrationNumber",
                table: "CompanyProfiles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "CompanyProfiles",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "CompanyProfiles" cp
                SET "CompanyName" = u."Email"
                FROM "Users" u
                WHERE cp."UserId" = u."Id" AND cp."CompanyName" = '';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "City",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "CompanyName",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "ContactEmail",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "Industry",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "LegalName",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "RegistrationNumber",
                table: "CompanyProfiles");

            migrationBuilder.DropColumn(
                name: "Website",
                table: "CompanyProfiles");
        }
    }
}
