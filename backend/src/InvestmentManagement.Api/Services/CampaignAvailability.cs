using InvestmentManagement.Api.Domain.Entities;
using InvestmentManagement.Api.Domain.Enums;

namespace InvestmentManagement.Api.Services;

public static class CampaignAvailability
{
    public static void ApplyShareReservation(Campaign campaign, int reservedShares)
    {
        campaign.AvailableShares -= reservedShares;
        SyncAfterShareChange(campaign);
    }

    public static void RestoreShares(Campaign campaign, int shares)
    {
        campaign.AvailableShares = Math.Min(campaign.TotalShares, campaign.AvailableShares + shares);
        SyncAfterShareChange(campaign);
    }

    public static void SyncAfterShareChange(Campaign campaign)
    {
        if (campaign.PaymentStatus != PaymentStatus.Paid)
            return;

        campaign.IsActive = campaign.AvailableShares > 0;
    }

    public static bool IsClosed(Campaign campaign) =>
        campaign.PaymentStatus == PaymentStatus.Paid && !campaign.IsActive;
}
