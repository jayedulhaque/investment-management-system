import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../lib/api';
import { PaymentPanel } from '../components/PaymentPanel';
import { CompanyBookingsSection } from '../components/CompanyBookingsSection';
import { CompanyBookingDetailsModal } from '../components/CompanyBookingDetailsModal';
import { useAuthStore } from '../store/authStore';
import {
  companyProfileFromRegistration,
  emptyCompanyRegistration,
  toCompanyProfileUpdatePayload,
  type CompanyProfile,
  type CompanyRegistrationInfo,
} from '../types/company';
import {
  type CompanyBookingDetail,
  type CompanyBookingSummary,
} from '../lib/companyBookings';

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
  isClosed?: boolean;
  equityPercentageOffered: number;
  totalShares: number;
  availableShares: number;
  pricePerShare: number;
  minInvestmentThreshold: number;
};

function isCampaignClosed(c: Campaign) {
  if (c.isClosed) return true;
  return c.paymentStatus === 'Paid' && !c.isActive;
}

function equityPerShare(campaign: Pick<Campaign, 'equityPercentageOffered' | 'totalShares'>) {
  return campaign.totalShares > 0 ? campaign.equityPercentageOffered / campaign.totalShares : 0;
}

export function CompanyScreen() {
  const logout = useAuthStore((s) => s.logout);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<CompanyBookingDetail | null>(null);
  const [loadingBookingDetail, setLoadingBookingDetail] = useState(false);
  const [pending, setPending] = useState<{
    id: string;
    payment: { transactionId: string; redirectUrl: string };
  } | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profile, setProfile] = useState<CompanyRegistrationInfo>(emptyCompanyRegistration());
  const [loginEmail, setLoginEmail] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    equityPercentageOffered: '50',
    totalShares: '500',
    pricePerShare: '50',
    minInvestmentThreshold: '500',
  });

  const previewEquityPerShare =
    +form.totalShares > 0 ? +form.equityPercentageOffered / +form.totalShares : 0;

  const openCampaigns = campaigns.filter((c) => !isCampaignClosed(c));
  const closedCampaigns = campaigns.filter((c) => isCampaignClosed(c));

  const load = useCallback(async () => {
    const campaignsData = await apiFetch<Campaign[]>('/api/campaigns/company');
    setCampaigns(campaignsData);
  }, []);

  const refreshBookings = () => setBookingsRefreshKey((key) => key + 1);

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
    if (selectedBookingId === bookingId) {
      reloadBookingDetails(bookingId);
    }
    refreshBookings();
  };

  const approveResell = async (bookingId: string) => {
    await apiFetch(`/api/bookings/${bookingId}/approve-resell`, { method: 'POST' });
    closeBookingDetails();
    refreshBookings();
    await load();
  };

  const rejectResell = async (bookingId: string) => {
    await apiFetch(`/api/bookings/${bookingId}/reject-resell`, { method: 'POST' });
    if (selectedBookingId === bookingId) {
      reloadBookingDetails(bookingId);
    }
    refreshBookings();
  };

  const openBookingDetails = (booking: CompanyBookingSummary) => {
    reloadBookingDetails(booking.id);
  };

  const reloadBookingDetails = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setBookingDetail(null);
    setLoadingBookingDetail(true);
    apiFetch<CompanyBookingDetail>(`/api/bookings/company/${bookingId}`)
      .then(setBookingDetail)
      .catch(() => setSelectedBookingId(null))
      .finally(() => setLoadingBookingDetail(false));
  };

  const closeBookingDetails = () => {
    setSelectedBookingId(null);
    setBookingDetail(null);
    setLoadingBookingDetail(false);
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

  const openProfileEditor = async () => {
    setEditingProfile(true);
    setLoadingProfile(true);
    setProfileMessage(null);
    try {
      const data = await apiFetch<CompanyProfile>('/api/companies/profile');
      setLoginEmail(data.email);
      setProfile(companyProfileFromRegistration(data));
    } catch {
      setProfileMessage('Could not load company profile.');
      setEditingProfile(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const updateProfileField = (field: keyof CompanyRegistrationInfo, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    setProfileMessage(null);
    try {
      await apiFetch('/api/companies/profile', {
        method: 'PUT',
        body: JSON.stringify(toCompanyProfileUpdatePayload(profile)),
      });
      setProfileMessage('Company profile updated.');
      setEditingProfile(false);
    } catch (e) {
      setProfileMessage(e instanceof Error ? e.message : 'Failed to update profile');
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-100 p-4">
      <View className="flex-row justify-between mb-4">
        <Text className="text-xl font-bold">Company</Text>
        <Pressable onPress={logout}><Text className="text-red-600">Logout</Text></Pressable>
      </View>

      <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold">Company profile</Text>
          {!editingProfile && (
            <Pressable className="rounded bg-indigo-600 px-3 py-2" onPress={() => openProfileEditor().catch(() => undefined)}>
              <Text className="text-sm text-white">Edit profile</Text>
            </Pressable>
          )}
        </View>
        {profileMessage && <Text className="mb-2 text-sm text-blue-800">{profileMessage}</Text>}
        {editingProfile && loadingProfile && (
          <Text className="text-sm text-slate-600">Loading profile…</Text>
        )}
        {editingProfile && !loadingProfile && (
          <>
            <Text className="mb-1 text-sm text-slate-500">Login email: {loginEmail}</Text>
            <Text className="mb-2 font-semibold text-slate-700">Company identity</Text>
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Company name *"
              value={profile.companyName}
              onChangeText={(v) => updateProfileField('companyName', v)}
            />
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Legal name (optional)"
              value={profile.legalName}
              onChangeText={(v) => updateProfileField('legalName', v)}
            />
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Registration number (optional)"
              value={profile.registrationNumber}
              onChangeText={(v) => updateProfileField('registrationNumber', v)}
            />
            <TextInput
              className="mb-4 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Industry (optional)"
              value={profile.industry}
              onChangeText={(v) => updateProfileField('industry', v)}
            />
            <Text className="mb-2 font-semibold text-slate-700">Contact & location</Text>
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Phone (optional)"
              value={profile.phone}
              onChangeText={(v) => updateProfileField('phone', v)}
              keyboardType="phone-pad"
            />
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Contact email (optional)"
              value={profile.contactEmail}
              onChangeText={(v) => updateProfileField('contactEmail', v)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Website (optional)"
              value={profile.website}
              onChangeText={(v) => updateProfileField('website', v)}
              autoCapitalize="none"
            />
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Address (optional)"
              value={profile.address}
              onChangeText={(v) => updateProfileField('address', v)}
            />
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="City (optional)"
              value={profile.city}
              onChangeText={(v) => updateProfileField('city', v)}
            />
            <TextInput
              className="mb-4 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Country (optional)"
              value={profile.country}
              onChangeText={(v) => updateProfileField('country', v)}
            />
            <Text className="mb-2 font-semibold text-slate-700">About & documents</Text>
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Company description *"
              value={profile.description}
              onChangeText={(v) => updateProfileField('description', v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TextInput
              className="mb-4 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Documentation URL *"
              value={profile.documentationUrl}
              onChangeText={(v) => updateProfileField('documentationUrl', v)}
              autoCapitalize="none"
            />
            <View className="flex-row gap-3">
              <Pressable className="rounded bg-indigo-600 px-4 py-2" onPress={saveProfile}>
                <Text className="text-white">Save</Text>
              </Pressable>
              <Pressable className="rounded border border-slate-300 px-4 py-2" onPress={() => setEditingProfile(false)}>
                <Text className="text-slate-700">Cancel</Text>
              </Pressable>
            </View>
          </>
        )}
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
        {openCampaigns.length === 0 ? (
          <Text className="text-sm text-slate-600">No open campaign. Create one above or see closed campaigns below.</Text>
        ) : (
          openCampaigns.map((c) => (
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
        <Text className="mb-3 text-lg font-semibold">Closed campaigns ({closedCampaigns.length})</Text>
        {closedCampaigns.length === 0 ? (
          <Text className="text-sm text-slate-600">No fully booked campaigns yet.</Text>
        ) : (
          closedCampaigns.map((c) => (
            <View key={c.id} className="mb-2 rounded border border-slate-200 bg-slate-50 p-3">
              <Text className="font-medium text-slate-900">
                Offering {c.totalShares} shares = {c.equityPercentageOffered}% of the company
              </Text>
              <Text className="mt-1 text-sm text-slate-600">
                Closed · all {c.totalShares} share units booked · {c.pricePerShare} BDT/share
              </Text>
            </View>
          ))
        )}
      </View>
      <CompanyBookingsSection
        refreshKey={bookingsRefreshKey}
        onSelectBooking={openBookingDetails}
        onUpdateStatus={(id, status) => updateStatus(id, status).catch(() => undefined)}
        onApproveResell={(id) => approveResell(id).catch(() => undefined)}
        onRejectResell={(id) => rejectResell(id).catch(() => undefined)}
      />
      <CompanyBookingDetailsModal
        booking={bookingDetail}
        loading={loadingBookingDetail && selectedBookingId !== null}
        visible={selectedBookingId !== null}
        onClose={closeBookingDetails}
        onUpdateStatus={(id, status) => updateStatus(id, status).catch(() => undefined)}
        onApproveResell={(id) => approveResell(id).catch(() => undefined)}
        onRejectResell={(id) => rejectResell(id).catch(() => undefined)}
      />
    </ScrollView>
  );
}
