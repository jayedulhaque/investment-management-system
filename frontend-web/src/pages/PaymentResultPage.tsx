import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

type ActivationState = 'idle' | 'activating' | 'done' | 'skipped' | 'error';

function useCampaignActivation(params: URLSearchParams) {
  const [state, setState] = useState<ActivationState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const transactionId = params.get('transactionId');
    const referenceKey = params.get('referenceKey');
    const success = params.get('success');

    if (success !== 'true' || !transactionId) {
      setState('skipped');
      return;
    }

    if (!referenceKey?.startsWith('campaign:')) {
      setState('skipped');
      return;
    }

    const campaignId = referenceKey.slice('campaign:'.length);
    setState('activating');

    apiFetch(`/api/campaigns/${campaignId}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({ transactionId }),
    })
      .then(() => setState('done'))
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to activate campaign');
        setState('error');
      });
  }, [params]);

  return { state, error };
}

export function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const { state, error } = useCampaignActivation(params);
  const transactionId = params.get('transactionId');

  return (
    <div className="rounded-lg bg-white p-6 text-center shadow">
      <h1 className="text-xl font-bold text-green-700">Payment successful</h1>
      <p className="mt-2 text-sm text-slate-600">Transaction: {transactionId ?? '—'}</p>
      {state === 'activating' && (
        <p className="mt-2 text-sm text-slate-600">Activating your campaign…</p>
      )}
      {state === 'done' && (
        <p className="mt-2 text-sm text-green-700">Campaign is now active.</p>
      )}
      {state === 'error' && (
        <p className="mt-2 text-sm text-red-600">
          Payment succeeded but campaign activation failed: {error}. Open the company dashboard and tap
          &quot;Activate campaign&quot;.
        </p>
      )}
      <Link to="/company" className="mt-4 inline-block text-indigo-600">
        Back to company dashboard
      </Link>
    </div>
  );
}

export function PaymentFailurePage() {
  return (
    <div className="rounded-lg bg-white p-6 text-center shadow">
      <h1 className="text-xl font-bold text-red-700">Payment failed</h1>
      <Link to="/company" className="mt-4 inline-block text-indigo-600">
        Try again
      </Link>
    </div>
  );
}
