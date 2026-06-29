import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { PaymentPanel } from '../components/PaymentPanel';

type Campaign = {
  id: string;
  paymentStatus: string;
  isActive: boolean;
  equityPercentageOffered: number;
  totalShares: number;
  availableShares: number;
  pricePerShare: number;
  minInvestmentThreshold: number;
};

function equityPerShare(campaign: Pick<Campaign, 'equityPercentageOffered' | 'totalShares'>) {
  return campaign.totalShares > 0 ? campaign.equityPercentageOffered / campaign.totalShares : 0;
}

function campaignStakeSummary(campaign: Pick<Campaign, 'equityPercentageOffered' | 'totalShares' | 'pricePerShare'>) {
  const perShare = equityPerShare(campaign);
  return `Offering ${campaign.totalShares} shares = ${campaign.equityPercentageOffered}% of the company (${perShare.toFixed(4)}% company ownership per share)`;
}

type Booking = {
  id: string;
  reservedShares: number;
  totalPrice: number;
  status: string;
};

export function CompanyPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingCampaign, setPendingCampaign] = useState<{
    id: string;
    payment: { transactionId: string; redirectUrl: string };
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    equityPercentageOffered: 50,
    totalShares: 500,
    pricePerShare: 50,
    minInvestmentThreshold: 500,
  });

  const formPreview = campaignStakeSummary(form);
  const formEquityPerShare = equityPerShare(form);

  const loadCampaigns = () =>
    apiFetch<Campaign[]>('/api/campaigns/company').then(setCampaigns);

  const loadBookings = () =>
    apiFetch<Booking[]>('/api/bookings/company').then(setBookings);

  const load = () => Promise.all([loadCampaigns(), loadBookings()]);

  useEffect(() => {
    load().catch(() => undefined);
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
      await loadCampaigns();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed');
    }
  };

  const confirmPayment = async (campaignId: string, transactionId: string) => {
    await apiFetch(`/api/campaigns/${campaignId}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    });
    setPendingCampaign((current) => (current?.id === campaignId ? null : current));
    setMessage('Campaign is now active.');
    await load();
  };

  const updateStatus = async (bookingId: string, status: string) => {
    await apiFetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await loadBookings();
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
    setMessage(null);
    try {
      await apiFetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' });
      setPendingCampaign((current) => (current?.id === campaignId ? null : current));
      setMessage('Campaign deleted.');
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to delete campaign');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Company dashboard</h1>
      {message && <p className="rounded bg-blue-50 p-2 text-sm">{message}</p>}

      <section className="rounded-lg bg-white p-4 shadow">
        {campaigns.length === 0 ? (
          <>
            <h2 className="mb-1 font-semibold">Create campaign</h2>
            <p className="mb-4 text-sm text-slate-600">
              Each company can have <strong>one campaign</strong>. First decide what{' '}
              <strong>percentage of your company</strong> you are selling, then how many{' '}
              <strong>share units</strong> represent that stake. Example: selling{' '}
              <strong>50% of the company</strong> split into <strong>500 shares</strong> means each
              share equals <strong>0.1%</strong> company ownership.
            </p>
            <form onSubmit={createCampaign} className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Company stake offered (%)</span>
                <input
                  type="number"
                  min={0.01}
                  max={100}
                  step={0.01}
                  className="w-full rounded border px-2 py-1.5"
                  value={form.equityPercentageOffered}
                  onChange={(e) => setForm({ ...form, equityPercentageOffered: +e.target.value })}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Percentage of company ownership you are opening to investors (e.g. 50 = half the company)
                </span>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Shares offered (units)</span>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded border px-2 py-1.5"
                  value={form.totalShares}
                  onChange={(e) => setForm({ ...form, totalShares: +e.target.value })}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Number of share units that together represent the stake above (e.g. 500 shares for 50%)
                </span>
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
                <span className="mt-1 block text-xs text-slate-500">Investor price for one share unit</span>
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
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-900 sm:col-span-2">
                <p className="font-medium">Campaign preview</p>
                <p className="mt-1">{formPreview}</p>
                <p className="mt-1 text-indigo-800">
                  Each share = {formEquityPerShare.toFixed(4)}% company · Total raise if fully sold:{' '}
                  {(form.totalShares * form.pricePerShare).toLocaleString()} BDT
                </p>
              </div>
              <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-white sm:col-span-2">
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
                  onPaymentVerified={(transactionId) => confirmPayment(pendingCampaign.id, transactionId)}
                />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-600">
            Your company already has a campaign. Delete it below to create a new one.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">My campaign</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-slate-600">No campaign yet. Create one above.</p>
        ) : (
          <ul className="space-y-2">
            {campaigns.map((c) => (
              <li key={c.id} className="rounded border bg-white p-3 text-sm">
                <p className="font-medium text-indigo-900">{campaignStakeSummary(c)}</p>
                <p className="mt-1">
                  {c.availableShares} / {c.totalShares} share units available
                </p>
                <p className="text-slate-600">
                  {c.pricePerShare} BDT/share · min {c.minInvestmentThreshold} BDT ·{' '}
                  {equityPerShare(c).toFixed(4)}% company per share
                </p>
                <p className="mt-1">
                  Payment: <strong>{c.paymentStatus}</strong>
                  {c.isActive ? (
                    <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Active</span>
                  ) : (
                    <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      Awaiting listing fee
                    </span>
                  )}
                </p>
                {!c.isActive && c.paymentStatus === 'Pending' && (
                  <div className="mt-3">
                    <PaymentPanel
                      amount={500}
                      description="Campaign listing fee"
                      referenceKey={`campaign:${c.id}`}
                      onPaymentVerified={(transactionId) => confirmPayment(c.id, transactionId)}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => deleteCampaign(c.id)}
                  className="mt-3 text-sm text-red-600 hover:text-red-800"
                >
                  Delete campaign
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Bookings on your campaign</h2>
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
