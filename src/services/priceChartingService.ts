/**
 * Temporary stub for price charting service to satisfy legacy imports.
 * Replace with real implementation when integrating PriceCharting.
 */
export type PriceChartingPoint = {
  date: string;
  price: number;
};

export async function fetchPriceChartingData(
  _cardId: string,
): Promise<PriceChartingPoint[]> {
  return [];
}

export default {
  fetchPriceChartingData,
};


