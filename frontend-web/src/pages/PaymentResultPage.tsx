import { Link, useSearchParams } from 'react-router-dom';

export function PaymentSuccessPage() {
  const [params] = useSearchParams();
  return (
    <div className="rounded-lg bg-white p-6 text-center shadow">
      <h1 className="text-xl font-bold text-green-700">Payment successful</h1>
      <p className="mt-2 text-sm text-slate-600">Transaction: {params.get('transactionId') ?? '—'}</p>
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
