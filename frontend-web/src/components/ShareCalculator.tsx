import { useMemo, useState } from 'react';
import {
  calculateTotalPrice,
  clampShares,
  meetsMinThreshold,
} from '../lib/shareCalculator';

type Props = {
  pricePerShare: number;
  minInvestmentThreshold: number;
  maxShares: number;
  onSubmit: (shares: number, totalPrice: number) => void;
  submitLabel?: string;
};

export function ShareCalculator({
  pricePerShare,
  minInvestmentThreshold,
  maxShares,
  onSubmit,
  submitLabel = 'Book shares',
}: Props) {
  const [shares, setShares] = useState(1);

  const safeShares = clampShares(shares, maxShares);
  const totalPrice = useMemo(
    () => calculateTotalPrice(safeShares, pricePerShare),
    [safeShares, pricePerShare],
  );
  const canSubmit = meetsMinThreshold(totalPrice, minInvestmentThreshold) && maxShares > 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-3 font-semibold text-slate-800">Share calculator</h3>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="h-9 w-9 rounded bg-white border border-slate-300 text-lg"
          onClick={() => setShares((s) => clampShares(s - 1, maxShares))}
          disabled={safeShares <= 1}
        >
          −
        </button>
        <span className="min-w-[3rem] text-center font-mono text-lg">{safeShares}</span>
        <button
          type="button"
          className="h-9 w-9 rounded bg-white border border-slate-300 text-lg"
          onClick={() => setShares((s) => clampShares(s + 1, maxShares))}
          disabled={safeShares >= maxShares}
        >
          +
        </button>
        <span className="text-sm text-slate-600">× {pricePerShare.toFixed(2)} BDT</span>
      </div>
      <p className="mt-3 text-sm">
        Total: <strong>{totalPrice.toFixed(2)} BDT</strong>
        <span className="text-slate-500"> (min. {minInvestmentThreshold.toFixed(2)} BDT)</span>
      </p>
      {!canSubmit && (
        <p className="mt-1 text-sm text-red-600">
          Total is below the minimum investment threshold.
        </p>
      )}
      <button
        type="button"
        className="mt-4 w-full rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
        disabled={!canSubmit}
        onClick={() => onSubmit(safeShares, totalPrice)}
      >
        {submitLabel}
      </button>
    </div>
  );
}
