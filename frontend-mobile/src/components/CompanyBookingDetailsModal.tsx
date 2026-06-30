import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import {
  displayValue,
  formatBookingDate,
  type CompanyBookingDetail,
} from '../lib/companyBookings';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3 border-b border-slate-100 pb-3">
      <Text className="text-xs font-semibold uppercase text-slate-500">{label}</Text>
      <Text className="mt-1 text-sm text-slate-800">{value}</Text>
    </View>
  );
}

export function CompanyBookingDetailsModal({
  booking,
  loading,
  visible,
  onClose,
  onUpdateStatus,
  onApproveResell,
  onRejectResell,
}: {
  booking: CompanyBookingDetail | null;
  loading: boolean;
  visible: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onApproveResell: (id: string) => void;
  onRejectResell: (id: string) => void;
}) {
  const stakePercent = booking
    ? (booking.reservedShares / booking.campaignTotalShares) * booking.equityPercentageOffered
    : 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3">
          <Text className="flex-1 text-lg font-semibold">
            {loading ? 'Loading…' : booking?.investorFullName || booking?.investorEmail}
          </Text>
          <Pressable onPress={onClose}>
            <Text className="text-indigo-600">Close</Text>
          </Pressable>
        </View>
        <ScrollView className="flex-1 px-4 py-3">
          {loading && <Text className="text-sm text-slate-600">Loading booking details…</Text>}
          {!loading && booking && (
            <>
              <Text className="mb-3 text-sm font-medium text-indigo-700">{booking.status}</Text>
              <Text className="mb-2 font-semibold text-slate-700">Investor</Text>
              <DetailRow label="Full name" value={displayValue(booking.investorFullName)} />
              <DetailRow label="Login email" value={booking.investorEmail} />
              <DetailRow label="Contact email" value={displayValue(booking.investorContactEmail)} />
              <DetailRow label="Phone" value={displayValue(booking.investorPhone)} />
              <DetailRow label="National ID" value={displayValue(booking.investorNationalId)} />
              <DetailRow label="Date of birth" value={displayValue(booking.investorDateOfBirth)} />
              <DetailRow label="Occupation" value={displayValue(booking.investorOccupation)} />
              <DetailRow label="Address" value={displayValue(booking.investorAddress)} />
              <DetailRow
                label="City / country"
                value={`${displayValue(booking.investorCity)} · ${displayValue(booking.investorCountry)}`}
              />
              <Text className="mb-2 mt-2 font-semibold text-slate-700">Booking</Text>
              <DetailRow label="Shares reserved" value={String(booking.reservedShares)} />
              <DetailRow label="Total price" value={`${booking.totalPrice.toFixed(2)} BDT`} />
              <DetailRow label="Price per share" value={`${booking.pricePerShare.toFixed(2)} BDT`} />
              <DetailRow label="Investor stake" value={`${stakePercent.toFixed(4)}% of your company`} />
              <DetailRow label="Booked on" value={formatBookingDate(booking.createdAt)} />
              <DetailRow label="Last updated" value={formatBookingDate(booking.updatedAt)} />
            </>
          )}
        </ScrollView>
        {!loading && booking && (
          <View className="border-t border-slate-200 px-4 py-3">
            {booking.status === 'PreBooked' && (
              <Pressable className="mb-2" onPress={() => onUpdateStatus(booking.id, 'Contacted')}>
                <Text className="text-indigo-600">Mark contacted</Text>
              </Pressable>
            )}
            {booking.status === 'Contacted' && (
              <Pressable className="mb-2" onPress={() => onUpdateStatus(booking.id, 'Confirmed')}>
                <Text className="text-indigo-600">Confirm booking</Text>
              </Pressable>
            )}
            {booking.status === 'ResellPending' && (
              <>
                <Pressable className="mb-2" onPress={() => onApproveResell(booking.id)}>
                  <Text className="text-indigo-600">Approve return</Text>
                </Pressable>
                <Pressable className="mb-2" onPress={() => onRejectResell(booking.id)}>
                  <Text className="text-red-600">Reject return</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}
