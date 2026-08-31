export interface DividendEvent {
  amount: number;
  date: number; // unix seconds
}

export interface DividendMetrics {
  dividendPerShareTtm: number;
  distributionGrowthRate: number | null;
}

export interface DividendsProvider {
  getDividendMetrics(ticker: string): Promise<DividendMetrics>;
  getDividendEventsInRange(
    ticker: string,
    fromSeconds: number,
    toSeconds: number,
  ): Promise<DividendEvent[]>;
}

export const DIVIDENDS_PROVIDER = Symbol('DIVIDENDS_PROVIDER');
