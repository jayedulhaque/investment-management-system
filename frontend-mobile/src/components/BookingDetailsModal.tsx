import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import {
  equityPerShare,
  formatBookingDate,
  type BookingDetail,
} from '../lib/investorBookings';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3 border-b border-slate-100 pb-3">
      <Text className="text-xs font-semibold uppercase text-slate-500">{label}</Text>
      <Text className="mt-1 text-sm text-slate-800">{value}</Text>
    </View>
  );
}

export function BookingDetailsModal({
  booking,
  loading,
  visible,
  onClose,
  onCancel,
  onResell,
  onViewCompany,
}: {
  booking: BookingDetail | null;
  loading: boolean;
  visible: boolean;
  onClose: () => void;
  onCancel: (id: string) => void;
  onResell: (id: string) => void;
  onViewCompany: (companyId: string) => void;
}) {
  const perShareEquity = booking ? equityPerShare(booking) : 0;
  const stakePercent = booking
    ? (booking.reservedShares / booking.campaignTotalShares) * booking.equityPercentageOffered
    : 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3">
          <Text className="text-lg font-semibold">{loading ? 'Loading…' : booking?.companyName}</Text>
          <Pressable onPress={onClose}>
            <Text className="text-indigo-600">Close</Text>
          </Pressable>
        </View>
        <ScrollView className="flex-1 px-4 py-3">
          {loading && <Text className="text-sm text-slate-600">Loading booking details…</Text>}
          {!loading && booking && (
            <>
              <Text className="mb-3 text-sm font-medium text-indigo-700">{booking.status}</Text>
              <Text className="mb-2 font-semibold text-slate-700">Company</Text>
              <DetailRow label="Company name" value={booking.companyName} />
              <DetailRow label="Industry" value={booking.companyIndustry?.trim() || 'Not provided'} />
              <DetailRow
                label="Location"
                value={[booking.companyCity, booking.companyCountry].filter(Boolean).join(', ') || 'Not provided'}
              />
              <Pressable className="mb-4" onPress={() => onViewCompany(booking.companyId)}>
                <Text className="text-sm text-indigo-600">View company profile</Text>
              </Pressable>
              <Text className="mb-2 font-semibold text-slate-700">Booking</Text>
              <DetailRow label="Shares reserved" value={String(booking.reservedShares)} />
              <DetailRow label="Total price" value={`${booking.totalPrice.toFixed(2)} BDT`} />
              <DetailRow label="Price per share" value={`${booking.pricePerShare.toFixed(2)} BDT`} />
              <DetailRow
                label="Your stake"
                value={`${stakePercent.toFixed(4)}% of company (${perShareEquity.toFixed(4)}% per share)`}
              />
              <DetailRow label="Booked on" value={formatBookingDate(booking.createdAt)} />
              <DetailRow label="Last updated" value={formatBookingDate(booking.updatedAt)} />
            </>
          )}
        </ScrollView>
        {!loading && booking && (
          <View className="border-t border-slate-200 px-4 py-3">
            {(booking.status === 'PreBooked' || booking.status === 'Contacted') && (
              <Pressable className="mb-2" onPress={() => onCancel(booking.id)}>
                <Text className="text-red-600">Cancel / free shares</Text>
              </Pressable>
            )}
            {booking.status === 'Confirmed' && (
              <Pressable className="mb-2" onPress={() => onResell(booking.id)}>
                <Text className="text-amber-700">Request return (resell)</Text>
              </Pressable>
            )}
            {booking.status === 'ResellPending' && (
              <Text className="text-sm text-amber-700">Awaiting company approval to return shares</Text>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}
