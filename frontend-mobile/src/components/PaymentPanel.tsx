import { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { apiFetch } from '../lib/api';

type PaymentInit = { transactionId: string; redirectUrl: string };

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
        const result = await apiFetch<PaymentInit>('/api/payments/initiate', {
          method: 'POST',
          body: JSON.stringify({ amount, description, referenceKey }),
        });
        current = result;
        setPayment(current);
      }

      if (!useMockPayment) {
        await Linking.openURL(current.redirectUrl);
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
    <View className="mt-3 rounded border border-slate-200 p-3">
      <Text className="text-sm text-slate-600">
        Pay {amount.toFixed(2)} BDT — {description}
      </Text>
      <Pressable
        className="mt-2 rounded bg-emerald-600 py-2"
        onPress={payListingFee}
        disabled={loading}
      >
        <Text className="text-center text-white font-medium">
          {loading ? 'Processing…' : `Pay ${amount.toFixed(0)} BDT`}
        </Text>
      </Pressable>
      {error && <Text className="text-red-600 text-sm mt-1">{error}</Text>}
    </View>
  );
};
