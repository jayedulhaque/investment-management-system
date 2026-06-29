import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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

type Campaign = {
  id: string;
  paymentStatus: string;
  isActive: boolean;
  equityPercentageOffered: number;
  totalShares: number;
  availableShares: number;
  pricePerShare: number;
  minInvestmentThreshold: number;
};

function equityPerShare(campaign: Pick<Campaign, 'equityPercentageOffered' | 'totalShares'>) {
  return campaign.totalShares > 0 ? campaign.equityPercentageOffered / campaign.totalShares : 0;
}

type Booking = {
  id: string;
  reservedShares: number;
  totalPrice: number;
  status: string;
};

export function CompanyScreen() {
  const logout = useAuthStore((s) => s.logout);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pending, setPending] = useState<{
    id: string;
    payment: { transactionId: string; redirectUrl: string };
  } | null>(null);
  const [form, setForm] = useState({
    equityPercentageOffered: '50',
    totalShares: '500',
    pricePerShare: '50',
    minInvestmentThreshold: '500',
  });

  const previewEquityPerShare =
    +form.totalShares > 0 ? +form.equityPercentageOffered / +form.totalShares : 0;

  const load = useCallback(async () => {
    const [c, b] = await Promise.all([
      apiFetch<Campaign[]>('/api/campaigns/company'),
      apiFetch<Booking[]>('/api/bookings/company'),
    ]);
    setCampaigns(c);
    setBookings(b);
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const createCampaign = async () => {
    const res = await apiFetch<{
      campaign: { id: string };
      payment: { transactionId: string; redirectUrl: string };
    }>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        equityPercentageOffered: +form.equityPercentageOffered,
        totalShares: +form.totalShares,
        pricePerShare: +form.pricePerShare,
        minInvestmentThreshold: +form.minInvestmentThreshold,
      }),
    });
    setPending({ id: res.campaign.id, payment: res.payment });
    await load();
  };

  const confirm = async (campaignId: string, transactionId: string) => {
    await apiFetch(`/api/campaigns/${campaignId}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    });
    setPending((current) => (current?.id === campaignId ? null : current));
    await load();
  };

  const updateStatus = async (bookingId: string, status: string) => {
    await apiFetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await load();
  };

  const deleteCampaign = (campaignId: string) => {
    Alert.alert('Delete campaign', 'Delete this campaign? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' });
            setPending((current) => (current?.id === campaignId ? null : current));
            await load();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete campaign');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-slate-100 p-4">
      <View className="flex-row justify-between mb-4">
        <Text className="text-xl font-bold">Company</Text>
        <Pressable onPress={logout}><Text className="text-red-600">Logout</Text></Pressable>
      </View>
      {campaigns.length === 0 ? (
        <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
          <Text className="mb-1 text-lg font-semibold">Create campaign</Text>
          <Text className="mb-4 text-sm text-slate-600">
            Decide what percentage of your company you sell, then how many share units represent that
            stake. Example: 50% of the company split into 500 shares = 0.1% company ownership per share.
          </Text>
          <FormField
            label="Company stake offered (%)"
            hint="Percentage of company ownership offered (e.g. 50 = half the company)"
            value={form.equityPercentageOffered}
            onChangeText={(v) => setForm({ ...form, equityPercentageOffered: v })}
          />
          <FormField
            label="Shares offered (units)"
            hint="Share units that together equal the stake above (e.g. 500 shares for 50%)"
            value={form.totalShares}
            onChangeText={(v) => setForm({ ...form, totalShares: v })}
          />
          <FormField
            label="Price per share (BDT)"
            hint="Investor price for one share unit"
            value={form.pricePerShare}
            onChangeText={(v) => setForm({ ...form, pricePerShare: v })}
          />
          <FormField
            label="Minimum investment (BDT)"
            hint="Smallest order investors can place (shares × price)"
            value={form.minInvestmentThreshold}
            onChangeText={(v) => setForm({ ...form, minInvestmentThreshold: v })}
          />
          <View className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
            <Text className="font-medium text-indigo-900">Campaign preview</Text>
            <Text className="mt-1 text-sm text-indigo-900">
              Offering {form.totalShares} shares = {form.equityPercentageOffered}% of the company
            </Text>
            <Text className="mt-1 text-sm text-indigo-800">
              Each share = {previewEquityPerShare.toFixed(4)}% company · Total raise:{' '}
              {(+form.totalShares * +form.pricePerShare).toLocaleString()} BDT
            </Text>
          </View>
          <Pressable className="rounded bg-indigo-600 py-3" onPress={createCampaign}>
            <Text className="text-center text-white font-medium">Create & pay listing fee</Text>
          </Pressable>
          {pending && (
            <PaymentPanel
              amount={500}
              description="Listing fee"
              referenceKey={`campaign:${pending.id}`}
              initialPayment={pending.payment}
              onPaymentVerified={(transactionId) => confirm(pending.id, transactionId)}
            />
          )}
        </View>
      ) : (
        <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
          <Text className="text-sm text-slate-600">
            Your company already has a campaign. Delete it below to create a new one.
          </Text>
        </View>
      )}
      <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <Text className="mb-3 text-lg font-semibold">My campaign</Text>
        {campaigns.length === 0 ? (
          <Text className="text-sm text-slate-600">No campaign yet. Create one above.</Text>
        ) : (
          campaigns.map((c) => (
            <View key={c.id} className="mb-2 rounded border border-slate-200 p-3">
              <Text className="font-medium text-indigo-900">
                Offering {c.totalShares} shares = {c.equityPercentageOffered}% of the company
              </Text>
              <Text className="mt-1 font-medium">
                {c.availableShares}/{c.totalShares} share units available
              </Text>
              <Text className="text-sm text-slate-600">
                {c.pricePerShare} BDT/share · min {c.minInvestmentThreshold} BDT ·{' '}
                {equityPerShare(c).toFixed(4)}% company per share
              </Text>
              <Text className="mt-1 text-sm">
                Payment: {c.paymentStatus}
                {c.isActive ? ' · Active' : ' · Awaiting listing fee'}
              </Text>
              {!c.isActive && c.paymentStatus === 'Pending' && (
                <PaymentPanel
                  amount={500}
                  description="Listing fee"
                  referenceKey={`campaign:${c.id}`}
                  onPaymentVerified={(transactionId) => confirm(c.id, transactionId)}
                />
              )}
              <Pressable className="mt-3" onPress={() => deleteCampaign(c.id)}>
                <Text className="text-sm text-red-600">Delete campaign</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
      <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <Text className="mb-3 text-lg font-semibold">Bookings on your campaign</Text>
        {bookings.length === 0 ? (
          <Text className="text-sm text-slate-600">No bookings yet.</Text>
        ) : (
          bookings.map((b) => (
            <View key={b.id} className="mb-2 rounded border border-slate-200 p-3">
              <Text className="text-sm">
                {b.reservedShares} shares · {b.totalPrice.toFixed(2)} BDT · {b.status}
              </Text>
              {b.status === 'PreBooked' && (
                <Pressable className="mt-2" onPress={() => updateStatus(b.id, 'Contacted')}>
                  <Text className="text-indigo-600">Mark contacted</Text>
                </Pressable>
              )}
              {b.status === 'Contacted' && (
                <Pressable className="mt-2" onPress={() => updateStatus(b.id, 'Confirmed')}>
                  <Text className="text-indigo-600">Confirm</Text>
                </Pressable>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
