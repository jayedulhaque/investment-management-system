import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { ShareCalculator } from '../components/ShareCalculator';
import { CompanyDetailsModal, type CompanyPublic } from '../components/CompanyDetailsModal';
import { BookingDetailsModal } from '../components/BookingDetailsModal';
import { InvestorBookingsSection } from '../components/InvestorBookingsSection';
import { InvestorProfileForm } from '../components/InvestorProfileForm';
import { ActiveCampaignsSection } from '../components/ActiveCampaignsSection';
import { ClosedCampaignsSection } from '../components/ClosedCampaignsSection';
import { useNotificationStore } from '../store/notificationStore';
import { type BookingDetail, type BookingSummary } from '../lib/investorBookings';
import { type CampaignSummary } from '../lib/investorCampaigns';
import {
  emptyInvestorRegistration,
  investorProfileFromRegistration,
  toInvestorProfileUpdatePayload,
  type InvestorProfile,
  type InvestorRegistrationInfo,
} from '../types/investor';

export function InvestorPage() {
  const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);
  const [selected, setSelected] = useState<CampaignSummary | null>(null);
  const [detailsCompany, setDetailsCompany] = useState<CompanyPublic | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null);
  const [loadingBookingDetail, setLoadingBookingDetail] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profile, setProfile] = useState<InvestorRegistrationInfo>(emptyInvestorRegistration());
  const [loginEmail, setLoginEmail] = useState('');
  const [canBook, setCanBook] = useState(true);
  const fetchUnread = useNotificationStore((s) => s.fetchUnread);

  const refreshBookings = () => setBookingsRefreshKey((key) => key + 1);

  useEffect(() => {
    fetchUnread().catch(() => undefined);
    apiFetch<InvestorProfile>('/api/investors/profile')
      .then((data) => setCanBook(data.isActive))
      .catch(() => undefined);
  }, [fetchUnread]);

  const book = async (shares: number) => {
    if (!selected || !canBook) return;
    setMessage(null);
    try {
      await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ campaignId: selected.id, reservedShares: shares }),
      });
      setSelected(null);
      setMessage('Booking created (PreBooked).');
      refreshBookings();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Booking failed');
    }
  };

  const cancel = async (id: string) => {
    await apiFetch(`/api/bookings/${id}/cancel`, { method: 'POST' });
    setSelectedBookingId(null);
    setBookingDetail(null);
    refreshBookings();
  };

  const resell = async (id: string) => {
    await apiFetch(`/api/bookings/${id}/resell`, { method: 'POST' });
    setMessage('Return request sent. Waiting for company approval.');
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
      .catch(() => {
        setMessage('Could not load booking details.');
        setSelectedBookingId(null);
      })
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
    setMessage(null);
    try {
      const data = await apiFetch<InvestorProfile>('/api/investors/profile');
      setLoginEmail(data.email);
      setProfile(investorProfileFromRegistration(data));
    } catch {
      setMessage('Could not load investor profile.');
      setEditingProfile(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const updateProfileField = (field: keyof InvestorRegistrationInfo, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await apiFetch('/api/investors/profile', {
        method: 'PUT',
        body: JSON.stringify(toInvestorProfileUpdatePayload(profile)),
      });
      setMessage('Investor profile updated.');
      setEditingProfile(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Investor dashboard</h1>
      {message && <p className="rounded bg-blue-50 p-2 text-sm text-blue-800">{message}</p>}

      <section className="rounded-lg bg-white p-4 shadow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">My profile</h2>
          {!editingProfile && (
            <button
              type="button"
              onClick={() => openProfileEditor().catch(() => undefined)}
              className="rounded bg-indigo-600 px-4 py-2 text-sm text-white"
            >
              Edit profile
            </button>
          )}
        </div>
        {editingProfile && loadingProfile && (
          <p className="text-sm text-slate-600">Loading profile…</p>
        )}
        {editingProfile && !loadingProfile && (
          <form onSubmit={saveProfile} className="space-y-4">
            <InvestorProfileForm
              value={profile}
              onChange={updateProfileField}
              loginEmail={loginEmail}
            />
            <div className="flex gap-2">
              <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-white">
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="rounded border px-4 py-2 text-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <ActiveCampaignsSection
        refreshKey={bookingsRefreshKey}
        canBook={canBook}
        onBookShares={setSelected}
        onViewCompanyDetails={(campaign) => openCompanyDetails(campaign).catch(() => undefined)}
      />
      {selected && canBook && (
        <div className="mt-4">
          <ShareCalculator
            pricePerShare={selected.pricePerShare}
            minInvestmentThreshold={selected.minInvestmentThreshold}
            maxShares={selected.availableShares}
            onSubmit={(shares) => book(shares)}
          />
          <button type="button" className="mt-2 text-sm text-slate-500" onClick={() => setSelected(null)}>
            Close
          </button>
        </div>
      )}

      <ClosedCampaignsSection
        refreshKey={bookingsRefreshKey}
        onViewCompanyDetails={(campaign) => openCompanyDetails(campaign).catch(() => undefined)}
      />

      <CompanyDetailsModal company={detailsCompany} onClose={() => setDetailsCompany(null)} />

      <InvestorBookingsSection refreshKey={bookingsRefreshKey} onSelectBooking={openBookingDetails} />

      <BookingDetailsModal
        booking={bookingDetail}
        loading={loadingBookingDetail && selectedBookingId !== null}
        onClose={closeBookingDetails}
        onCancel={(id) => cancel(id).catch(() => undefined)}
        onResell={(id) => resell(id).catch(() => undefined)}
        onViewCompany={(companyId) => openCompanyDetailsById(companyId).catch(() => undefined)}
      />
    </div>
  );
}
