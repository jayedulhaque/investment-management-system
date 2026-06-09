import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { PaymentPanel } from '../components/PaymentPanel';

type Campaign = {
  id: string;
  paymentStatus: string;
  isActive: boolean;
  totalShares: number;
  availableShares: number;
};

type Booking = {
  id: string;
  reservedShares: number;
  totalPrice: number;
  status: string;
};

export function CompanyPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingCampaign, setPendingCampaign] = useState<{
    id: string;
    payment: { transactionId: string; redirectUrl: string };
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ totalShares: 100, pricePerShare: 50, minInvestmentThreshold: 500 });

  const loadBookings = () =>
    apiFetch<Booking[]>('/api/bookings/company').then(setBookings);

  useEffect(() => {
    loadBookings().catch(() => undefined);
  }, []);

  const createCampaign = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await apiFetch<{
        campaign: Campaign;
        payment: { transactionId: string; redirectUrl: string };
      }>('/api/campaigns', { method: 'POST', body: JSON.stringify(form) });
      setPendingCampaign({ id: res.campaign.id, payment: res.payment });
      setMessage('Campaign created. Complete 500 BDT payment to activate.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    }
  };

  const confirmPayment = async (transactionId: string) => {
    if (!pendingCampaign) return;
    await apiFetch(`/api/campaigns/${pendingCampaign.id}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    });
    setPendingCampaign(null);
    setMessage('Campaign is now active.');
  };

  const updateStatus = async (bookingId: string, status: string) => {
    await apiFetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await loadBookings();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Company dashboard</h1>
      {message && <p className="rounded bg-blue-50 p-2 text-sm">{message}</p>}

      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-1 font-semibold">Create campaign</h2>
        <p className="mb-4 text-sm text-slate-600">
          A one-time <strong>500 BDT listing fee</strong> is charged when you submit (separate from the fields below).
        </p>
        <form onSubmit={createCampaign} className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Total shares</span>
            <input
              type="number"
              min={1}
              className="w-full rounded border px-2 py-1.5"
              value={form.totalShares}
              onChange={(e) => setForm({ ...form, totalShares: +e.target.value })}
            />
            <span className="mt-1 block text-xs text-slate-500">How many shares you are offering</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Price per share (BDT)</span>
            <input
              type="number"
              min={1}
              step={0.01}
              className="w-full rounded border px-2 py-1.5"
              value={form.pricePerShare}
              onChange={(e) => setForm({ ...form, pricePerShare: +e.target.value })}
            />
            <span className="mt-1 block text-xs text-slate-500">Cost of one share</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Minimum investment (BDT)</span>
            <input
              type="number"
              min={1}
              step={0.01}
              className="w-full rounded border px-2 py-1.5"
              value={form.minInvestmentThreshold}
              onChange={(e) => setForm({ ...form, minInvestmentThreshold: +e.target.value })}
            />
            <span className="mt-1 block text-xs text-slate-500">
              Smallest order investors can place (shares × price)
            </span>
          </label>
          <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-white sm:col-span-3">
            Create & pay listing fee
          </button>
        </form>
        {pendingCampaign && (
          <div className="mt-4">
            <PaymentPanel
              amount={500}
              description="Campaign listing fee"
              referenceKey={`campaign:${pendingCampaign.id}`}
              initialPayment={pendingCampaign.payment}
              onPaymentVerified={confirmPayment}
            />
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Bookings on your campaigns</h2>
        <ul className="space-y-2">
          {bookings.map((b) => (
            <li key={b.id} className="rounded border bg-white p-3 text-sm">
              <p>
                {b.reservedShares} shares · {b.totalPrice.toFixed(2)} BDT · <strong>{b.status}</strong>
              </p>
              <div className="mt-2 flex gap-2">
                {b.status === 'PreBooked' && (
                  <button type="button" onClick={() => updateStatus(b.id, 'Contacted')}>
                    Mark contacted
                  </button>
                )}
                {b.status === 'Contacted' && (
                  <button type="button" onClick={() => updateStatus(b.id, 'Confirmed')}>
                    Confirm
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
