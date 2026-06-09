import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../lib/api';
import { PaymentPanel } from '../components/PaymentPanel';
import { useAuthStore } from '../store/authStore';

function FormField({
  label,
  hint,
  value,
  onChangeText,
}: {
  label: string;
  hint: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-1 font-medium text-slate-700">{label}</Text>
      <TextInput
        className="rounded border border-slate-300 bg-white p-2.5"
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
      />
      <Text className="mt-1 text-xs text-slate-500">{hint}</Text>
    </View>
  );
}

export function CompanyScreen() {
  const logout = useAuthStore((s) => s.logout);
  const [pending, setPending] = useState<{
    id: string;
    payment: { transactionId: string; redirectUrl: string };
  } | null>(null);
  const [form, setForm] = useState({ totalShares: '100', pricePerShare: '50', minInvestmentThreshold: '500' });

  const createCampaign = async () => {
    const res = await apiFetch<{
      campaign: { id: string };
      payment: { transactionId: string; redirectUrl: string };
    }>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        totalShares: +form.totalShares,
        pricePerShare: +form.pricePerShare,
        minInvestmentThreshold: +form.minInvestmentThreshold,
      }),
    });
    setPending({ id: res.campaign.id, payment: res.payment });
  };

  const confirm = async (transactionId: string) => {
    if (!pending) return;
    await apiFetch(`/api/campaigns/${pending.id}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    });
    setPending(null);
  };

  return (
    <ScrollView className="flex-1 bg-slate-100 p-4">
      <View className="flex-row justify-between mb-4">
        <Text className="text-xl font-bold">Company</Text>
        <Pressable onPress={logout}><Text className="text-red-600">Logout</Text></Pressable>
      </View>
      <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <Text className="mb-1 text-lg font-semibold">Create campaign</Text>
        <Text className="mb-4 text-sm text-slate-600">
          A one-time 500 BDT listing fee is charged when you submit (separate from the fields below).
        </Text>
        <FormField
          label="Total shares"
          hint="How many shares you are offering"
          value={form.totalShares}
          onChangeText={(v) => setForm({ ...form, totalShares: v })}
        />
        <FormField
          label="Price per share (BDT)"
          hint="Cost of one share"
          value={form.pricePerShare}
          onChangeText={(v) => setForm({ ...form, pricePerShare: v })}
        />
        <FormField
          label="Minimum investment (BDT)"
          hint="Smallest order investors can place (shares × price)"
          value={form.minInvestmentThreshold}
          onChangeText={(v) => setForm({ ...form, minInvestmentThreshold: v })}
        />
        <Pressable className="rounded bg-indigo-600 py-3" onPress={createCampaign}>
          <Text className="text-center text-white font-medium">Create & pay listing fee</Text>
        </Pressable>
      </View>
      {pending && (
        <PaymentPanel
          amount={500}
          description="Listing fee"
          referenceKey={`campaign:${pending.id}`}
          initialPayment={pending.payment}
          onPaymentVerified={confirm}
        />
      )}
    </ScrollView>
  );
}
