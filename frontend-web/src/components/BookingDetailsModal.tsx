import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  equityPerShare,
  formatBookingDate,
  type BookingDetail,
} from '../lib/investorBookings';

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-800 whitespace-pre-wrap break-words">{value}</div>
    </div>
  );
}

function statusBadgeClass(status: string) {
  if (status === 'Confirmed') return 'bg-green-100 text-green-800';
  if (status === 'PreBooked' || status === 'Contacted') return 'bg-blue-100 text-blue-800';
  if (status === 'ResellPending') return 'bg-amber-100 text-amber-800';
  if (status === 'Cancelled') return 'bg-red-100 text-red-800';
  if (status === 'Returned') return 'bg-slate-200 text-slate-700';
  return 'bg-slate-100 text-slate-700';
}

export function BookingDetailsModal({
  booking,
  loading,
  onClose,
  onCancel,
  onResell,
  onViewCompany,
}: {
  booking: BookingDetail | null;
  loading: boolean;
  onClose: () => void;
  onCancel: (id: string) => void;
  onResell: (id: string) => void;
  onViewCompany: (companyId: string) => void;
}) {
  if (!booking && !loading) return null;

  const perShareEquity = booking ? equityPerShare(booking) : 0;
  const stakePercent = booking
    ? (booking.reservedShares / booking.campaignTotalShares) * booking.equityPercentageOffered
    : 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-details-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 id="booking-details-title" className="text-lg font-semibold">
              {loading ? 'Loading booking…' : booking?.companyName}
            </h3>
            {booking && (
              <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(booking.status)}`}>
                {booking.status}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-2">
          {loading && <p className="py-6 text-sm text-slate-600">Loading booking details…</p>}
          {!loading && booking && (
            <div className="divide-y divide-slate-100">
              <div className="pb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company</p>
                <DetailField label="Company name" value={booking.companyName} />
                <DetailField label="Industry" value={booking.companyIndustry?.trim() || 'Not provided'} />
                <DetailField
                  label="Location"
                  value={
                    [booking.companyCity, booking.companyCountry].filter(Boolean).join(', ') || 'Not provided'
                  }
                />
                <button
                  type="button"
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                  onClick={() => onViewCompany(booking.companyId)}
                >
                  View company profile
                </button>
              </div>
              <div className="pt-2">
                <p className="pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Booking</p>
                <DetailField label="Shares reserved" value={booking.reservedShares} />
                <DetailField label="Total price" value={`${booking.totalPrice.toFixed(2)} BDT`} />
                <DetailField label="Price per share" value={`${booking.pricePerShare.toFixed(2)} BDT`} />
                <DetailField
                  label="Your stake"
                  value={`${stakePercent.toFixed(4)}% of company (${perShareEquity.toFixed(4)}% per share)`}
                />
                <DetailField label="Booked on" value={formatBookingDate(booking.createdAt)} />
                <DetailField label="Last updated" value={formatBookingDate(booking.updatedAt)} />
              </div>
            </div>
          )}
        </div>

        {!loading && booking && (
          <div className="shrink-0 border-t border-slate-200 px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {(booking.status === 'PreBooked' || booking.status === 'Contacted') && (
                <button
                  type="button"
                  className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => onCancel(booking.id)}
                >
                  Cancel / free shares
                </button>
              )}
              {booking.status === 'Confirmed' && (
                <button
                  type="button"
                  className="rounded border border-amber-200 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-50"
                  onClick={() => onResell(booking.id)}
                >
                  Request return (resell)
                </button>
              )}
              {booking.status === 'ResellPending' && (
                <p className="text-sm text-amber-700">Awaiting company approval to return shares</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
