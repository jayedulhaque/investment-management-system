import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-800 whitespace-pre-wrap break-words">{value}</div>
    </div>
  );
}

function InvestorDetailContent({ investor }: { investor: InvestorDetail }) {
  return (
    <div className="divide-y divide-slate-100">
      <div className="pb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
        <DetailField label="Login email" value={displayValue(investor.email)} />
        <DetailField label="Status" value={investor.isActive ? 'Active' : 'Inactive'} />
        <DetailField label="Total bookings" value={String(investor.totalBookings)} />
        <DetailField label="Active bookings" value={String(investor.activeBookings)} />
      </div>
      <div className="pt-2">
        <p className="pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Personal identity</p>
        <DetailField label="Full name" value={displayValue(investor.fullName)} />
        <DetailField label="National ID" value={displayValue(investor.nationalId)} />
        <DetailField label="Date of birth" value={displayValue(investor.dateOfBirth)} />
        <DetailField label="Occupation" value={displayValue(investor.occupation)} />
      </div>
      <div className="pt-2">
        <p className="pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact & location</p>
        <DetailField label="Phone" value={displayValue(investor.phone)} />
        <DetailField label="Contact email" value={displayValue(investor.contactEmail)} />
        <DetailField label="Address" value={displayValue(investor.address)} />
        <DetailField label="City" value={displayValue(investor.city)} />
        <DetailField label="Country" value={displayValue(investor.country)} />
      </div>
    </div>
  );
}

function InvestorModal({
  investor,
  loading,
  loadError,
  statusUpdating,
  onClose,
  onSetActive,
}: {
  investor: InvestorDetail | null;
  loading: boolean;
  loadError: string | null;
  statusUpdating: boolean;
  onClose: () => void;
  onSetActive: (isActive: boolean) => void;
}) {
  useEffect(() => {
    if (!investor) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [investor, onClose]);

  if (!investor) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="investor-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 id="investor-modal-title" className="text-lg font-semibold">
              {investor.fullName || investor.email}
            </h3>
            <p className="text-sm text-slate-500">{investor.isActive ? 'Active investor' : 'Inactive investor'}</p>
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
          {loading && <p className="mb-3 text-center text-xs text-slate-500">Refreshing details…</p>}
          <InvestorDetailContent investor={investor} />
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-200 px-6 py-4">
          {investor.isActive ? (
            <button
              type="button"
              disabled={statusUpdating}
              onClick={() => onSetActive(false)}
              className="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {statusUpdating ? 'Updating…' : 'Deactivate investor'}
            </button>
          ) : (
            <button
              type="button"
              disabled={statusUpdating}
              onClick={() => onSetActive(true)}
              className="rounded bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {statusUpdating ? 'Updating…' : 'Activate investor'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalInvestor, setModalInvestor] = useState<InvestorDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
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
    setSelectedId(summary.userId);
    setModalInvestor({
      ...summary,
      totalBookings: 0,
      activeBookings: 0,
    });
    setModalError(null);
    setModalLoading(true);
    apiFetch<InvestorDetail>(`/api/admin/investors/${summary.userId}`)
      .then(setModalInvestor)
      .catch(() => setModalError('Could not load full investor details.'))
      .finally(() => setModalLoading(false));
  };

  const closeModal = () => {
    setSelectedId(null);
    setModalInvestor(null);
    setModalError(null);
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
      setModalError(e instanceof Error ? e.message : 'Failed to update investor status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const rangeStart = totalCount === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const rangeEnd = Math.min(query.page * query.pageSize, totalCount);

  return (
    <section>
      <h2 className="mb-3 font-semibold">Investors ({totalCount})</h2>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-slate-600">Search</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Name, email, phone, NID…"
            className="w-full rounded border px-2 py-1.5"
          />
        </label>
        <label className="block w-full text-sm sm:w-40">
          <span className="mb-1 block text-slate-600">City</span>
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Filter by city"
            className="w-full rounded border px-2 py-1.5"
          />
        </label>
        <label className="block w-full text-sm sm:w-36">
          <span className="mb-1 block text-slate-600">Status</span>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="w-full rounded border px-2 py-1.5"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="block w-full text-sm sm:w-32">
          <span className="mb-1 block text-slate-600">Per page</span>
          <select
            value={query.pageSize}
            onChange={(e) =>
              setQuery((prev) => ({
                ...prev,
                page: 1,
                pageSize: Number(e.target.value),
              }))
            }
            className="w-full rounded border px-2 py-1.5"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </label>
      </div>

      {loading && <p className="mb-2 text-sm text-slate-500">Loading…</p>}

      {!loading && items.length === 0 ? (
        <p className="text-sm text-slate-600">No investors match your filters.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((investor) => (
            <li key={investor.userId}>
              <button
                type="button"
                onClick={() => openInvestor(investor)}
                className={`w-full rounded border bg-white p-3 text-left text-sm transition hover:border-indigo-400 hover:shadow-sm ${
                  selectedId === investor.userId ? 'border-indigo-400' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{investor.fullName || investor.email}</p>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                      investor.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {investor.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{investor.email}</p>
                {investor.phone && <p className="text-xs text-slate-500">Phone: {investor.phone}</p>}
                {investor.city && investor.country && (
                  <p className="text-xs text-slate-500">
                    {investor.city}, {investor.country}
                  </p>
                )}
                <p className="mt-1 text-xs text-indigo-600">Click to view full details</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            Showing {rangeStart}–{rangeEnd} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={query.page <= 1 || loading}
              onClick={() => setQuery((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="rounded border px-3 py-1 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {query.page} of {totalPages || 1}
            </span>
            <button
              type="button"
              disabled={query.page >= totalPages || loading}
              onClick={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="rounded border px-3 py-1 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <InvestorModal
        investor={modalInvestor}
        loading={modalLoading}
        loadError={modalError}
        statusUpdating={statusUpdating}
        onClose={closeModal}
        onSetActive={(isActive) => setInvestorActive(isActive).catch(() => undefined)}
      />
    </section>
  );
}
