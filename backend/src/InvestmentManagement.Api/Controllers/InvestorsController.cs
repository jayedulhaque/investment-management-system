using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using InvestmentManagement.Api.Contracts.Investors;
using InvestmentManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvestmentManagement.Api.Controllers;

[ApiController]
[Route("api/investors")]
public class InvestorsController(IInvestorService investorService) : ControllerBase
{
    [HttpGet("profile")]
    [Authorize(Policy = "InvestorOnly")]
    [ProducesResponseType(typeof(InvestorProfileResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<InvestorProfileResponse>> GetProfile(CancellationToken cancellationToken)
    {
        return Ok(await investorService.GetProfileAsync(GetUserId(), cancellationToken));
    }

    [HttpPut("profile")]
    [Authorize(Policy = "InvestorOnly")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateInvestorProfileRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await investorService.UpdateProfileAsync(GetUserId(), request, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (sub is null || !Guid.TryParse(sub, out var userId))
            throw new UnauthorizedAccessException("Invalid token subject.");

        return userId;
    }
}
