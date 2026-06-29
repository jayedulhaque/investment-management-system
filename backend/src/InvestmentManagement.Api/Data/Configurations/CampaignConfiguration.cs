using InvestmentManagement.Api.Domain.Entities;
using InvestmentManagement.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InvestmentManagement.Api.Data.Configurations;

public class CampaignConfiguration : IEntityTypeConfiguration<Campaign>
{
    public void Configure(EntityTypeBuilder<Campaign> builder)
    {
        builder.ToTable("Campaigns");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.EquityPercentageOffered)
            .HasPrecision(5, 2);

        builder.Property(c => c.PricePerShare)
            .HasPrecision(18, 2);

        builder.Property(c => c.MinInvestmentThreshold)
            .HasPrecision(18, 2);

        builder.Property(c => c.PaymentStatus)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(c => c.BKashTransactionId)
            .HasMaxLength(100);

        builder.Property(c => c.IsActive)
            .HasDefaultValue(false);

        builder.HasMany(c => c.Bookings)
            .WithOne(b => b.Campaign)
            .HasForeignKey(b => b.CampaignId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
