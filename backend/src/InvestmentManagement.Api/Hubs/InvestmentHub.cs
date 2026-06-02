using System.Security.Claims;
using InvestmentManagement.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace InvestmentManagement.Api.Hubs;

[Authorize]
public class InvestmentHub : Hub
{
    public const string CampaignActivatedEvent = "CampaignActivated";

    public override async Task OnConnectedAsync()
    {
        var role = Context.User?.FindFirstValue(ClaimTypes.Role);

        if (Enum.TryParse<UserRole>(role, ignoreCase: true, out var userRole))
        {
            var group = userRole switch
            {
                UserRole.Investor => HubGroups.Investors,
                UserRole.Company => HubGroups.Companies,
                UserRole.Admin => HubGroups.Admins,
                _ => null
            };

            if (group is not null)
                await Groups.AddToGroupAsync(Context.ConnectionId, group);
        }

        await base.OnConnectedAsync();
    }
}
