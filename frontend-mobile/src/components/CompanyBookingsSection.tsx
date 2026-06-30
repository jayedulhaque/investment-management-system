import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../lib/api';
import {
  companyBookingsUrl,
  defaultCompanyBookingListQuery,
  investorHeading,
  type CompanyBookingListQuery,
  type CompanyBookingSummary,
  type PagedCompanyBookings,
} from '../lib/companyBookings';

function BookingListPanel({
  title,
  description,
  active,
  refreshKey,
  onSelectBooking,
  onUpdateStatus,
  onApproveResell,
  onRejectResell,
}: {
  title: string;
  description: string;
  active: boolean;
  refreshKey: number;
  onSelectBooking: (booking: CompanyBookingSummary) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onApproveResell: (id: string) => void;
  onRejectResell: (id: string) => void;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState<CompanyBookingListQuery>(() => defaultCompanyBookingListQuery(active));
  const [items, setItems] = useState<CompanyBookingSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery((prev) => ({ ...defaultCompanyBookingListQuery(active), pageSize: prev.pageSize }));
    setSearchInput('');
  }, [active]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((prev) => ({ ...prev, page: 1, search: searchInput }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    apiFetch<PagedCompanyBookings>(companyBookingsUrl(query))
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
  }, [query, refreshKey]);

  const panelClass = active ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-slate-50';

  return (
    <View className={`mb-4 rounded-lg border p-3 ${panelClass}`}>
      <Text className="font-semibold text-slate-900">
        {title} ({totalCount})
      </Text>
      <Text className="mb-3 text-sm text-slate-600">{description}</Text>

      <Text className="mb-1 text-sm text-slate-600">Search investors</Text>
      <TextInput
        className="mb-3 rounded border border-slate-300 bg-white p-2.5"
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder="Name, email, phone, NID, city…"
      />

      {loading && <Text className="mb-2 text-sm text-slate-500">Loading…</Text>}

      {!loading && items.length === 0 ? (
        <Text className="text-sm text-slate-600">No bookings in this list.</Text>
      ) : (
        items.map((booking) => (
          <View key={booking.id} className="mb-2">
            <Pressable
              className={`rounded border bg-white p-3 ${
                active ? 'border-indigo-100' : 'border-slate-200'
              } ${booking.status === 'ResellPending' ? 'border-amber-200 bg-amber-50/50' : ''}`}
              onPress={() => onSelectBooking(booking)}
            >
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 font-medium">{investorHeading(booking)}</Text>
                <Text className="text-xs font-medium text-slate-600">{booking.status}</Text>
              </View>
              {booking.investorEmail ? (
                <Text className="mt-1 text-xs text-slate-600">{booking.investorEmail}</Text>
              ) : null}
              {booking.investorPhone ? (
                <Text className="text-xs text-slate-600">{booking.investorPhone}</Text>
              ) : null}
              <Text className="mt-1 text-sm text-slate-600">
                {booking.reservedShares} shares · {booking.totalPrice.toFixed(2)} BDT
              </Text>
              <Text className="mt-1 text-xs text-indigo-600">Tap for full investor details</Text>
            </Pressable>
            {active && booking.status === 'PreBooked' && (
              <Pressable className="mt-1 px-1" onPress={() => onUpdateStatus(booking.id, 'Contacted')}>
                <Text className="text-sm text-indigo-600">Mark contacted</Text>
              </Pressable>
            )}
            {active && booking.status === 'Contacted' && (
              <Pressable className="mt-1 px-1" onPress={() => onUpdateStatus(booking.id, 'Confirmed')}>
                <Text className="text-sm text-indigo-600">Confirm</Text>
              </Pressable>
            )}
            {active && booking.status === 'ResellPending' && (
              <View className="mt-1 flex-row gap-4 px-1">
                <Pressable onPress={() => onApproveResell(booking.id)}>
                  <Text className="text-sm text-indigo-600">Approve return</Text>
                </Pressable>
                <Pressable onPress={() => onRejectResell(booking.id)}>
                  <Text className="text-sm text-red-600">Reject</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}

      {totalCount > 0 && (
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-xs text-slate-500">
            Page {query.page} of {totalPages || 1}
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              disabled={query.page <= 1 || loading}
              className="rounded border bg-white px-3 py-1"
              onPress={() => setQuery((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              <Text className="text-sm">Prev</Text>
            </Pressable>
            <Pressable
              disabled={query.page >= totalPages || loading}
              className="rounded border bg-white px-3 py-1"
              onPress={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              <Text className="text-sm">Next</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export function CompanyBookingsSection({
  refreshKey,
  onSelectBooking,
  onUpdateStatus,
  onApproveResell,
  onRejectResell,
}: {
  refreshKey: number;
  onSelectBooking: (booking: CompanyBookingSummary) => void;
  onUpdateStatus: (id: string, status: string) => void;
  onApproveResell: (id: string) => void;
  onRejectResell: (id: string) => void;
}) {
  return (
    <View>
      <Text className="mb-3 text-lg font-semibold">Bookings on your campaign</Text>
      <BookingListPanel
        title="Active bookings"
        description="PreBooked, Contacted, Confirmed, and pending return requests"
        active
        refreshKey={refreshKey}
        onSelectBooking={onSelectBooking}
        onUpdateStatus={onUpdateStatus}
        onApproveResell={onApproveResell}
        onRejectResell={onRejectResell}
      />
      <BookingListPanel
        title="Past bookings"
        description="Cancelled and returned bookings"
        active={false}
        refreshKey={refreshKey}
        onSelectBooking={onSelectBooking}
        onUpdateStatus={onUpdateStatus}
        onApproveResell={onApproveResell}
        onRejectResell={onRejectResell}
      />
    </View>
  );
}
