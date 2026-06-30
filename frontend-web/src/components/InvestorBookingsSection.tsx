import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import {
  defaultBookingListQuery,
  investorBookingsUrl,
  type BookingListQuery,
  type BookingSummary,
  type PagedBookings,
} from '../lib/investorBookings';

function statusBadgeClass(status: string, active: boolean) {
  if (!active) return 'bg-slate-200 text-slate-600';
  if (status === 'Confirmed') return 'bg-green-100 text-green-800';
  if (status === 'PreBooked' || status === 'Contacted') return 'bg-blue-100 text-blue-800';
  if (status === 'ResellPending') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

function BookingListPanel({
  title,
  description,
  active,
  refreshKey,
  onSelectBooking,
}: {
  title: string;
  description: string;
  active: boolean;
  refreshKey: number;
  onSelectBooking: (booking: BookingSummary) => void;
}) {
  const [query, setQuery] = useState<BookingListQuery>(() => defaultBookingListQuery(active));
  const [items, setItems] = useState<BookingSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery((prev) => ({ ...defaultBookingListQuery(active), pageSize: prev.pageSize }));
  }, [active]);

  useEffect(() => {
    setLoading(true);
    apiFetch<PagedBookings>(investorBookingsUrl(query))
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
  const panelClass = active
    ? 'rounded-lg border border-indigo-200 bg-indigo-50/40 p-4'
    : 'rounded-lg border border-slate-200 bg-slate-50 p-4';

  return (
    <section className={panelClass}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">
            {title} ({totalCount})
          </h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <label className="block text-sm">
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
            className="rounded border bg-white px-2 py-1.5"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </label>
      </div>

      {loading && <p className="mb-2 text-sm text-slate-500">Loading…</p>}

      {!loading && items.length === 0 ? (
        <p className="text-sm text-slate-600">No bookings in this list.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((booking) => (
            <li key={booking.id}>
              <button
                type="button"
                onClick={() => onSelectBooking(booking)}
                className={`w-full rounded border bg-white p-3 text-left text-sm transition hover:shadow-sm ${
                  active ? 'border-indigo-100 hover:border-indigo-300' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{booking.companyName}</p>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(booking.status, active)}`}
                  >
                    {booking.status}
                  </span>
                </div>
                <p className="mt-1 text-slate-600">
                  {booking.reservedShares} shares · {booking.totalPrice.toFixed(2)} BDT
                </p>
                <p className="mt-1 text-xs text-indigo-600">Click for full details</p>
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

export function InvestorBookingsSection({
  refreshKey,
  onSelectBooking,
}: {
  refreshKey: number;
  onSelectBooking: (booking: BookingSummary) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="font-semibold">My bookings</h2>
      <BookingListPanel
        title="Active bookings"
        description="PreBooked, Contacted, Confirmed, and pending return requests"
        active
        refreshKey={refreshKey}
        onSelectBooking={onSelectBooking}
      />
      <BookingListPanel
        title="Past bookings"
        description="Cancelled and returned bookings"
        active={false}
        refreshKey={refreshKey}
        onSelectBooking={onSelectBooking}
      />
    </div>
  );
}
