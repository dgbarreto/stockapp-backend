import { Injectable } from '@nestjs/common';
import { DividendsProvider } from './dividends.provider';

interface YahooDividendEvent {
  amount: number;
  date: number;
}

interface YahooChartResponse {
  chart: {
    result: Array<{
      events?: {
        dividends?: Record<string, YahooDividendEvent>;
      };
    }> | null;
    error: unknown;
  };
}

@Injectable()
export class YahooDividendsProvider implements DividendsProvider {
  private readonly baseUrl = 'https://query1.finance.yahoo.com';

  async getDividendPerShareTtm(ticker: string): Promise<number> {
    const yahooTicker = `${ticker}.SA`;
    const response = await fetch(
      `${this.baseUrl}/v8/finance/chart/${yahooTicker}?range=2y&interval=1mo&events=div`,
    );

    if (!response.ok) {
      throw new Error(
        `Error fetching dividends for ${ticker}: ${response.statusText}`,
      );
    }

    const data = (await response.json()) as YahooChartResponse;
    const dividends = data.chart.result?.[0]?.events?.dividends;

    if (!dividends) {
      return 0; // ticker existe mas sem provento no período — 0 é resposta válida, diferente de erro
    }

    const oneYearAgoSeconds = Date.now() / 1000 - 365 * 24 * 60 * 60;

    return Object.values(dividends)
      .filter((event) => event.date >= oneYearAgoSeconds)
      .reduce((sum, event) => sum + event.amount, 0);
  }
}