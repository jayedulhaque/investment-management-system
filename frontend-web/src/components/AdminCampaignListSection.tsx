import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import {
  adminActiveCampaignsUrl,
  adminClosedCampaignsUrl,
  emptyCampaignListQuery,
  type CampaignListQuery,
  type CampaignSummary,
  type PagedCampaigns,
} from '../lib/adminCampaigns';
import { equityPerShare } from '../lib/investorCampaigns';

type Mode = 'active' | 'closed';

const config: Record<
  Mode,
  { title: string; description: string; emptyMessage: string; badge: string; badgeClass: string }
> = {
  active: {
    title: 'Active campaigns',
    description: 'Paid campaigns currently open for investment.',
    emptyMessage: 'No active campaigns.',
    badge: 'Active',
    badgeClass: 'bg-green-100 text-green-800',
  },
  closed: {
    title: 'Closed campaigns',
    description: 'Paid campaigns where all shares have been booked.',
    emptyMessage: 'No closed campaigns.',
    badge: 'Closed',
    badgeClass: 'bg-slate-200 text-slate-700',
  },
};

export function AdminCampaignListSection({
  mode,
  refreshKey,
  onSelectCampaign,
}: {
  mode: Mode;
  refreshKey: number;
  onSelectCampaign: (campaign: CampaignSummary) => void;
}) {
  const { title, description, emptyMessage, badge, badgeClass } = config[mode];
  const listUrl = mode === 'active' ? adminActiveCampaignsUrl : adminClosedCampaignsUrl;

  const [searchInput, setSearchInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [query, setQuery] = useState<CampaignListQuery>(emptyCampaignListQuery);
  const [items, setItems] = useState<CampaignSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((prev) => ({
        ...prev,
        page: 1,
        search: searchInput,
        city: cityInput,
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, cityInput]);

  useEffect(() => {
    setLoading(true);
    apiFetch<PagedCampaigns>(listUrl(query))
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
  }, [query, refreshKey, mode]);

  const rangeStart = totalCount === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const rangeEnd = Math.min(query.page * query.pageSize, totalCount);

  return (
    <section>
      <h2 className="mb-3 font-semibold">
        {title} ({totalCount})
      </h2>
      <p className="mb-3 text-sm text-slate-600">{description}</p>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-slate-600">Search</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Company name, industry, city…"
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
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((campaign) => (
            <li key={campaign.id}>
              <button
                type="button"
                onClick={() => onSelectCampaign(campaign)}
                className="w-full rounded border bg-slate-50 p-3 text-left text-sm transition hover:border-indigo-300 hover:bg-indigo-50/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{campaign.company?.companyName ?? campaign.companyName}</p>
                  <span className={`rounded px-2 py-0.5 text-xs ${badgeClass}`}>{badge}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{campaign.company?.industry ?? '—'}</p>
                <p className="text-slate-600">
                  {campaign.totalShares} shares · {campaign.equityPercentageOffered}% equity ·{' '}
                  {equityPerShare(campaign).toFixed(4)}% per share
                </p>
                <p className="text-slate-600">
                  {campaign.pricePerShare} BDT/share ·{' '}
                  {mode === 'closed' ? 'fully booked' : `${campaign.availableShares} available`}
                </p>
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
    </section>
  );
}
