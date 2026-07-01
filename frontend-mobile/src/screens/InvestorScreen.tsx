import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../lib/api';
import { CompanyDetailsModal, type CompanyPublic } from '../components/CompanyDetailsModal';
import { BookingDetailsModal } from '../components/BookingDetailsModal';
import { InvestorBookingsSection } from '../components/InvestorBookingsSection';
import { ActiveCampaignsSection } from '../components/ActiveCampaignsSection';
import { ClosedCampaignsSection } from '../components/ClosedCampaignsSection';
import { ShareCalculator } from '../components/ShareCalculator';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { type BookingDetail, type BookingSummary } from '../lib/investorBookings';
import {
  emptyInvestorRegistration,
  investorProfileFromRegistration,
  toInvestorProfileUpdatePayload,
  type InvestorProfile,
  type InvestorRegistrationInfo,
} from '../types/investor';
import { type CampaignSummary } from '../lib/investorCampaigns';

export function InvestorScreen() {
  const logout = useAuthStore((s) => s.logout);
  const { unreadCount, connectHub, disconnectHub, fetchUnread } = useNotificationStore();
  const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);
  const [selected, setSelected] = useState<CampaignSummary | null>(null);
  const [detailsCompany, setDetailsCompany] = useState<CompanyPublic | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null);
  const [loadingBookingDetail, setLoadingBookingDetail] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profile, setProfile] = useState<InvestorRegistrationInfo>(emptyInvestorRegistration());
  const [loginEmail, setLoginEmail] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [canBook, setCanBook] = useState(true);

  const refreshBookings = () => setBookingsRefreshKey((key) => key + 1);

  useEffect(() => {
    connectHub();
    fetchUnread().catch(() => undefined);
    apiFetch<InvestorProfile>('/api/investors/profile')
      .then((data) => setCanBook(data.isActive))
      .catch(() => undefined);
    return () => {
      void disconnectHub();
    };
  }, [connectHub, disconnectHub, fetchUnread]);

  const book = async (shares: number) => {
    if (!selected || !canBook) return;
    await apiFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ campaignId: selected.id, reservedShares: shares }),
    });
    setSelected(null);
    refreshBookings();
  };

  const cancel = async (id: string) => {
    await apiFetch(`/api/bookings/${id}/cancel`, { method: 'POST' });
    setSelectedBookingId(null);
    setBookingDetail(null);
    refreshBookings();
  };

  const requestResell = async (id: string) => {
    await apiFetch(`/api/bookings/${id}/resell`, { method: 'POST' });
    setSelectedBookingId(null);
    setBookingDetail(null);
    refreshBookings();
  };

  const openCompanyDetails = async (campaign: CampaignSummary) => {
    if (campaign.company) {
      setDetailsCompany(campaign.company);
      return;
    }
    const company = await apiFetch<CompanyPublic>(`/api/companies/${campaign.companyId}/public`);
    setDetailsCompany(company);
  };

  const openCompanyDetailsById = async (companyId: string) => {
    const company = await apiFetch<CompanyPublic>(`/api/companies/${companyId}/public`);
    setDetailsCompany(company);
  };

  const openBookingDetails = (booking: BookingSummary) => {
    setSelectedBookingId(booking.id);
    setBookingDetail(null);
    setLoadingBookingDetail(true);
    apiFetch<BookingDetail>(`/api/bookings/${booking.id}`)
      .then(setBookingDetail)
      .catch(() => setSelectedBookingId(null))
      .finally(() => setLoadingBookingDetail(false));
  };

  const closeBookingDetails = () => {
    setSelectedBookingId(null);
    setBookingDetail(null);
    setLoadingBookingDetail(false);
  };

  const openProfileEditor = async () => {
    setEditingProfile(true);
    setLoadingProfile(true);
    setProfileMessage(null);
    try {
      const data = await apiFetch<InvestorProfile>('/api/investors/profile');
      setLoginEmail(data.email);
      setProfile(investorProfileFromRegistration(data));
    } catch {
      setProfileMessage('Could not load investor profile.');
      setEditingProfile(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const updateProfileField = (field: keyof InvestorRegistrationInfo, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    setProfileMessage(null);
    try {
      await apiFetch('/api/investors/profile', {
        method: 'PUT',
        body: JSON.stringify(toInvestorProfileUpdatePayload(profile)),
      });
      setProfileMessage('Investor profile updated.');
      setEditingProfile(false);
    } catch (e) {
      setProfileMessage(e instanceof Error ? e.message : 'Failed to update profile');
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-100 p-4">
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

      <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-semibold">My profile</Text>
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
          <ScrollView>
            <Text className="mb-1 text-sm text-slate-500">Login email: {loginEmail}</Text>
            <Text className="mb-2 font-semibold text-slate-700">Personal identity</Text>
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Full name *"
              value={profile.fullName}
              onChangeText={(v) => updateProfileField('fullName', v)}
            />
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="National ID (NID) *"
              value={profile.nationalId}
              onChangeText={(v) => updateProfileField('nationalId', v)}
            />
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Date of birth (YYYY-MM-DD, optional)"
              value={profile.dateOfBirth}
              onChangeText={(v) => updateProfileField('dateOfBirth', v)}
            />
            <TextInput
              className="mb-4 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Occupation (optional)"
              value={profile.occupation}
              onChangeText={(v) => updateProfileField('occupation', v)}
            />
            <Text className="mb-2 font-semibold text-slate-700">Contact & location</Text>
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Phone *"
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
              placeholder="Address *"
              value={profile.address}
              onChangeText={(v) => updateProfileField('address', v)}
            />
            <TextInput
              className="mb-2 rounded border border-slate-300 bg-white p-2.5"
              placeholder="City *"
              value={profile.city}
              onChangeText={(v) => updateProfileField('city', v)}
            />
            <TextInput
              className="mb-4 rounded border border-slate-300 bg-white p-2.5"
              placeholder="Country *"
              value={profile.country}
              onChangeText={(v) => updateProfileField('country', v)}
            />
            <View className="mb-4 flex-row gap-3">
              <Pressable className="rounded bg-indigo-600 px-4 py-2" onPress={saveProfile}>
                <Text className="text-white">Save</Text>
              </Pressable>
              <Pressable className="rounded border border-slate-300 px-4 py-2" onPress={() => setEditingProfile(false)}>
                <Text className="text-slate-700">Cancel</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </View>

      <ActiveCampaignsSection
        refreshKey={bookingsRefreshKey}
        canBook={canBook}
        onBookShares={setSelected}
        onViewCompanyDetails={(campaign) => openCompanyDetails(campaign).catch(() => undefined)}
      />
      {selected && canBook && (
        <ShareCalculator
          pricePerShare={selected.pricePerShare}
          minInvestmentThreshold={selected.minInvestmentThreshold}
          maxShares={selected.availableShares}
          onSubmit={book}
        />
      )}
      <ClosedCampaignsSection
        refreshKey={bookingsRefreshKey}
        onViewCompanyDetails={(campaign) => openCompanyDetails(campaign).catch(() => undefined)}
      />
      <InvestorBookingsSection refreshKey={bookingsRefreshKey} onSelectBooking={openBookingDetails} />
      <CompanyDetailsModal
        company={detailsCompany}
        visible={detailsCompany !== null}
        onClose={() => setDetailsCompany(null)}
      />
      <BookingDetailsModal
        booking={bookingDetail}
        loading={loadingBookingDetail && selectedBookingId !== null}
        visible={selectedBookingId !== null}
        onClose={closeBookingDetails}
        onCancel={(id) => cancel(id).catch(() => undefined)}
        onResell={(id) => requestResell(id).catch(() => undefined)}
        onViewCompany={(companyId) => openCompanyDetailsById(companyId).catch(() => undefined)}
      />
    </ScrollView>
  );
}
