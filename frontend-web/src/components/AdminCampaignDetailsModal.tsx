import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '../lib/api';
import {
  adminCampaignDetailUrl,
  type AdminCampaignDetail,
} from '../lib/adminCampaigns';
import type { CompanyReview } from '../lib/adminCompanyList';
import { equityPerShare } from '../lib/investorCampaigns';

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

export function AdminCampaignDetailsModal({
  campaignId,
  onClose,
}: {
  campaignId: string | null;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<AdminCampaignDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) {
      setDetail(null);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    apiFetch<AdminCampaignDetail>(adminCampaignDetailUrl(campaignId))
      .then(setDetail)
      .catch(() => {
        setDetail(null);
        setLoadError('Could not load campaign details.');
      })
      .finally(() => setLoading(false));
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [campaignId, onClose]);

  if (!campaignId) return null;

  const campaign = detail?.campaign;
  const companyName = campaign?.company?.companyName ?? campaign?.companyName ?? 'Campaign';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="campaign-detail-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 id="campaign-detail-title" className="text-lg font-semibold">
              {companyName}
            </h3>
            {campaign && (
              <p className="text-sm text-slate-500">
                {campaign.isClosed ? 'Closed campaign' : 'Active campaign'} · {detail?.totalBookedShares ?? 0}{' '}
                shares booked
              </p>
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading && <p className="text-sm text-slate-500">Loading campaign details…</p>}
          {loadError && (
            <p className="mb-3 rounded bg-amber-50 p-2 text-sm text-amber-800">{loadError}</p>
          )}

          {detail && (
            <div className="space-y-8">
              <section>
                <h4 className="mb-3 font-semibold text-slate-800">Campaign</h4>
                <div className="rounded border bg-slate-50 p-4 text-sm">
                  <p>
                    {detail.campaign.totalShares} total shares · {detail.campaign.availableShares} available ·{' '}
                    {detail.campaign.equityPercentageOffered}% equity ·{' '}
                    {equityPerShare(detail.campaign).toFixed(4)}% per share
                  </p>
                  <p className="mt-1">
                    {detail.campaign.pricePerShare} BDT/share · {detail.totalBookedShares} shares booked
                  </p>
                </div>
              </section>

              <section>
                <h4 className="mb-3 font-semibold text-slate-800">Company</h4>
                <CompanyDetailContent company={detail.company} />
              </section>

              <section>
                <h4 className="mb-3 font-semibold text-slate-800">
                  Investor bookings ({detail.bookings.length})
                </h4>
                {detail.bookings.length === 0 ? (
                  <p className="text-sm text-slate-600">No bookings yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded border">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Investor</th>
                          <th className="px-3 py-2">Contact</th>
                          <th className="px-3 py-2">Shares</th>
                          <th className="px-3 py-2">Total</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {detail.bookings.map((booking) => (
                          <tr key={booking.bookingId}>
                            <td className="px-3 py-2">
                              <p className="font-medium">{booking.investorFullName || '—'}</p>
                              <p className="text-xs text-slate-500">{booking.investorEmail}</p>
                              {booking.investorNationalId && (
                                <p className="text-xs text-slate-500">ID: {booking.investorNationalId}</p>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-600">
                              <p>{booking.investorPhone || '—'}</p>
                              {booking.investorContactEmail && <p>{booking.investorContactEmail}</p>}
                              {(booking.investorCity || booking.investorCountry) && (
                                <p>
                                  {[booking.investorCity, booking.investorCountry].filter(Boolean).join(', ')}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2">{booking.reservedShares}</td>
                            <td className="px-3 py-2">{booking.totalPrice} BDT</td>
                            <td className="px-3 py-2">{booking.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
