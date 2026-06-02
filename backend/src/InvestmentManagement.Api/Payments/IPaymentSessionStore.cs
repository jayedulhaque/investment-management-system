using InvestmentManagement.Api.Payments.Models;

namespace InvestmentManagement.Api.Payments;

public interface IPaymentSessionStore
{
    void Save(PaymentSession session);
    PaymentSession? Get(string transactionId);
    bool TryComplete(string transactionId, out PaymentSession? session);
}
