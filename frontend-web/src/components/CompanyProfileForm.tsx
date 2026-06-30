import type { CompanyRegistrationInfo } from '../types/company';

type Props = {
  value: CompanyRegistrationInfo;
  onChange: (field: keyof CompanyRegistrationInfo, value: string) => void;
  loginEmail?: string;
};

export function CompanyProfileForm({ value, onChange, loginEmail }: Props) {
  return (
    <div className="space-y-4">
      {loginEmail && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Login email</span>
          <input
            type="email"
            className="w-full rounded border bg-slate-50 px-3 py-2 text-slate-600"
            value={loginEmail}
            readOnly
          />
          <span className="mt-1 block text-xs text-slate-500">Account email cannot be changed here</span>
        </label>
      )}

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-semibold text-slate-700">Company identity</legend>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Company name</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={value.companyName}
            onChange={(e) => onChange('companyName', e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Legal name (optional)</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={value.legalName ?? ''}
            onChange={(e) => onChange('legalName', e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Registration number (optional)</span>
            <input
              className="w-full rounded border px-3 py-2"
              value={value.registrationNumber ?? ''}
              onChange={(e) => onChange('registrationNumber', e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Industry (optional)</span>
            <input
              className="w-full rounded border px-3 py-2"
              value={value.industry ?? ''}
              onChange={(e) => onChange('industry', e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-semibold text-slate-700">Contact & location</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Phone (optional)</span>
            <input
              type="tel"
              className="w-full rounded border px-3 py-2"
              value={value.phone ?? ''}
              onChange={(e) => onChange('phone', e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Contact email (optional)</span>
            <input
              type="email"
              className="w-full rounded border px-3 py-2"
              value={value.contactEmail ?? ''}
              onChange={(e) => onChange('contactEmail', e.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Website (optional)</span>
          <input
            type="url"
            className="w-full rounded border px-3 py-2"
            value={value.website ?? ''}
            onChange={(e) => onChange('website', e.target.value)}
            placeholder="https://example.com"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Address (optional)</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={value.address ?? ''}
            onChange={(e) => onChange('address', e.target.value)}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">City (optional)</span>
            <input
              className="w-full rounded border px-3 py-2"
              value={value.city ?? ''}
              onChange={(e) => onChange('city', e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Country (optional)</span>
            <input
              className="w-full rounded border px-3 py-2"
              value={value.country ?? ''}
              onChange={(e) => onChange('country', e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-semibold text-slate-700">About & documents</legend>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Company description</span>
          <textarea
            className="w-full rounded border px-3 py-2"
            rows={4}
            value={value.description}
            onChange={(e) => onChange('description', e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Documentation URL</span>
          <input
            type="url"
            className="w-full rounded border px-3 py-2"
            value={value.documentationUrl}
            onChange={(e) => onChange('documentationUrl', e.target.value)}
            required
          />
        </label>
      </fieldset>
    </div>
  );
}
