import { useState } from 'react';
import { apiFetch } from '../lib/api';
import { isTestingMode } from '../lib/config';

type PaymentInit = {
  transactionId: string;
  redirectUrl: string;
};

type Props = {
  amount: number;
  description: string;
  referenceKey?: string;
  initialPayment?: PaymentInit | null;
  onPaymentVerified: (transactionId: string) => Promise<void>;
};

export function PaymentPanel({
  amount,
  description,
  referenceKey,
  initialPayment = null,
  onPaymentVerified,
}: Props) {
  const [payment, setPayment] = useState<PaymentInit | null>(initialPayment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<PaymentInit & { success: boolean }>('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({ amount, description, referenceKey }),
      });
      setPayment({ transactionId: result.transactionId, redirectUrl: result.redirectUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndContinue = async (transactionId: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify({ transactionId }),
      });
      await onPaymentVerified(transactionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const debugBypass = async () => {
    if (!payment) return;
    await verifyAndContinue(payment.transactionId);
  };

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm text-slate-600">
        Pay <strong>{amount.toFixed(2)} BDT</strong> — {description}
      </p>
      {!payment ? (
        <button
          type="button"
          onClick={initiate}
          disabled={loading}
          className="mt-3 rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Starting…' : 'Start payment'}
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={payment.redirectUrl}
            className="rounded bg-emerald-600 px-4 py-2 text-white text-sm"
          >
            Open payment gateway
          </a>
          {isTestingMode && (
            <button
              type="button"
              onClick={debugBypass}
              disabled={loading}
              className="rounded bg-slate-400 px-4 py-2 text-white text-sm"
            >
              [DEBUG] Bypass Payment
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
