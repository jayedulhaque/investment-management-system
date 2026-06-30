using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using InvestmentManagement.Api.Contracts.Bookings;
using InvestmentManagement.Api.Contracts.Common;
using InvestmentManagement.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvestmentManagement.Api.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingsController(IBookingService bookingService) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = "InvestorOnly")]
    [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookingResponse>> Create(
        [FromBody] CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var booking = await bookingService.CreateBookingAsync(GetUserId(), request, cancellationToken);
            return CreatedAtAction(nameof(GetMine), new { }, booking);
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

    [HttpGet("mine")]
    [Authorize(Policy = "InvestorOnly")]
    [ProducesResponseType(typeof(PagedResponse<BookingResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<BookingResponse>>> GetMine(
        [FromQuery] InvestorBookingListQuery query,
        CancellationToken cancellationToken)
    {
        return Ok(await bookingService.GetInvestorBookingsAsync(GetUserId(), query, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "InvestorOnly")]
    [ProducesResponseType(typeof(BookingDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BookingDetailResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await bookingService.GetInvestorBookingDetailAsync(GetUserId(), id, cancellationToken));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("company")]
    [Authorize(Policy = "CompanyOnly")]
    [ProducesResponseType(typeof(PagedResponse<BookingResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<BookingResponse>>> GetCompany(
        [FromQuery] CompanyBookingListQuery query,
        CancellationToken cancellationToken)
    {
        return Ok(await bookingService.GetCompanyBookingsAsync(GetUserId(), query, cancellationToken));
    }

    [HttpGet("company/{id:guid}")]
    [Authorize(Policy = "CompanyOnly")]
    [ProducesResponseType(typeof(CompanyBookingDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CompanyBookingDetailResponse>> GetCompanyBooking(
        Guid id,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await bookingService.GetCompanyBookingDetailAsync(GetUserId(), id, cancellationToken));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Policy = "InvestorOnly")]
    [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookingResponse>> Cancel(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await bookingService.CancelBookingAsync(GetUserId(), id, cancellationToken));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "CompanyOnly")]
    [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookingResponse>> UpdateStatus(
        Guid id,
        [FromBody] UpdateBookingStatusRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await bookingService.UpdateBookingStatusAsync(GetUserId(), id, request, cancellationToken));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/resell")]
    [Authorize(Policy = "InvestorOnly")]
    [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookingResponse>> RequestResell(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await bookingService.ResellBookingAsync(GetUserId(), id, cancellationToken));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/approve-resell")]
    [Authorize(Policy = "CompanyOnly")]
    [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookingResponse>> ApproveResell(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await bookingService.ApproveResellBookingAsync(GetUserId(), id, cancellationToken));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/reject-resell")]
    [Authorize(Policy = "CompanyOnly")]
    [ProducesResponseType(typeof(BookingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BookingResponse>> RejectResell(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await bookingService.RejectResellBookingAsync(GetUserId(), id, cancellationToken));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
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
