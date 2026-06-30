import { useEffect, useState, type ReactNode } from 'react';
import { apiFetch } from '../lib/api';
import {
  type CompanyListQuery,
  type CompanyReview,
  type PagedResponse,
  companyListUrl,
  emptyCompanyListQuery,
} from '../lib/adminCompanyList';

type CompanyListMode = 'pending' | 'approved' | 'rejected';

function statusClass(mode: CompanyListMode) {
  if (mode === 'approved') return 'text-green-700';
  if (mode === 'rejected') return 'text-red-700';
  return 'text-slate-600';
}

export function CompanyListSection({
  title,
  apiPath,
  mode,
  emptyMessage,
  refreshKey,
  onOpenCompany,
  renderActions,
}: {
  title: string;
  apiPath: string;
  mode: CompanyListMode;
  emptyMessage: string;
  refreshKey: number;
  onOpenCompany: (company: CompanyReview) => void;
  renderActions?: (company: CompanyReview) => ReactNode;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');
  const [query, setQuery] = useState<CompanyListQuery>(emptyCompanyListQuery);
  const [items, setItems] = useState<CompanyReview[]>([]);
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
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, industryInput]);

  useEffect(() => {
    setLoading(true);
    apiFetch<PagedResponse<CompanyReview>>(companyListUrl(apiPath, query))
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
  }, [apiPath, query, refreshKey]);

  const rangeStart = totalCount === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const rangeEnd = Math.min(query.page * query.pageSize, totalCount);

  return (
    <section>
      <h2 className="mb-3 font-semibold">
        {title} ({totalCount})
      </h2>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-slate-600">Search</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Name, email, city, industry…"
            className="w-full rounded border px-2 py-1.5"
          />
        </label>
        <label className="block w-full text-sm sm:w-48">
          <span className="mb-1 block text-slate-600">Industry</span>
          <input
            type="text"
            value={industryInput}
            onChange={(e) => setIndustryInput(e.target.value)}
            placeholder="Filter by industry"
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
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      {loading && <p className="mb-2 text-sm text-slate-500">Loading…</p>}

      {!loading && items.length === 0 ? (
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={c.companyProfileId} className={renderActions ? 'flex items-stretch gap-2' : undefined}>
              <button
                type="button"
                onClick={() => onOpenCompany(c)}
                className={`rounded border bg-white p-3 text-left text-sm transition hover:border-indigo-400 hover:shadow-sm ${
                  renderActions ? 'flex-1' : 'w-full'
                }`}
              >
                <p className="font-medium">{c.companyName}</p>
                {mode !== 'pending' && c.approvalStatus && (
                  <p className={`text-xs ${statusClass(mode)}`}>{c.approvalStatus}</p>
                )}
                <p className="mt-1 text-xs text-slate-600">{c.email}</p>
                {c.industry && <p className="text-xs text-slate-500">{c.industry}</p>}
                <p className="mt-1 text-xs text-indigo-600">Click to view full details</p>
              </button>
              {renderActions?.(c)}
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
