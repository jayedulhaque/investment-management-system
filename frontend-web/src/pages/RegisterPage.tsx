import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function RegisterPage() {
  const { registerInvestor, registerCompany } = useAuthStore();
  const navigate = useNavigate();
  const [role, setRole] = useState<'Investor' | 'Company'>('Investor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [documentationUrl, setDocumentationUrl] = useState('https://example.com/docs.pdf');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (role === 'Investor') await registerInvestor(email, password);
      else await registerCompany(email, password, documentationUrl);
      navigate(role === 'Investor' ? '/investor' : '/company');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
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
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 8)"
          className="w-full rounded border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {role === 'Company' && (
          <input
            type="url"
            placeholder="Documentation URL"
            className="w-full rounded border px-3 py-2"
            value={documentationUrl}
            onChange={(e) => setDocumentationUrl(e.target.value)}
            required
          />
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
