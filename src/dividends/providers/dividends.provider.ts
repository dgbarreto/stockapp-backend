export interface DividendMetrics {
  dividendPerShareTtm: number;
  distributionGrowthRate: number | null;
}

export interface DividendsProvider {
  getDividendMetrics(ticker: string): Promise<DividendMetrics>;
}

export const DIVIDENDS_PROVIDER = Symbol('DIVIDENDS_PROVIDER');