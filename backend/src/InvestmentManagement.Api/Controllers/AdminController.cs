using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using InvestmentManagement.Api.Contracts.Admin;
using InvestmentManagement.Api.Contracts.Campaigns;
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
    [ProducesResponseType(typeof(PagedResponse<InvestorSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<InvestorSummaryResponse>>> GetInvestors(
        [FromQuery] InvestorListQuery query,
        CancellationToken cancellationToken)
    {
        return Ok(await adminService.GetInvestorsAsync(query, cancellationToken));
    }

    [HttpGet("investors/{id:guid}")]
    [ProducesResponseType(typeof(InvestorDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InvestorDetailResponse>> GetInvestor(Guid id, CancellationToken cancellationToken)
    {
        var investor = await adminService.GetInvestorByIdAsync(id, cancellationToken);
        return investor is null ? NotFound() : Ok(investor);
    }

    [HttpPut("investors/{id:guid}/active")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetInvestorActiveStatus(
        Guid id,
        [FromBody] UpdateInvestorActiveStatusRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await adminService.SetInvestorActiveStatusAsync(id, request.IsActive, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("campaigns/active")]
    [ProducesResponseType(typeof(PagedResponse<CampaignResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<CampaignResponse>>> GetActiveCampaigns(
        [FromQuery] ActiveCampaignListQuery query,
        CancellationToken cancellationToken)
    {
        return Ok(await adminService.GetActiveCampaignsAsync(query, cancellationToken));
    }

    [HttpGet("campaigns/closed")]
    [ProducesResponseType(typeof(PagedResponse<CampaignResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<CampaignResponse>>> GetClosedCampaigns(
        [FromQuery] ActiveCampaignListQuery query,
        CancellationToken cancellationToken)
    {
        return Ok(await adminService.GetClosedCampaignsAsync(query, cancellationToken));
    }

    [HttpGet("campaigns/{id:guid}")]
    [ProducesResponseType(typeof(AdminCampaignDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AdminCampaignDetailResponse>> GetCampaign(Guid id, CancellationToken cancellationToken)
    {
        var campaign = await adminService.GetCampaignByIdAsync(id, cancellationToken);
        return campaign is null ? NotFound() : Ok(campaign);
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
