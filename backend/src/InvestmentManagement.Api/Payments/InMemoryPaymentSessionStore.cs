using System.Collections.Concurrent;
using InvestmentManagement.Api.Payments.Models;

namespace InvestmentManagement.Api.Payments;

public class InMemoryPaymentSessionStore : IPaymentSessionStore
{
    private readonly ConcurrentDictionary<string, PaymentSession> _sessions = new();

    public void Save(PaymentSession session) => _sessions[session.TransactionId] = session;

    public PaymentSession? Get(string transactionId) =>
        _sessions.TryGetValue(transactionId, out var session) ? session : null;

    public bool TryComplete(string transactionId, out PaymentSession? session)
    {
        session = null;
        if (!_sessions.TryGetValue(transactionId, out var existing))
            return false;

        if (existing.Status == PaymentSessionStatus.Completed)
        {
            session = existing;
            return true;
        }

        if (existing.Status != PaymentSessionStatus.Pending)
            return false;

        existing.Status = PaymentSessionStatus.Completed;
        existing.CompletedAt = DateTime.UtcNow;
        session = existing;
        return true;
    }
}
