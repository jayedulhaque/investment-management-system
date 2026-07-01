import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
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
    setShareInput(String(clampShares(value, maxShares)));
  };

  return (
    <View className="rounded-lg border border-slate-200 bg-slate-50 p-4 mt-3">
      <Text className="font-semibold text-slate-800 mb-2">Share calculator</Text>
      <View className="flex-row flex-wrap items-end gap-3">
        <Pressable
          className="h-9 w-9 items-center justify-center rounded bg-white border border-slate-300"
          onPress={() => setShares(safeShares - 1)}
          disabled={safeShares <= 1}
        >
          <Text>−</Text>
        </Pressable>
        <View>
          <Text className="mb-1 text-xs text-slate-600">Shares</Text>
          <TextInput
            className="w-24 rounded border border-slate-300 bg-white px-2 py-1.5 text-center text-lg font-mono"
            value={shareInput}
            onChangeText={(value) => setShareInput(value.replace(/\D/g, ''))}
            onBlur={() => setShareInput(String(safeShares))}
            keyboardType="number-pad"
            accessibilityLabel="Number of shares to book"
          />
        </View>
        <Pressable
          className="h-9 w-9 items-center justify-center rounded bg-white border border-slate-300"
          onPress={() => setShares(safeShares + 1)}
          disabled={safeShares >= maxShares}
        >
          <Text>+</Text>
        </Pressable>
        <Text className="text-slate-600 pb-1">× {pricePerShare.toFixed(2)} BDT</Text>
      </View>
      <Text className="mt-1 text-xs text-slate-500">Max available: {maxShares} shares</Text>
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
