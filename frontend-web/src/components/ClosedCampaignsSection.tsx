import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import {
  closedCampaignsUrl,
  emptyCampaignListQuery,
  equityPerShare,
  type CampaignListQuery,
  type CampaignSummary,
  type PagedCampaigns,
} from '../lib/investorCampaigns';

export function ClosedCampaignsSection({
  refreshKey,
  onViewCompanyDetails,
}: {
  refreshKey?: number;
  onViewCompanyDetails: (campaign: CampaignSummary) => void;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');
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
        industry: industryInput,
        city: cityInput,
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, industryInput, cityInput]);

  useEffect(() => {
    setLoading(true);
    apiFetch<PagedCampaigns>(closedCampaignsUrl(query))
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

  const rangeStart = totalCount === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const rangeEnd = Math.min(query.page * query.pageSize, totalCount);

  return (
    <section>
      <h2 className="mb-3 font-semibold">Closed campaigns ({totalCount})</h2>
      <p className="mb-3 text-sm text-slate-600">Fully booked campaigns are no longer open for new bookings.</p>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
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
          <span className="mb-1 block text-slate-600">Industry</span>
          <input
            type="text"
            value={industryInput}
            onChange={(e) => setIndustryInput(e.target.value)}
            placeholder="Filter by industry"
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
        <p className="text-sm text-slate-600">No closed campaigns match your filters.</p>
      ) : (
        <div className="grid gap-3">
          {items.map((campaign) => (
            <div key={campaign.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="font-medium">{campaign.company?.companyName ?? campaign.companyName}</p>
                <span className="shrink-0 rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                  Closed
                </span>
              </div>
              {campaign.company?.industry && (
                <p className="text-xs text-slate-500">{campaign.company.industry}</p>
              )}
              <p className="mt-1 text-sm text-slate-600">
                {campaign.equityPercentageOffered}% of company · {campaign.totalShares} / {campaign.totalShares}{' '}
                share units booked
              </p>
              <p className="text-sm text-slate-600">
                {campaign.pricePerShare} BDT/share · {equityPerShare(campaign).toFixed(4)}% company per share
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  className="rounded border px-3 py-1.5 text-sm text-slate-700 hover:bg-white"
                  onClick={() => onViewCompanyDetails(campaign)}
                >
                  View company details
                </button>
              </div>
            </div>
          ))}
        </div>
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
              className="rounded border bg-white px-3 py-1 text-sm disabled:opacity-40"
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
              className="rounded border bg-white px-3 py-1 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
