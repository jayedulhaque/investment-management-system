using InvestmentManagement.Api.Options;
using InvestmentManagement.Api.Payments.Models;
using Microsoft.Extensions.Options;

namespace InvestmentManagement.Api.Payments;

public class MockPaymentStrategy(
    IPaymentSessionStore sessionStore,
    IOptions<PaymentSettings> paymentOptions) : IPaymentStrategy
{
    public const string Provider = "Mock";
    private readonly PaymentSettings _paymentSettings = paymentOptions.Value;

    string IPaymentStrategy.ProviderName => Provider;

    public Task<PaymentInitResult> InitiatePaymentAsync(PaymentRequest request, CancellationToken cancellationToken = default)
    {
        var transactionId = $"MOCK_TRX_{Guid.NewGuid():N}"[..17].ToUpperInvariant();

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

        var redirectUrl = BuildCallbackUrl(transactionId);

        return Task.FromResult(new PaymentInitResult
        {
            Success = true,
            TransactionId = transactionId,
            RedirectUrl = redirectUrl,
            Provider = Provider,
            Message = "Mock payment initiated. Redirect completes verification instantly."
        });
    }

    public Task<PaymentVerifyResult> VerifyPaymentAsync(string transactionId, CancellationToken cancellationToken = default)
    {
        if (!transactionId.StartsWith("MOCK_TRX_", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new PaymentVerifyResult
            {
                Success = false,
                TransactionId = transactionId,
                Provider = Provider,
                Message = "Invalid mock transaction id."
            });
        }

        if (!sessionStore.TryComplete(transactionId, out var session))
        {
            return Task.FromResult(new PaymentVerifyResult
            {
                Success = false,
                TransactionId = transactionId,
                Provider = Provider,
                Message = "Mock transaction not found or already processed."
            });
        }

        return Task.FromResult(new PaymentVerifyResult
        {
            Success = true,
            TransactionId = transactionId,
            Provider = Provider,
            VerifiedAt = session!.CompletedAt ?? DateTime.UtcNow,
            Message = "Mock payment verified successfully."
        });
    }

    private string BuildCallbackUrl(string transactionId)
    {
        var baseUrl = _paymentSettings.ApiBaseUrl.TrimEnd('/');
        return $"{baseUrl}/api/payments/callback?transactionId={Uri.EscapeDataString(transactionId)}";
    }
}
