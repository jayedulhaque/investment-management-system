import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { apiFetch } from '../lib/api';
import { ShareCalculator } from '../components/ShareCalculator';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

type Campaign = {
  id: string;
  companyName: string;
  availableShares: number;
  pricePerShare: number;
  minInvestmentThreshold: number;
  totalShares: number;
  equityPercentageOffered: number;
};

function equityPerShare(campaign: Pick<Campaign, 'equityPercentageOffered' | 'totalShares'>) {
  return campaign.totalShares > 0 ? campaign.equityPercentageOffered / campaign.totalShares : 0;
}

type Booking = { id: string; reservedShares: number; totalPrice: number; status: string };

export function InvestorScreen() {
  const logout = useAuthStore((s) => s.logout);
  const { unreadCount, connectHub, disconnectHub, fetchUnread } = useNotificationStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Campaign | null>(null);

  const load = useCallback(async () => {
    const [c, b] = await Promise.all([
      apiFetch<Campaign[]>('/api/campaigns'),
      apiFetch<Booking[]>('/api/bookings/mine'),
    ]);
    setCampaigns(c);
    setBookings(b);
    await fetchUnread();
  }, [fetchUnread]);

  useEffect(() => {
    connectHub();
    load();
    return () => {
      void disconnectHub();
    };
  }, [connectHub, disconnectHub, load]);

  const book = async (shares: number) => {
    if (!selected) return;
    await apiFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ campaignId: selected.id, reservedShares: shares }),
    });
    setSelected(null);
    await load();
  };

  return (
    <View className="flex-1 bg-slate-100 p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold">Investor</Text>
        <View className="flex-row items-center gap-2">
          {unreadCount > 0 && (
            <View className="bg-red-500 rounded-full px-2">
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
          <Pressable onPress={logout}>
            <Text className="text-red-600">Logout</Text>
          </Pressable>
        </View>
      </View>
      <Text className="font-semibold mb-2">Campaigns</Text>
      <FlatList
        data={campaigns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable className="bg-white p-3 rounded mb-2 border" onPress={() => setSelected(item)}>
            <Text className="font-medium">{item.companyName}</Text>
            <Text>{item.equityPercentageOffered}% of company · {item.availableShares}/{item.totalShares} units</Text>
            <Text className="text-slate-600 text-sm">
              {item.pricePerShare} BDT/share · {equityPerShare(item).toFixed(4)}% company/share
            </Text>
          </Pressable>
        )}
      />
      {selected && (
        <ShareCalculator
          pricePerShare={selected.pricePerShare}
          minInvestmentThreshold={selected.minInvestmentThreshold}
          maxShares={selected.availableShares}
          onSubmit={book}
        />
      )}
      <Text className="font-semibold mt-4 mb-2">My bookings</Text>
      {bookings.map((b) => (
        <View key={b.id} className="bg-white p-2 rounded mb-1">
          <Text className="text-sm">{b.reservedShares} shares · {b.status}</Text>
        </View>
      ))}
    </View>
  );
}
