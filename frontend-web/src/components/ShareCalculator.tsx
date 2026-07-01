import { useEffect, useMemo, useState } from 'react';
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
  const [shareInput, setShareInput] = useState('1');

  useEffect(() => {
    setShareInput('1');
  }, [maxShares, pricePerShare, minInvestmentThreshold]);

  const parsed = parseInt(shareInput, 10);
  const safeShares = clampShares(Number.isNaN(parsed) ? 1 : parsed, maxShares);
  const totalPrice = useMemo(
    () => calculateTotalPrice(safeShares, pricePerShare),
    [safeShares, pricePerShare],
  );
  const canSubmit = meetsMinThreshold(totalPrice, minInvestmentThreshold) && maxShares > 0;

  const setShares = (value: number) => {
    const clamped = clampShares(value, maxShares);
    setShareInput(String(clamped));
  };

  const handleInputChange = (value: string) => {
    setShareInput(value.replace(/\D/g, ''));
  };

  const handleInputBlur = () => {
    setShareInput(String(safeShares));
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-3 font-semibold text-slate-800">Share calculator</h3>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="h-9 w-9 rounded bg-white border border-slate-300 text-lg"
          onClick={() => setShares(safeShares - 1)}
          disabled={safeShares <= 1}
        >
          −
        </button>
        <label className="flex flex-col text-sm text-slate-600">
          <span className="mb-1 text-xs">Shares</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={shareInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleInputBlur}
            className="w-24 rounded border border-slate-300 bg-white px-2 py-1.5 text-center font-mono text-lg"
            aria-label="Number of shares to book"
          />
        </label>
        <button
          type="button"
          className="h-9 w-9 rounded bg-white border border-slate-300 text-lg"
          onClick={() => setShares(safeShares + 1)}
          disabled={safeShares >= maxShares}
        >
          +
        </button>
        <span className="text-sm text-slate-600">× {pricePerShare.toFixed(2)} BDT</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">Max available: {maxShares} shares</p>
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
