import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { apiFetch } from '../lib/api';
import {
  adminCampaignDetailUrl,
  type AdminCampaignDetail,
} from '../lib/adminCampaigns';
import type { CompanyReview } from '../lib/adminCompanyList';
import { equityPerShare } from '../lib/investorCampaigns';

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

function CompanyDetailContent({ company }: { company: CompanyReview }) {
  return (
    <View>
      <Text className="mb-2 text-xs font-semibold uppercase text-slate-500">Account</Text>
      <DetailRow label="Login email" value={displayValue(company.email)} />
      {company.approvalStatus ? <DetailRow label="Status" value={company.approvalStatus} /> : null}

      <Text className="mb-2 mt-2 text-xs font-semibold uppercase text-slate-500">Company identity</Text>
      <DetailRow label="Company name" value={displayValue(company.companyName)} />
      <DetailRow label="Legal name" value={displayValue(company.legalName)} />
      <DetailRow label="Registration number" value={displayValue(company.registrationNumber)} />
      <DetailRow label="Industry" value={displayValue(company.industry)} />
      <DetailRow label="Description" value={displayValue(company.description)} />

      <Text className="mb-2 mt-2 text-xs font-semibold uppercase text-slate-500">Contact & location</Text>
      <DetailRow label="Phone" value={displayValue(company.phone)} />
      <DetailRow label="Contact email" value={displayValue(company.contactEmail)} />
      <DetailRow label="Website" value={displayValue(company.website)} />
      <DetailRow label="Address" value={displayValue(company.address)} />
      <DetailRow label="City" value={displayValue(company.city)} />
      <DetailRow label="Country" value={displayValue(company.country)} />

      <Text className="mb-2 mt-2 text-xs font-semibold uppercase text-slate-500">Documents</Text>
      <View className="mb-3">
        <Text className="text-xs font-semibold uppercase text-slate-500">Documentation URL</Text>
        <Pressable onPress={() => Linking.openURL(company.documentationUrl)}>
          <Text className="mt-1 text-sm text-indigo-600">{company.documentationUrl}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AdminCampaignDetailsModal({
  campaignId,
  visible,
  onClose,
}: {
  campaignId: string | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<AdminCampaignDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId || !visible) {
      if (!visible) {
        setDetail(null);
        setLoadError(null);
      }
      return;
    }
    setLoading(true);
    setLoadError(null);
    apiFetch<AdminCampaignDetail>(adminCampaignDetailUrl(campaignId))
      .then(setDetail)
      .catch(() => {
        setDetail(null);
        setLoadError('Could not load campaign details.');
      })
      .finally(() => setLoading(false));
  }, [campaignId, visible]);

  const companyName =
    detail?.campaign.company?.companyName ?? detail?.campaign.companyName ?? 'Campaign';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[92%] rounded-t-2xl bg-white">
          <View className="flex-row items-start justify-between border-b border-slate-200 p-4">
            <View className="flex-1 pr-4">
              <Text className="text-lg font-semibold">{companyName}</Text>
              {detail && (
                <Text className="text-sm text-slate-500">
                  {detail.campaign.isClosed ? 'Closed campaign' : 'Active campaign'} ·{' '}
                  {detail.totalBookedShares} shares booked
                </Text>
              )}
            </View>
            <Pressable onPress={onClose}>
              <Text className="text-slate-600">Close</Text>
            </Pressable>
          </View>

          <ScrollView className="px-4 py-2" style={{ maxHeight: 560 }}>
            {loading && <Text className="py-8 text-center text-sm text-slate-600">Loading…</Text>}
            {loadError && (
              <Text className="mb-3 rounded bg-amber-50 p-2 text-sm text-amber-800">{loadError}</Text>
            )}

            {detail && !loading && (
              <View className="pb-6">
                <Text className="mb-2 text-base font-semibold">Campaign</Text>
                <View className="mb-4 rounded border border-slate-200 bg-slate-50 p-3">
                  <Text className="text-sm text-slate-700">
                    {detail.campaign.totalShares} total shares · {detail.campaign.availableShares} available
                  </Text>
                  <Text className="mt-1 text-sm text-slate-700">
                    {detail.campaign.equityPercentageOffered}% equity ·{' '}
                    {equityPerShare(detail.campaign).toFixed(4)}% per share · {detail.campaign.pricePerShare}{' '}
                    BDT/share
                  </Text>
                </View>

                <Text className="mb-2 text-base font-semibold">Company</Text>
                <CompanyDetailContent company={detail.company} />

                <Text className="mb-2 mt-4 text-base font-semibold">
                  Investor bookings ({detail.bookings.length})
                </Text>
                {detail.bookings.length === 0 ? (
                  <Text className="text-sm text-slate-600">No bookings yet.</Text>
                ) : (
                  detail.bookings.map((booking) => (
                    <View key={booking.bookingId} className="mb-3 rounded border border-slate-200 p-3">
                      <Text className="font-medium">{booking.investorFullName || '—'}</Text>
                      <Text className="text-sm text-slate-600">{booking.investorEmail}</Text>
                      {booking.investorPhone ? (
                        <Text className="text-sm text-slate-600">{booking.investorPhone}</Text>
                      ) : null}
                      {booking.investorContactEmail ? (
                        <Text className="text-sm text-slate-600">{booking.investorContactEmail}</Text>
                      ) : null}
                      {booking.investorNationalId ? (
                        <Text className="text-sm text-slate-600">ID: {booking.investorNationalId}</Text>
                      ) : null}
                      {(booking.investorCity || booking.investorCountry) && (
                        <Text className="text-sm text-slate-600">
                          {[booking.investorCity, booking.investorCountry].filter(Boolean).join(', ')}
                        </Text>
                      )}
                      <Text className="mt-2 text-sm">
                        {booking.reservedShares} shares · {booking.totalPrice} BDT · {booking.status}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
