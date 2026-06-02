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
        <h2 className="mb-3 font-semibold">Create campaign (500 BDT fee)</h2>
        <form onSubmit={createCampaign} className="grid gap-2 sm:grid-cols-3">
          <input
            type="number"
            placeholder="Total shares"
            className="rounded border px-2 py-1"
            value={form.totalShares}
            onChange={(e) => setForm({ ...form, totalShares: +e.target.value })}
          />
          <input
            type="number"
            placeholder="Price/share"
            className="rounded border px-2 py-1"
            value={form.pricePerShare}
            onChange={(e) => setForm({ ...form, pricePerShare: +e.target.value })}
          />
          <input
            type="number"
            placeholder="Min investment"
            className="rounded border px-2 py-1"
            value={form.minInvestmentThreshold}
            onChange={(e) => setForm({ ...form, minInvestmentThreshold: +e.target.value })}
          />
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
