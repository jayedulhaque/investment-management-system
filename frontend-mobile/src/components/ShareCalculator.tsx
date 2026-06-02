import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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
};

export function ShareCalculator({ pricePerShare, minInvestmentThreshold, maxShares, onSubmit }: Props) {
  const [shares, setShares] = useState(1);
  const safeShares = clampShares(shares, maxShares);
  const totalPrice = useMemo(
    () => calculateTotalPrice(safeShares, pricePerShare),
    [safeShares, pricePerShare],
  );
  const canSubmit = meetsMinThreshold(totalPrice, minInvestmentThreshold) && maxShares > 0;

  return (
    <View className="rounded-lg border border-slate-200 bg-slate-50 p-4 mt-3">
      <Text className="font-semibold text-slate-800 mb-2">Share calculator</Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          className="h-9 w-9 items-center justify-center rounded bg-white border border-slate-300"
          onPress={() => setShares((s) => clampShares(s - 1, maxShares))}
        >
          <Text>−</Text>
        </Pressable>
        <Text className="text-lg font-mono">{safeShares}</Text>
        <Pressable
          className="h-9 w-9 items-center justify-center rounded bg-white border border-slate-300"
          onPress={() => setShares((s) => clampShares(s + 1, maxShares))}
        >
          <Text>+</Text>
        </Pressable>
        <Text className="text-slate-600">× {pricePerShare.toFixed(2)} BDT</Text>
      </View>
      <Text className="mt-2 text-sm">
        Total: {totalPrice.toFixed(2)} BDT (min. {minInvestmentThreshold.toFixed(2)})
      </Text>
      {!canSubmit && (
        <Text className="text-red-600 text-sm mt-1">Below minimum investment threshold.</Text>
      )}
      <Pressable
        className={`mt-3 rounded bg-indigo-600 py-3 ${canSubmit ? '' : 'opacity-50'}`}
        disabled={!canSubmit}
        onPress={() => onSubmit(safeShares, totalPrice)}
      >
        <Text className="text-center text-white font-medium">Book shares</Text>
      </Pressable>
    </View>
  );
}
