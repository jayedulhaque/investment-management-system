import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type PendingCompany = {
  companyProfileId: string;
  email: string;
  documentationUrl: string;
};

export function AdminPage() {
  const [pending, setPending] = useState<PendingCompany[]>([]);
  const [profile, setProfile] = useState({ email: '', password: '', bKashNumber: '01700000000' });
  const [message, setMessage] = useState<string | null>(null);

  const load = () =>
    apiFetch<PendingCompany[]>('/api/admin/companies/pending').then(setPending);

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const approve = async (id: string, approveCompany: boolean) => {
    await apiFetch(`/api/admin/companies/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approve: approveCompany }),
    });
    await load();
    setMessage(approveCompany ? 'Company approved.' : 'Company rejected.');
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const body: Record<string, string> = {
      email: profile.email,
      bKashNumber: profile.bKashNumber,
    };
    if (profile.password) body.password = profile.password;
    await apiFetch('/api/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    setMessage('Admin profile updated.');
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      {message && <p className="rounded bg-green-50 p-2 text-sm">{message}</p>}

      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-3 font-semibold">System profile</h2>
        <form onSubmit={saveProfile} className="space-y-2 max-w-md">
          <input
            className="w-full rounded border px-2 py-1"
            placeholder="Email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
          <input
            className="w-full rounded border px-2 py-1"
            placeholder="New password (optional)"
            type="password"
            value={profile.password}
            onChange={(e) => setProfile({ ...profile, password: e.target.value })}
          />
          <input
            className="w-full rounded border px-2 py-1"
            placeholder="bKash receiving number"
            value={profile.bKashNumber}
            onChange={(e) => setProfile({ ...profile, bKashNumber: e.target.value })}
          />
          <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-white">
            Save
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Pending companies</h2>
        <ul className="space-y-2">
          {pending.map((c) => (
            <li key={c.companyProfileId} className="rounded border bg-white p-3 text-sm">
              <p>{c.email}</p>
              <a href={c.documentationUrl} className="text-indigo-600 text-xs" target="_blank" rel="noreferrer">
                Docs
              </a>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => approve(c.companyProfileId, true)}>
                  Approve
                </button>
                <button type="button" className="text-red-600" onClick={() => approve(c.companyProfileId, false)}>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
