import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type PaymentInit = {
  transactionId: string;
  redirectUrl: string;
};

type PaymentMode = {
  useMockPayment: boolean;
  provider: string;
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
  const [useMockPayment, setUseMockPayment] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<PaymentMode>('/api/payments/mode')
      .then((mode) => setUseMockPayment(mode.useMockPayment))
      .catch(() => undefined);
  }, []);

  const payListingFee = async () => {
    setLoading(true);
    setError(null);
    try {
      let current = payment;
      if (!current) {
        const result = await apiFetch<PaymentInit & { success: boolean }>('/api/payments/initiate', {
          method: 'POST',
          body: JSON.stringify({ amount, description, referenceKey }),
        });
        current = { transactionId: result.transactionId, redirectUrl: result.redirectUrl };
        setPayment(current);
      }

      if (!useMockPayment) {
        window.location.assign(current.redirectUrl);
        return;
      }

      await apiFetch('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify({ transactionId: current.transactionId }),
      });
      await onPaymentVerified(current.transactionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm text-slate-600">
        Pay <strong>{amount.toFixed(2)} BDT</strong> — {description}
      </p>
      <button
        type="button"
        onClick={payListingFee}
        disabled={loading}
        className="mt-3 rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? 'Processing…' : `Pay ${amount.toFixed(0)} BDT`}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};
