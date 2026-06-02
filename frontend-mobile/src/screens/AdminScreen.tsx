import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/authStore';

type Pending = { companyProfileId: string; email: string };

export function AdminScreen() {
  const logout = useAuthStore((s) => s.logout);
  const [pending, setPending] = useState<Pending[]>([]);

  useEffect(() => {
    apiFetch<Pending[]>('/api/admin/companies/pending').then(setPending).catch(() => undefined);
  }, []);

  const approve = async (id: string, ok: boolean) => {
    await apiFetch(`/api/admin/companies/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approve: ok }),
    });
    setPending((p) => p.filter((x) => x.companyProfileId !== id));
  };

  return (
    <ScrollView className="flex-1 bg-slate-100 p-4">
      <View className="flex-row justify-between mb-4">
        <Text className="text-xl font-bold">Admin</Text>
        <Pressable onPress={logout}><Text className="text-red-600">Logout</Text></Pressable>
      </View>
      {pending.map((c) => (
        <View key={c.companyProfileId} className="bg-white p-3 rounded mb-2">
          <Text>{c.email}</Text>
          <View className="flex-row gap-2 mt-2">
            <Pressable onPress={() => approve(c.companyProfileId, true)}><Text className="text-green-700">Approve</Text></Pressable>
            <Pressable onPress={() => approve(c.companyProfileId, false)}><Text className="text-red-600">Reject</Text></Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
