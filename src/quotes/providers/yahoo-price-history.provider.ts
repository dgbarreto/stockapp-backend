import { Injectable } from '@nestjs/common';

export interface PriceClose {
  date: Date;
  close: number;
}

interface YahooChartResponse {
  chart: {
    result: Array<{
      timestamp: number[];
      indicators: { quote: Array<{ close: (number | null)[] }> };
    }> | null;
    error: unknown;
  };
}

@Injectable()
export class YahooPriceHistoryProvider {
  private readonly baseUrl = 'https://query1.finance.yahoo.com';

  async getMonthlyCloses(ticker: string, months: number): Promise<PriceClose[]> {
    const points = await this.fetchCloses(ticker, '2y', '1mo');
    return points.slice(-(months + 1));
  }

  async getDailyCloses(ticker: string, days: number): Promise<PriceClose[]> {
    const points = await this.fetchCloses(ticker, '3mo', '1d');
    return points.slice(-days);
  }

  private async fetchCloses(
    ticker: string,
    range: string,
    interval: string,
  ): Promise<PriceClose[]> {
    const yahooTicker = `${ticker}.SA`;
    const response = await fetch(
      `${this.baseUrl}/v8/finance/chart/${yahooTicker}?range=${range}&interval=${interval}`,
    );

    if (!response.ok) {
      throw new Error(
        `Error fetching price history for ${ticker}: ${response.statusText}`,
      );
    }

    const data = (await response.json()) as YahooChartResponse;
    const result = data.chart.result?.[0];
    if (!result) return [];

    const closes = result.indicators.quote[0]?.close ?? [];
    return result.timestamp
      .map((ts, i) => ({ date: new Date(ts * 1000), close: closes[i] }))
      .filter((p): p is PriceClose => p.close != null);
  }
}
