using InvestmentManagement.Api.Options;
using InvestmentManagement.Api.Payments.Models;
using InvestmentManagement.Api.Services;
using Microsoft.Extensions.Options;

namespace InvestmentManagement.Api.Payments;

public class BkashPaymentStrategy(
    IPaymentSessionStore sessionStore,
    IAdminBkashResolver adminBkashResolver,
    IOptions<PaymentSettings> paymentOptions) : IPaymentStrategy
{
    public const string Provider = "Bkash";
    private readonly PaymentSettings _paymentSettings = paymentOptions.Value;

    string IPaymentStrategy.ProviderName => Provider;

    public async Task<PaymentInitResult> InitiatePaymentAsync(PaymentRequest request, CancellationToken cancellationToken = default)
    {
        var bkashNumber = await adminBkashResolver.GetReceivingBkashNumberAsync(cancellationToken);
        var transactionId = $"BKASH_TRX_{Guid.NewGuid():N}"[..18].ToUpperInvariant();

        sessionStore.Save(new PaymentSession
        {
            TransactionId = transactionId,
            Amount = request.Amount,
            UserId = request.UserId,
            Provider = Provider,
            Status = PaymentSessionStatus.Pending,
            ReferenceKey = request.ReferenceKey,
            CreatedAt = DateTime.UtcNow
        });

        var baseUrl = _paymentSettings.ApiBaseUrl.TrimEnd('/');
        var redirectUrl =
            $"{baseUrl}/api/payments/bkash/simulate?transactionId={Uri.EscapeDataString(transactionId)}";

        return new PaymentInitResult
        {
            Success = true,
            TransactionId = transactionId,
            RedirectUrl = redirectUrl,
            BKashNumber = bkashNumber,
            Provider = Provider,
            Message = $"Send {request.Amount:0.00} BDT to bKash {bkashNumber} and complete payment on the simulated gateway."
        };
    }

    public Task<PaymentVerifyResult> VerifyPaymentAsync(string transactionId, CancellationToken cancellationToken = default)
    {
        if (!transactionId.StartsWith("BKASH_TRX_", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new PaymentVerifyResult
            {
                Success = false,
                TransactionId = transactionId,
                Provider = Provider,
                Message = "Invalid bKash transaction id."
            });
        }

        if (!sessionStore.TryComplete(transactionId, out var session))
        {
            return Task.FromResult(new PaymentVerifyResult
            {
                Success = false,
                TransactionId = transactionId,
                Provider = Provider,
                Message = "bKash transaction not found or already processed."
            });
        }

        return Task.FromResult(new PaymentVerifyResult
        {
            Success = true,
            TransactionId = transactionId,
            Provider = Provider,
            VerifiedAt = session!.CompletedAt ?? DateTime.UtcNow,
            Message = "bKash payment verified successfully."
        });
    }
}
