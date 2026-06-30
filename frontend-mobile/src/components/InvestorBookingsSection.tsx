import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { apiFetch } from '../lib/api';
import {
  defaultBookingListQuery,
  investorBookingsUrl,
  type BookingListQuery,
  type BookingSummary,
  type PagedBookings,
} from '../lib/investorBookings';

function BookingListPanel({
  title,
  description,
  active,
  refreshKey,
  onSelectBooking,
}: {
  title: string;
  description: string;
  active: boolean;
  refreshKey: number;
  onSelectBooking: (booking: BookingSummary) => void;
}) {
  const [query, setQuery] = useState<BookingListQuery>(() => defaultBookingListQuery(active));
  const [items, setItems] = useState<BookingSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery((prev) => ({ ...defaultBookingListQuery(active), pageSize: prev.pageSize }));
  }, [active]);

  useEffect(() => {
    setLoading(true);
    apiFetch<PagedBookings>(investorBookingsUrl(query))
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

      {loading && <Text className="mb-2 text-sm text-slate-500">Loading…</Text>}

      {!loading && items.length === 0 ? (
        <Text className="text-sm text-slate-600">No bookings in this list.</Text>
      ) : (
        items.map((booking) => (
          <Pressable
            key={booking.id}
            className={`mb-2 rounded border bg-white p-3 ${active ? 'border-indigo-100' : 'border-slate-200'}`}
            onPress={() => onSelectBooking(booking)}
          >
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 font-medium">{booking.companyName}</Text>
              <Text className="text-xs font-medium text-slate-600">{booking.status}</Text>
            </View>
            <Text className="mt-1 text-sm text-slate-600">
              {booking.reservedShares} shares · {booking.totalPrice.toFixed(2)} BDT
            </Text>
            <Text className="mt-1 text-xs text-indigo-600">Tap for full details</Text>
          </Pressable>
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

export function InvestorBookingsSection({
  refreshKey,
  onSelectBooking,
}: {
  refreshKey: number;
  onSelectBooking: (booking: BookingSummary) => void;
}) {
  return (
    <View>
      <Text className="mb-3 text-lg font-semibold">My bookings</Text>
      <BookingListPanel
        title="Active bookings"
        description="PreBooked, Contacted, Confirmed, and pending return requests"
        active
        refreshKey={refreshKey}
        onSelectBooking={onSelectBooking}
      />
      <BookingListPanel
        title="Past bookings"
        description="Cancelled and returned bookings"
        active={false}
        refreshKey={refreshKey}
        onSelectBooking={onSelectBooking}
      />
    </View>
  );
}
