import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../lib/api';
import {
  emptyInvestorListQuery,
  investorListUrl,
  type InvestorDetail,
  type InvestorListQuery,
  type InvestorSummary,
  type PagedInvestors,
} from '../lib/adminInvestorList';

function displayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'Not provided';
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3 border-b border-slate-100 pb-3">
      <Text className="text-xs font-semibold uppercase text-slate-500">{label}</Text>
      <Text className="mt-1 text-sm text-slate-800">{value}</Text>
    </View>
  );
}

function InvestorDetailContent({ investor }: { investor: InvestorDetail }) {
  return (
    <View>
      <Text className="mb-2 text-xs font-semibold uppercase text-slate-500">Account</Text>
      <DetailRow label="Login email" value={displayValue(investor.email)} />
      <DetailRow label="Status" value={investor.isActive ? 'Active' : 'Inactive'} />
      <DetailRow label="Total bookings" value={String(investor.totalBookings)} />
      <DetailRow label="Active bookings" value={String(investor.activeBookings)} />

      <Text className="mb-2 mt-2 text-xs font-semibold uppercase text-slate-500">Personal identity</Text>
      <DetailRow label="Full name" value={displayValue(investor.fullName)} />
      <DetailRow label="National ID" value={displayValue(investor.nationalId)} />
      <DetailRow label="Date of birth" value={displayValue(investor.dateOfBirth)} />
      <DetailRow label="Occupation" value={displayValue(investor.occupation)} />

      <Text className="mb-2 mt-2 text-xs font-semibold uppercase text-slate-500">Contact & location</Text>
      <DetailRow label="Phone" value={displayValue(investor.phone)} />
      <DetailRow label="Contact email" value={displayValue(investor.contactEmail)} />
      <DetailRow label="Address" value={displayValue(investor.address)} />
      <DetailRow label="City" value={displayValue(investor.city)} />
      <DetailRow label="Country" value={displayValue(investor.country)} />
    </View>
  );
}

export function InvestorListSection({ refreshKey }: { refreshKey: number }) {
  const [searchInput, setSearchInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [query, setQuery] = useState<InvestorListQuery>(emptyInvestorListQuery);
  const [items, setItems] = useState<InvestorSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalInvestor, setModalInvestor] = useState<InvestorDetail | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((prev) => ({
        ...prev,
        page: 1,
        search: searchInput,
        city: cityInput,
        active: activeFilter,
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, cityInput, activeFilter]);

  useEffect(() => {
    setLoading(true);
    apiFetch<PagedInvestors>(investorListUrl(query))
      .then((data) => {
        setItems(data.items);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
        if (data.totalPages > 0 && query.page > data.totalPages) {
          setQuery((prev) => ({ ...prev, page: data.totalPages }));
        }
      })
      .catch(() => {
        setItems([]);
        setTotalCount(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [query, refreshKey, listRefreshKey]);

  const openInvestor = (summary: InvestorSummary) => {
    setModalInvestor({ ...summary, totalBookings: 0, activeBookings: 0 });
    setModalVisible(true);
    setModalLoading(true);
    apiFetch<InvestorDetail>(`/api/admin/investors/${summary.userId}`)
      .then(setModalInvestor)
      .catch(() => Alert.alert('Error', 'Could not load full investor details.'))
      .finally(() => setModalLoading(false));
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalInvestor(null);
  };

  const setInvestorActive = async (isActive: boolean) => {
    if (!modalInvestor) return;
    setStatusUpdating(true);
    try {
      await apiFetch(`/api/admin/investors/${modalInvestor.userId}/active`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      });
      setModalInvestor((prev) => (prev ? { ...prev, isActive } : prev));
      setListRefreshKey((key) => key + 1);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update investor status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 text-lg font-semibold">Investors ({totalCount})</Text>

      <TextInput
        className="mb-2 rounded border border-slate-300 bg-white p-2.5"
        placeholder="Search name, email, phone, NID…"
        value={searchInput}
        onChangeText={setSearchInput}
      />
      <TextInput
        className="mb-2 rounded border border-slate-300 bg-white p-2.5"
        placeholder="Filter by city"
        value={cityInput}
        onChangeText={setCityInput}
      />
      <View className="mb-2 flex-row gap-2">
        {(['all', 'active', 'inactive'] as const).map((value) => (
          <Pressable
            key={value}
            className={`rounded px-3 py-2 ${activeFilter === value ? 'bg-indigo-600' : 'border border-slate-300 bg-white'}`}
            onPress={() => setActiveFilter(value)}
          >
            <Text className={activeFilter === value ? 'text-sm text-white' : 'text-sm text-slate-700'}>
              {value === 'all' ? 'All' : value === 'active' ? 'Active' : 'Inactive'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && <Text className="mb-2 text-sm text-slate-500">Loading…</Text>}

      {!loading && items.length === 0 ? (
        <Text className="text-sm text-slate-600">No investors match your filters.</Text>
      ) : (
        items.map((investor) => (
          <Pressable key={investor.userId} className="mb-2 rounded bg-white p-3" onPress={() => openInvestor(investor)}>
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 font-medium">{investor.fullName || investor.email}</Text>
              <Text className={`text-xs font-medium ${investor.isActive ? 'text-green-700' : 'text-slate-500'}`}>
                {investor.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <Text className="text-xs text-slate-600">{investor.email}</Text>
            {investor.phone ? <Text className="text-xs text-slate-500">Phone: {investor.phone}</Text> : null}
            {investor.city && investor.country ? (
              <Text className="text-xs text-slate-500">
                {investor.city}, {investor.country}
              </Text>
            ) : null}
            <Text className="mt-1 text-xs text-indigo-600">Tap for full details</Text>
          </Pressable>
        ))
      )}

      {totalCount > 0 && (
        <View className="mt-2 flex-row items-center justify-between">
          <Pressable
            disabled={query.page <= 1 || loading}
            className="rounded border border-slate-300 px-3 py-2"
            onPress={() => setQuery((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            <Text className={query.page <= 1 || loading ? 'text-slate-400' : 'text-slate-700'}>Previous</Text>
          </Pressable>
          <Text className="text-sm text-slate-600">
            Page {query.page} of {totalPages || 1}
          </Text>
          <Pressable
            disabled={query.page >= totalPages || loading}
            className="rounded border border-slate-300 px-3 py-2"
            onPress={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            <Text className={query.page >= totalPages || loading ? 'text-slate-400' : 'text-slate-700'}>Next</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[90%] rounded-t-2xl bg-white">
            {modalInvestor && (
              <>
                <View className="flex-row items-start justify-between border-b border-slate-200 p-4">
                  <View className="flex-1 pr-4">
                    <Text className="text-lg font-semibold">{modalInvestor.fullName || modalInvestor.email}</Text>
                    <Text className="text-sm text-slate-500">
                      {modalInvestor.isActive ? 'Active investor' : 'Inactive investor'}
                    </Text>
                  </View>
                  <Pressable onPress={closeModal}>
                    <Text className="text-slate-600">Close</Text>
                  </Pressable>
                </View>
                <ScrollView className="px-4 py-2" style={{ maxHeight: 480 }}>
                  {modalLoading ? (
                    <Text className="py-8 text-center text-sm text-slate-600">Loading investor details…</Text>
                  ) : (
                    <InvestorDetailContent investor={modalInvestor} />
                  )}
                </ScrollView>
                {!modalLoading && (
                  <View className="border-t border-slate-200 p-4">
                    {modalInvestor.isActive ? (
                      <Pressable
                        disabled={statusUpdating}
                        className="rounded bg-red-600 py-3"
                        onPress={() => setInvestorActive(false).catch(() => undefined)}
                      >
                        <Text className="text-center font-medium text-white">
                          {statusUpdating ? 'Updating…' : 'Deactivate investor'}
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        disabled={statusUpdating}
                        className="rounded bg-green-600 py-3"
                        onPress={() => setInvestorActive(true).catch(() => undefined)}
                      >
                        <Text className="text-center font-medium text-white">
                          {statusUpdating ? 'Updating…' : 'Activate investor'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
