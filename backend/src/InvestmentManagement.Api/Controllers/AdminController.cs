using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using InvestmentManagement.Api.Contracts.Admin;
using InvestmentManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvestmentManagement.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController(IAdminService adminService) : ControllerBase
{
    [HttpPut("profile")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateAdminProfileRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await adminService.UpdateProfileAsync(GetUserId(), request, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("companies/pending")]
    [ProducesResponseType(typeof(IReadOnlyList<PendingCompanyResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PendingCompanyResponse>>> GetPendingCompanies(CancellationToken cancellationToken)
    {
        var companies = await adminService.GetPendingCompaniesAsync(cancellationToken);
        return Ok(companies);
    }

    [HttpPost("companies/{id:guid}/approve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveCompany(Guid id, [FromBody] ApproveCompanyRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await adminService.ApproveCompanyAsync(id, request, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
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
