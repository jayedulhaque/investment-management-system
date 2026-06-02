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
