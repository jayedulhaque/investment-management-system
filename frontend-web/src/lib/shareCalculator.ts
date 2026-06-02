export function calculateTotalPrice(shares: number, pricePerShare: number): number {
  return shares * pricePerShare;
}

export function meetsMinThreshold(totalPrice: number, minInvestmentThreshold: number): boolean {
  return totalPrice >= minInvestmentThreshold;
}

export function clampShares(shares: number, maxShares: number): number {
  return Math.max(1, Math.min(shares, maxShares));
}
