import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { ShareCalculator } from '../components/ShareCalculator';
import { useNotificationStore } from '../store/notificationStore';

type Campaign = {
  id: string;
  availableShares: number;
  pricePerShare: number;
  minInvestmentThreshold: number;
  totalShares: number;
};

type Booking = {
  id: string;
  campaignId: string;
  reservedShares: number;
  totalPrice: number;
  status: string;
};

export function InvestorPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fetchUnread = useNotificationStore((s) => s.fetchUnread);

  const load = async () => {
    const [c, b] = await Promise.all([
      apiFetch<Campaign[]>('/api/campaigns'),
      apiFetch<Booking[]>('/api/bookings/mine'),
    ]);
    setCampaigns(c);
    setBookings(b);
    await fetchUnread();
  };

  useEffect(() => {
    load().catch((e) => setMessage(e instanceof Error ? e.message : 'Load failed'));
  }, [fetchUnread]);

  const book = async (shares: number) => {
    if (!selected) return;
    setMessage(null);
    try {
      await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ campaignId: selected.id, reservedShares: shares }),
      });
      setSelected(null);
      setMessage('Booking created (PreBooked).');
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Booking failed');
    }
  };

  const cancel = async (id: string) => {
    await apiFetch(`/api/bookings/${id}/cancel`, { method: 'POST' });
    await load();
  };

  const resell = async (id: string) => {
    await apiFetch(`/api/bookings/${id}/resell`, { method: 'POST' });
    await load();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Investor dashboard</h1>
      {message && <p className="rounded bg-blue-50 p-2 text-sm text-blue-800">{message}</p>}

      <section>
        <h2 className="mb-3 font-semibold">Active campaigns</h2>
        <div className="grid gap-3">
          {campaigns.map((c) => (
            <button
              key={c.id}
              type="button"
              className="rounded-lg border bg-white p-4 text-left hover:border-indigo-400"
              onClick={() => setSelected(c)}
            >
              <p className="font-medium">{c.availableShares} / {c.totalShares} shares available</p>
              <p className="text-sm text-slate-600">
                {c.pricePerShare} BDT/share · min {c.minInvestmentThreshold} BDT
              </p>
            </button>
          ))}
        </div>
        {selected && (
          <div className="mt-4">
            <ShareCalculator
              pricePerShare={selected.pricePerShare}
              minInvestmentThreshold={selected.minInvestmentThreshold}
              maxShares={selected.availableShares}
              onSubmit={(shares) => book(shares)}
            />
            <button type="button" className="mt-2 text-sm text-slate-500" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">My bookings</h2>
        <ul className="space-y-2">
          {bookings.map((b) => (
            <li key={b.id} className="rounded border bg-white p-3 text-sm">
              <p>
                {b.reservedShares} shares · {b.totalPrice.toFixed(2)} BDT · <strong>{b.status}</strong>
              </p>
              <div className="mt-2 flex gap-2">
                {(b.status === 'PreBooked' || b.status === 'Contacted') && (
                  <button type="button" className="text-red-600" onClick={() => cancel(b.id)}>
                    Cancel / free
                  </button>
                )}
                {b.status === 'Confirmed' && (
                  <button type="button" className="text-amber-700" onClick={() => resell(b.id)}>
                    Return shares (resell)
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
