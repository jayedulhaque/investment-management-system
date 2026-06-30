using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using InvestmentManagement.Api.Contracts.Admin;
using InvestmentManagement.Api.Contracts.Common;
using InvestmentManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvestmentManagement.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Policy = "AdminOnly")]
public class AdminController(IAdminService adminService) : ControllerBase
{
    [HttpGet("profile")]
    [ProducesResponseType(typeof(AdminProfileResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminProfileResponse>> GetProfile(CancellationToken cancellationToken)
    {
        return Ok(await adminService.GetProfileAsync(GetUserId(), cancellationToken));
    }

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
    [ProducesResponseType(typeof(PagedResponse<PendingCompanyResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<PendingCompanyResponse>>> GetPendingCompanies(
        [FromQuery] CompanyListQuery query,
        CancellationToken cancellationToken)
    {
        return Ok(await adminService.GetPendingCompaniesAsync(query, cancellationToken));
    }

    [HttpGet("companies/approved")]
    [ProducesResponseType(typeof(PagedResponse<ApprovedCompanyResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<ApprovedCompanyResponse>>> GetApprovedCompanies(
        [FromQuery] CompanyListQuery query,
        CancellationToken cancellationToken)
    {
        return Ok(await adminService.GetApprovedCompaniesAsync(query, cancellationToken));
    }

    [HttpGet("companies/rejected")]
    [ProducesResponseType(typeof(PagedResponse<RejectedCompanyResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<RejectedCompanyResponse>>> GetRejectedCompanies(
        [FromQuery] CompanyListQuery query,
        CancellationToken cancellationToken)
    {
        return Ok(await adminService.GetRejectedCompaniesAsync(query, cancellationToken));
    }

    [HttpGet("companies/{id:guid}")]
    [ProducesResponseType(typeof(CompanyDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CompanyDetailResponse>> GetCompany(Guid id, CancellationToken cancellationToken)
    {
        var company = await adminService.GetCompanyByIdAsync(id, cancellationToken);
        return company is null ? NotFound() : Ok(company);
    }

    [HttpGet("investors")]
    [ProducesResponseType(typeof(IReadOnlyList<InvestorSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<InvestorSummaryResponse>>> GetInvestors(CancellationToken cancellationToken)
    {
        return Ok(await adminService.GetInvestorsAsync(cancellationToken));
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

    [HttpPost("companies/{id:guid}/reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectApprovedCompany(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await adminService.RejectApprovedCompanyAsync(id, cancellationToken);
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

    [HttpDelete("companies/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRejectedCompany(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await adminService.DeleteRejectedCompanyAsync(id, cancellationToken);
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
