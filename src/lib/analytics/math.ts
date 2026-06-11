export function computeChangePercent(
  current: number,
  previous: number,
): number | null {
  if (current === 0 && previous === 0) {
    return null;
  }

  if (previous === 0) {
    return current > 0 ? 100 : null;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export function safeAverage(total: number, count: number): number {
  if (count <= 0) {
    return 0;
  }

  return total / count;
}

export function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return numerator / denominator;
}
