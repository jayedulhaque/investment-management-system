using InvestmentManagement.Api.Payments.Models;

namespace InvestmentManagement.Api.Payments;

public interface IPaymentStrategy
{
    string ProviderName { get; }

    Task<PaymentInitResult> InitiatePaymentAsync(PaymentRequest request, CancellationToken cancellationToken = default);

    Task<PaymentVerifyResult> VerifyPaymentAsync(string transactionId, CancellationToken cancellationToken = default);
}
