import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { apiFetch } from '../lib/api';
import { isTestingMode } from '../lib/config';

type PaymentInit = { transactionId: string; redirectUrl: string };

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
      const result = await apiFetch<PaymentInit>('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({ amount, description, referenceKey }),
      });
      setPayment(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const verify = async (transactionId: string) => {
    setLoading(true);
    try {
      await apiFetch('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify({ transactionId }),
      });
      await onPaymentVerified(transactionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verify failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="mt-3 rounded border border-slate-200 p-3">
      <Text className="text-sm text-slate-600">
        Pay {amount.toFixed(2)} BDT — {description}
      </Text>
      {!payment ? (
        <Pressable className="mt-2 rounded bg-emerald-600 py-2" onPress={initiate} disabled={loading}>
          <Text className="text-center text-white">Start payment</Text>
        </Pressable>
      ) : (
        <View className="mt-2 gap-2">
          <Pressable className="rounded bg-emerald-600 py-2" onPress={() => Linking.openURL(payment.redirectUrl)}>
            <Text className="text-center text-white">Open gateway</Text>
          </Pressable>
          {isTestingMode && (
            <Pressable className="rounded bg-slate-400 py-2" onPress={() => verify(payment.transactionId)}>
              <Text className="text-center text-white">[DEBUG] Bypass Payment</Text>
            </Pressable>
          )}
        </View>
      )}
      {error && <Text className="text-red-600 text-sm mt-1">{error}</Text>}
    </View>
  );
}
