import { Injectable } from '@nestjs/common';
import {
  DividendEvent,
  DividendMetrics,
  DividendsProvider,
} from './dividends.provider';

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

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

@Injectable()
export class YahooDividendsProvider implements DividendsProvider {
  private readonly baseUrl = 'https://query1.finance.yahoo.com';

  private async fetchEvents(ticker: string): Promise<YahooDividendEvent[]> {
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
    return dividends ? Object.values(dividends) : [];
  }

  async getDividendMetrics(ticker: string): Promise<DividendMetrics> {
    const events = await this.fetchEvents(ticker);

    if (events.length === 0) {
      return { dividendPerShareTtm: 0, distributionGrowthRate: null };
    }

    const nowSeconds = Date.now() / 1000;
    const dividendPerShareTtm = sumInWindow(
      events,
      nowSeconds - ONE_YEAR_SECONDS,
      nowSeconds,
    );

    // Janela curta de propósito (1 ano vs. ano anterior, não os 5 anos que
    // "earningsCagr5y" sugere): o histórico de dividendo do Yahoo pra
    // tickers B3 tem buracos de anos em tickers mais antigos — ver nota
    // original desse arquivo em docs/decisoes.md.
    const previousYearSum = sumInWindow(
      events,
      nowSeconds - 2 * ONE_YEAR_SECONDS,
      nowSeconds - ONE_YEAR_SECONDS,
    );

    const distributionGrowthRate =
      previousYearSum > 0
        ? (dividendPerShareTtm / previousYearSum - 1) * 100
        : null;

    return { dividendPerShareTtm, distributionGrowthRate };
  }

  async getDividendEventsInRange(
    ticker: string,
    fromSeconds: number,
    toSeconds: number,
  ): Promise<DividendEvent[]> {
    const events = await this.fetchEvents(ticker);
    return events.filter((e) => e.date >= fromSeconds && e.date < toSeconds);
  }
}

function sumInWindow(
  events: YahooDividendEvent[],
  fromSeconds: number,
  toSeconds: number,
): number {
  return events
    .filter((event) => event.date >= fromSeconds && event.date < toSeconds)
    .reduce((sum, event) => sum + event.amount, 0);
}
