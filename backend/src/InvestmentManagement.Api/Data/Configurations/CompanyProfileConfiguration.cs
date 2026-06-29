using InvestmentManagement.Api.Domain.Entities;
using InvestmentManagement.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InvestmentManagement.Api.Data.Configurations;

public class CompanyProfileConfiguration : IEntityTypeConfiguration<CompanyProfile>
{
    public void Configure(EntityTypeBuilder<CompanyProfile> builder)
    {
        builder.ToTable("CompanyProfiles");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.CompanyName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.LegalName)
            .HasMaxLength(300);

        builder.Property(p => p.RegistrationNumber)
            .HasMaxLength(100);

        builder.Property(p => p.Description)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(p => p.Website)
            .HasMaxLength(2000);

        builder.Property(p => p.Phone)
            .HasMaxLength(20);

        builder.Property(p => p.ContactEmail)
            .HasMaxLength(256);

        builder.Property(p => p.Address)
            .HasMaxLength(500);

        builder.Property(p => p.City)
            .HasMaxLength(100);

        builder.Property(p => p.Country)
            .HasMaxLength(100);

        builder.Property(p => p.Industry)
            .HasMaxLength(100);

        builder.Property(p => p.DocumentationUrl)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(p => p.ApprovalStatus)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.HasIndex(p => p.UserId)
            .IsUnique();

        builder.HasMany(p => p.Campaigns)
            .WithOne(c => c.CompanyProfile)
            .HasForeignKey(c => c.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
