import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CompanyListSection } from '../components/CompanyListSection';
import { InvestorListSection } from '../components/InvestorListSection';
import { AdminCampaignListSection } from '../components/AdminCampaignListSection';
import { AdminCampaignDetailsModal } from '../components/AdminCampaignDetailsModal';
import { apiFetch } from '../lib/api';
import type { CompanyReview } from '../lib/adminCompanyList';
import type { CampaignSummary } from '../lib/adminCampaigns';

function displayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'Not provided';
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-800 whitespace-pre-wrap break-words">{value}</div>
    </div>
  );
}

function CompanyDetailContent({ company }: { company: CompanyReview }) {
  return (
    <div className="divide-y divide-slate-100">
      <div className="pb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
        <DetailField label="Login email" value={displayValue(company.email)} />
        {company.approvalStatus && <DetailField label="Status" value={company.approvalStatus} />}
      </div>
      <div className="pt-2">
        <p className="pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Company identity</p>
        <DetailField label="Company name" value={displayValue(company.companyName)} />
        <DetailField label="Legal name" value={displayValue(company.legalName)} />
        <DetailField label="Registration number" value={displayValue(company.registrationNumber)} />
        <DetailField label="Industry" value={displayValue(company.industry)} />
        <DetailField label="Description" value={displayValue(company.description)} />
      </div>
      <div className="pt-2">
        <p className="pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact & location</p>
        <DetailField label="Phone" value={displayValue(company.phone)} />
        <DetailField label="Contact email" value={displayValue(company.contactEmail)} />
        <DetailField
          label="Website"
          value={
            company.website?.trim() ? (
              <a href={company.website} className="text-indigo-600" target="_blank" rel="noreferrer">
                {company.website}
              </a>
            ) : (
              'Not provided'
            )
          }
        />
        <DetailField label="Address" value={displayValue(company.address)} />
        <DetailField label="City" value={displayValue(company.city)} />
        <DetailField label="Country" value={displayValue(company.country)} />
      </div>
      <div className="pt-2">
        <p className="pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Documents</p>
        <DetailField
          label="Documentation URL"
          value={
            <a href={company.documentationUrl} className="text-indigo-600" target="_blank" rel="noreferrer">
              {company.documentationUrl}
            </a>
          }
        />
      </div>
    </div>
  );
}

function CompanyModal({
  company,
  loading,
  loadError,
  mode,
  onClose,
  onApprove,
  onReject,
  onDelete,
}: {
  company: CompanyReview | null;
  loading: boolean;
  loadError: string | null;
  mode: 'pending' | 'approved' | 'rejected';
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
}) {
  useEffect(() => {
    if (!company) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [company, onClose]);

  if (!company) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 id="company-modal-title" className="text-lg font-semibold">
              {company.companyName || company.email}
            </h3>
            <p className="text-sm text-slate-500">
              {mode === 'pending' ? 'Pending approval' : company.approvalStatus}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
          {loadError && (
            <p className="mb-3 rounded bg-amber-50 p-2 text-sm text-amber-800">{loadError}</p>
          )}
          {loading && (
            <p className="mb-3 text-center text-xs text-slate-500">Refreshing details…</p>
          )}
          <CompanyDetailContent company={company} />
        </div>
        {mode === 'pending' && (
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onApprove}
              className="rounded bg-green-600 px-4 py-2 text-sm text-white"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={onReject}
              className="rounded bg-red-600 px-4 py-2 text-sm text-white"
            >
              Reject
            </button>
          </div>
        )}
        {mode === 'approved' && (
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onReject}
              className="rounded bg-red-600 px-4 py-2 text-sm text-white"
            >
              Reject
            </button>
          </div>
        )}
        {mode === 'rejected' && (
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onDelete}
              className="rounded bg-red-600 px-4 py-2 text-sm text-white"
            >
              Delete permanently
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function AdminPage() {
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [profile, setProfile] = useState({ email: '', password: '', bKashNumber: '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [modalCompany, setModalCompany] = useState<CompanyReview | null>(null);
  const [modalMode, setModalMode] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null);
  const [loadingCompanyDetail, setLoadingCompanyDetail] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const refreshCompanyLists = () => setListRefreshKey((key) => key + 1);

  const openCampaignDetail = (campaign: CampaignSummary) => {
    setSelectedCampaignId(campaign.id);
  };

  const openCompanyModal = (company: CompanyReview, mode: 'pending' | 'approved' | 'rejected') => {
    setModalMode(mode);
    setModalCompany(company);
    setDetailLoadError(null);
    setLoadingCompanyDetail(true);
    apiFetch<CompanyReview>(`/api/admin/companies/${company.companyProfileId}`)
      .then((detail) => setModalCompany(detail))
      .catch(() =>
        setDetailLoadError('Could not refresh from server. Showing details from the list.'),
      )
      .finally(() => setLoadingCompanyDetail(false));
  };

  const approve = async (id: string, approveCompany: boolean) => {
    await apiFetch(`/api/admin/companies/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approve: approveCompany }),
    });
    setModalCompany(null);
    refreshCompanyLists();
    setMessage(approveCompany ? 'Company approved.' : 'Company rejected.');
  };

  const deleteRejected = async (id: string, companyName: string) => {
    const label = companyName || 'this company';
    if (
      !window.confirm(
        `Delete ${label}? This permanently removes the company registration and account.`,
      )
    ) {
      return;
    }
    await apiFetch(`/api/admin/companies/${id}`, { method: 'DELETE' });
    setModalCompany(null);
    refreshCompanyLists();
    setMessage('Rejected company deleted.');
  };

  const rejectApproved = async (id: string, companyName: string) => {
    const label = companyName || 'this company';
    if (
      !window.confirm(
        `Reject ${label}? The company will lose access and move to the rejected list.`,
      )
    ) {
      return;
    }
    await apiFetch(`/api/admin/companies/${id}/reject`, { method: 'POST' });
    setModalCompany(null);
    refreshCompanyLists();
    setMessage('Company rejected.');
  };

  const openProfileEditor = async () => {
    setEditingProfile(true);
    setLoadingProfile(true);
    try {
      const data = await apiFetch<{ email: string; bKashNumber: string }>('/api/admin/profile');
      setProfile({ email: data.email, password: '', bKashNumber: data.bKashNumber });
    } catch {
      setMessage('Could not load profile.');
      setEditingProfile(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const body: Record<string, string> = {
      email: profile.email,
      bKashNumber: profile.bKashNumber,
    };
    if (profile.password) body.password = profile.password;
    await apiFetch('/api/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    setMessage('Admin profile updated.');
    setEditingProfile(false);
    setProfile((prev) => ({ ...prev, password: '' }));
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      {message && <p className="rounded bg-green-50 p-2 text-sm">{message}</p>}

      <section className="rounded-lg bg-white p-4 shadow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">System profile</h2>
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
          <form onSubmit={saveProfile} className="space-y-4 max-w-md">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Email</span>
              <input
                className="w-full rounded border px-2 py-1.5"
                type="email"
                autoComplete="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">New password (optional)</span>
              <input
                className="w-full rounded border px-2 py-1.5"
                type="password"
                autoComplete="new-password"
                value={profile.password}
                onChange={(e) => setProfile({ ...profile, password: e.target.value })}
              />
              <span className="mt-1 block text-xs text-slate-500">Leave blank to keep your current password</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">bKash receiving number</span>
              <input
                className="w-full rounded border px-2 py-1.5"
                type="tel"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 01712345678"
                value={profile.bKashNumber}
                onChange={(e) => setProfile({ ...profile, bKashNumber: e.target.value })}
              />
              <span className="mt-1 block text-xs text-slate-500">
                Your bKash wallet number where investors send payments — not a general mobile contact number
              </span>
            </label>
            <div className="flex gap-2">
              <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-white">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingProfile(false);
                  setProfile((prev) => ({ ...prev, password: '' }));
                }}
                className="rounded border px-4 py-2 text-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <CompanyListSection
        title="Pending companies"
        apiPath="/api/admin/companies/pending"
        mode="pending"
        emptyMessage="No companies awaiting approval."
        refreshKey={listRefreshKey}
        onOpenCompany={(c) => openCompanyModal(c, 'pending')}
      />

      <CompanyListSection
        title="Approved companies"
        apiPath="/api/admin/companies/approved"
        mode="approved"
        emptyMessage="No approved companies yet."
        refreshKey={listRefreshKey}
        onOpenCompany={(c) => openCompanyModal(c, 'approved')}
        renderActions={(c) => (
          <button
            type="button"
            onClick={() => rejectApproved(c.companyProfileId, c.companyName).catch(() => undefined)}
            className="shrink-0 rounded border border-red-200 bg-white px-4 text-sm text-red-700 transition hover:bg-red-50"
          >
            Reject
          </button>
        )}
      />

      <CompanyListSection
        title="Rejected companies"
        apiPath="/api/admin/companies/rejected"
        mode="rejected"
        emptyMessage="No rejected companies."
        refreshKey={listRefreshKey}
        onOpenCompany={(c) => openCompanyModal(c, 'rejected')}
        renderActions={(c) => (
          <button
            type="button"
            onClick={() => deleteRejected(c.companyProfileId, c.companyName).catch(() => undefined)}
            className="shrink-0 rounded border border-red-200 bg-white px-4 text-sm text-red-700 transition hover:bg-red-50"
          >
            Delete
          </button>
        )}
      />

      <CompanyModal
        company={modalCompany}
        loading={loadingCompanyDetail}
        loadError={detailLoadError}
        mode={modalMode}
        onClose={() => setModalCompany(null)}
        onApprove={
          modalCompany && modalMode === 'pending'
            ? () => approve(modalCompany.companyProfileId, true).catch(() => undefined)
            : undefined
        }
        onReject={
          modalCompany && modalMode === 'pending'
            ? () => approve(modalCompany.companyProfileId, false).catch(() => undefined)
            : modalCompany && modalMode === 'approved'
              ? () => rejectApproved(modalCompany.companyProfileId, modalCompany.companyName).catch(() => undefined)
              : undefined
        }
        onDelete={
          modalCompany && modalMode === 'rejected'
            ? () => deleteRejected(modalCompany.companyProfileId, modalCompany.companyName).catch(() => undefined)
            : undefined
        }
      />

      <AdminCampaignListSection
        mode="active"
        refreshKey={listRefreshKey}
        onSelectCampaign={openCampaignDetail}
      />

      <AdminCampaignListSection
        mode="closed"
        refreshKey={listRefreshKey}
        onSelectCampaign={openCampaignDetail}
      />

      <AdminCampaignDetailsModal
        campaignId={selectedCampaignId}
        onClose={() => setSelectedCampaignId(null)}
      />

      <InvestorListSection refreshKey={listRefreshKey} />
    </div>
  );
}
