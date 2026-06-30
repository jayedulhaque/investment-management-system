import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type CompanyPublic = {
  companyProfileId: string;
  companyName: string;
  legalName?: string | null;
  description: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  city?: string | null;
  country?: string | null;
};

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

export function CompanyDetailsModal({
  company,
  onClose,
}: {
  company: CompanyPublic | null;
  onClose: () => void;
}) {
  if (!company) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-details-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h3 id="company-details-title" className="text-lg font-semibold">
              {company.companyName}
            </h3>
            {company.industry && <p className="text-sm text-slate-500">{company.industry}</p>}
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
          <DetailField label="Legal name" value={displayValue(company.legalName)} />
          <DetailField label="Description" value={displayValue(company.description)} />
          <DetailField label="Industry" value={displayValue(company.industry)} />
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
          <DetailField label="City" value={displayValue(company.city)} />
          <DetailField label="Country" value={displayValue(company.country)} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
