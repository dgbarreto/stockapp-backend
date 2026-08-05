export interface DividendsProvider {
  getDividendPerShareTtm(ticker: string): Promise<number>;
}

export const DIVIDENDS_PROVIDER = Symbol('DIVIDENDS_PROVIDER');