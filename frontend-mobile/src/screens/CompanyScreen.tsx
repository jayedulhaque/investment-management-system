import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../lib/api';
import { PaymentPanel } from '../components/PaymentPanel';
import { useAuthStore } from '../store/authStore';

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
      <Text className="font-semibold mb-2">New campaign</Text>
      <TextInput className="bg-white border rounded p-2 mb-2" value={form.totalShares} onChangeText={(v) => setForm({ ...form, totalShares: v })} placeholder="Total shares" keyboardType="numeric" />
      <TextInput className="bg-white border rounded p-2 mb-2" value={form.pricePerShare} onChangeText={(v) => setForm({ ...form, pricePerShare: v })} placeholder="Price/share" keyboardType="numeric" />
      <Pressable className="bg-indigo-600 rounded py-3 mb-2" onPress={createCampaign}>
        <Text className="text-white text-center">Create campaign</Text>
      </Pressable>
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
