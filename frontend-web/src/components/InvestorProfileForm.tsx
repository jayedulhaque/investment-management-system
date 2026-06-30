import type { InvestorRegistrationInfo } from '../types/investor';

type Props = {
  value: InvestorRegistrationInfo;
  onChange: (field: keyof InvestorRegistrationInfo, value: string) => void;
  loginEmail?: string;
};

export function InvestorProfileForm({ value, onChange, loginEmail }: Props) {
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
        <legend className="mb-1 text-sm font-semibold text-slate-700">Personal identity</legend>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Full name</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={value.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">National ID (NID)</span>
            <input
              className="w-full rounded border px-3 py-2"
              value={value.nationalId}
              onChange={(e) => onChange('nationalId', e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Date of birth (optional)</span>
            <input
              type="date"
              className="w-full rounded border px-3 py-2"
              value={value.dateOfBirth ?? ''}
              onChange={(e) => onChange('dateOfBirth', e.target.value)}
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Occupation (optional)</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={value.occupation ?? ''}
            onChange={(e) => onChange('occupation', e.target.value)}
          />
        </label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-semibold text-slate-700">Contact & location</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Phone</span>
            <input
              type="tel"
              className="w-full rounded border px-3 py-2"
              value={value.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              required
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
          <span className="mb-1 block font-medium text-slate-700">Address</span>
          <input
            className="w-full rounded border px-3 py-2"
            value={value.address}
            onChange={(e) => onChange('address', e.target.value)}
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">City</span>
            <input
              className="w-full rounded border px-3 py-2"
              value={value.city}
              onChange={(e) => onChange('city', e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Country</span>
            <input
              className="w-full rounded border px-3 py-2"
              value={value.country}
              onChange={(e) => onChange('country', e.target.value)}
              required
            />
          </label>
        </div>
      </fieldset>
    </div>
  );
}
