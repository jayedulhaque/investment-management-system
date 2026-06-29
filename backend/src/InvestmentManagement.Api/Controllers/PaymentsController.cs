using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Encodings.Web;
using InvestmentManagement.Api.Contracts.Payments;
using InvestmentManagement.Api.Options;
using InvestmentManagement.Api.Payments;
using InvestmentManagement.Api.Payments.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace InvestmentManagement.Api.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController(
    IPaymentStrategy paymentStrategy,
    IPaymentSessionStore sessionStore,
    IOptions<FeatureManagementSettings> featureOptions,
    IOptions<PaymentSettings> paymentOptions) : ControllerBase
{
    [HttpGet("mode")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PaymentModeResponse), StatusCodes.Status200OK)]
    public ActionResult<PaymentModeResponse> GetMode()
    {
        return Ok(new PaymentModeResponse
        {
            UseMockPayment = featureOptions.Value.UseMockPayment,
            Provider = paymentStrategy.ProviderName
        });
    }

    [HttpPost("initiate")]
    [Authorize]
    [ProducesResponseType(typeof(PaymentInitResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PaymentInitResult>> Initiate([FromBody] InitiatePaymentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await paymentStrategy.InitiatePaymentAsync(new PaymentRequest
            {
                Amount = request.Amount,
                UserId = GetUserId(),
                Description = request.Description ?? string.Empty,
                ReferenceKey = request.ReferenceKey
            }, cancellationToken);

            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("verify")]
    [Authorize]
    [ProducesResponseType(typeof(PaymentVerifyResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PaymentVerifyResult>> Verify([FromBody] VerifyPaymentRequest request, CancellationToken cancellationToken)
    {
        var result = await paymentStrategy.VerifyPaymentAsync(request.TransactionId, cancellationToken);
        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromQuery] string transactionId, CancellationToken cancellationToken)
    {
        var session = sessionStore.Get(transactionId);
        var settings = paymentOptions.Value;
        var result = await paymentStrategy.VerifyPaymentAsync(transactionId, cancellationToken);

        var targetBase = result.Success ? settings.SuccessRedirectUrl : settings.FailureRedirectUrl;
        var separator = targetBase.Contains('?') ? '&' : '?';
        var redirect =
            $"{targetBase}{separator}transactionId={Uri.EscapeDataString(transactionId)}&success={result.Success.ToString().ToLowerInvariant()}";

        if (!string.IsNullOrWhiteSpace(session?.ReferenceKey))
            redirect += $"&referenceKey={Uri.EscapeDataString(session.ReferenceKey)}";

        return Redirect(redirect);
    }

    [HttpGet("bkash/simulate")]
    [AllowAnonymous]
    [Produces("text/html")]
    public IActionResult SimulateBkash([FromQuery] string transactionId)
    {
        if (string.IsNullOrWhiteSpace(transactionId))
            return BadRequest("transactionId is required.");

        var session = sessionStore.Get(transactionId);
        if (session is null)
            return NotFound("Transaction not found.");

        var callbackUrl = $"{paymentOptions.Value.ApiBaseUrl.TrimEnd('/')}/api/payments/callback?transactionId={Uri.EscapeDataString(transactionId)}";
        var encodedCallback = HtmlEncoder.Default.Encode(callbackUrl);

        var encodedTrx = HtmlEncoder.Default.Encode(transactionId);
        var amount = session.Amount.ToString("0.00");
        var html =
            "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\" />" +
            "<title>bKash Payment Simulator</title>" +
            "<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:1.5rem}" +
            ".card{border:1px solid #e2e8f0;border-radius:.5rem;padding:1.5rem}" +
            "a{display:inline-block;margin-top:1rem;background:#e2136e;color:#fff;padding:.6rem 1rem;border-radius:.35rem;text-decoration:none}</style></head><body>" +
            "<div class=\"card\"><h1>bKash Simulator</h1>" +
            $"<p>Transaction: <strong>{encodedTrx}</strong></p>" +
            $"<p>Amount: <strong>{amount} BDT</strong></p>" +
            "<p>This page simulates the external bKash checkout. Click below after confirming payment.</p>" +
            $"<a href=\"{encodedCallback}\">Confirm payment</a></div></body></html>";

        return Content(html, "text/html");
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
