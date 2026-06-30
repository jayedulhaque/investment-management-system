import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { emptyCompanyRegistration } from '../types/company';
import { emptyInvestorRegistration } from '../types/investor';

export function RegisterPage() {
  const { registerInvestor, registerCompany } = useAuthStore();
  const navigate = useNavigate();
  const [role, setRole] = useState<'Investor' | 'Company'>('Investor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState(emptyCompanyRegistration);
  const [investor, setInvestor] = useState(emptyInvestorRegistration);
  const [error, setError] = useState<string | null>(null);

  const updateCompany = (field: keyof ReturnType<typeof emptyCompanyRegistration>, value: string) => {
    setCompany((prev) => ({ ...prev, [field]: value }));
  };

  const updateInvestor = (field: keyof ReturnType<typeof emptyInvestorRegistration>, value: string) => {
    setInvestor((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (role === 'Investor') {
        await registerInvestor(email, password, investor);
        navigate('/investor');
        return;
      }
      const result = await registerCompany(email, password, company);
      navigate('/login', { state: { message: result.message } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-xl font-bold">Register</h1>
      <div className="mb-4 flex gap-2">
        {(['Investor', 'Company'] as const).map((r) => (
          <button
            key={r}
            type="button"
            className={`flex-1 rounded py-2 text-sm ${role === r ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}
            onClick={() => setRole(r)}
          >
            {r}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <fieldset className="space-y-3">
          <legend className="mb-1 text-sm font-semibold text-slate-700">Account</legend>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Login email</span>
            <input
              type="email"
              className="w-full rounded border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Password</span>
            <input
              type="password"
              className="w-full rounded border px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <span className="mt-1 block text-xs text-slate-500">Minimum 8 characters</span>
          </label>
        </fieldset>

        {role === 'Investor' && (
          <>
            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm font-semibold text-slate-700">Personal identity</legend>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Full name</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={investor.fullName}
                  onChange={(e) => updateInvestor('fullName', e.target.value)}
                  required
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">National ID (NID)</span>
                  <input
                    className="w-full rounded border px-3 py-2"
                    value={investor.nationalId}
                    onChange={(e) => updateInvestor('nationalId', e.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Date of birth (optional)</span>
                  <input
                    type="date"
                    className="w-full rounded border px-3 py-2"
                    value={investor.dateOfBirth ?? ''}
                    onChange={(e) => updateInvestor('dateOfBirth', e.target.value)}
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Occupation (optional)</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={investor.occupation}
                  onChange={(e) => updateInvestor('occupation', e.target.value)}
                  placeholder="e.g. Software engineer, Business owner"
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
                    value={investor.phone}
                    onChange={(e) => updateInvestor('phone', e.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Contact email (optional)</span>
                  <input
                    type="email"
                    className="w-full rounded border px-3 py-2"
                    value={investor.contactEmail}
                    onChange={(e) => updateInvestor('contactEmail', e.target.value)}
                  />
                  <span className="mt-1 block text-xs text-slate-500">If different from login email</span>
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Address</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={investor.address}
                  onChange={(e) => updateInvestor('address', e.target.value)}
                  required
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">City</span>
                  <input
                    className="w-full rounded border px-3 py-2"
                    value={investor.city}
                    onChange={(e) => updateInvestor('city', e.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Country</span>
                  <input
                    className="w-full rounded border px-3 py-2"
                    value={investor.country}
                    onChange={(e) => updateInvestor('country', e.target.value)}
                    required
                  />
                </label>
              </div>
            </fieldset>
          </>
        )}

        {role === 'Company' && (
          <>
            <fieldset className="space-y-3">
              <legend className="mb-1 text-sm font-semibold text-slate-700">Company identity</legend>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Company name</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={company.companyName}
                  onChange={(e) => updateCompany('companyName', e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Legal name (optional)</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={company.legalName}
                  onChange={(e) => updateCompany('legalName', e.target.value)}
                />
                <span className="mt-1 block text-xs text-slate-500">Registered entity name if different from trade name</span>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Registration number (optional)</span>
                  <input
                    className="w-full rounded border px-3 py-2"
                    value={company.registrationNumber}
                    onChange={(e) => updateCompany('registrationNumber', e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Industry (optional)</span>
                  <input
                    className="w-full rounded border px-3 py-2"
                    value={company.industry}
                    onChange={(e) => updateCompany('industry', e.target.value)}
                    placeholder="e.g. FinTech, Manufacturing"
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
                    value={company.phone}
                    onChange={(e) => updateCompany('phone', e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Contact email (optional)</span>
                  <input
                    type="email"
                    className="w-full rounded border px-3 py-2"
                    value={company.contactEmail}
                    onChange={(e) => updateCompany('contactEmail', e.target.value)}
                  />
                  <span className="mt-1 block text-xs text-slate-500">Public contact if different from login email</span>
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Website (optional)</span>
                <input
                  type="url"
                  className="w-full rounded border px-3 py-2"
                  value={company.website}
                  onChange={(e) => updateCompany('website', e.target.value)}
                  placeholder="https://example.com"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Address (optional)</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={company.address}
                  onChange={(e) => updateCompany('address', e.target.value)}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">City (optional)</span>
                  <input
                    className="w-full rounded border px-3 py-2"
                    value={company.city}
                    onChange={(e) => updateCompany('city', e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Country (optional)</span>
                  <input
                    className="w-full rounded border px-3 py-2"
                    value={company.country}
                    onChange={(e) => updateCompany('country', e.target.value)}
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
                  value={company.description}
                  onChange={(e) => updateCompany('description', e.target.value)}
                  required
                />
                <span className="mt-1 block text-xs text-slate-500">What the company does and why investors should care</span>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Documentation URL</span>
                <input
                  type="url"
                  className="w-full rounded border px-3 py-2"
                  value={company.documentationUrl}
                  onChange={(e) => updateCompany('documentationUrl', e.target.value)}
                  placeholder="https://example.com/company-docs.pdf"
                  required
                />
                <span className="mt-1 block text-xs text-slate-500">Link to incorporation papers, financials, or pitch deck for admin review</span>
              </label>
            </fieldset>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full rounded bg-indigo-600 py-2 text-white">
          Register
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-indigo-600">
          Already have an account?
        </Link>
      </p>
    </div>
  );
}
