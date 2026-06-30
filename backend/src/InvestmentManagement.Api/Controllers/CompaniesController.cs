using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using InvestmentManagement.Api.Contracts.Campaigns;
using InvestmentManagement.Api.Contracts.Companies;
using InvestmentManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvestmentManagement.Api.Controllers;

[ApiController]
[Route("api/companies")]
public class CompaniesController(ICampaignService campaignService, ICompanyService companyService) : ControllerBase
{
    [HttpGet("profile")]
    [Authorize(Policy = "CompanyOnly")]
    [ProducesResponseType(typeof(CompanyProfileResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CompanyProfileResponse>> GetProfile(CancellationToken cancellationToken)
    {
        return Ok(await companyService.GetProfileAsync(GetUserId(), cancellationToken));
    }

    [HttpPut("profile")]
    [Authorize(Policy = "CompanyOnly")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateCompanyProfileRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await companyService.UpdateProfileAsync(GetUserId(), request, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:guid}/public")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CompanyPublicResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CompanyPublicResponse>> GetPublic(Guid id, CancellationToken cancellationToken)
    {
        var company = await campaignService.GetPublicCompanyAsync(id, cancellationToken);
        return company is null ? NotFound() : Ok(company);
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
