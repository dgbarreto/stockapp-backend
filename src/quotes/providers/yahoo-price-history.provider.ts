import { Injectable } from '@nestjs/common';

export interface MonthlyClose {
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

  async getMonthlyCloses(ticker: string, months: number): Promise<MonthlyClose[]> {
    const yahooTicker = `${ticker}.SA`;
    const response = await fetch(
      `${this.baseUrl}/v8/finance/chart/${yahooTicker}?range=2y&interval=1mo`,
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
    const points = result.timestamp
      .map((ts, i) => ({ date: new Date(ts * 1000), close: closes[i] }))
      .filter((p): p is MonthlyClose => p.close != null);

    return points.slice(-(months + 1));
  }
}