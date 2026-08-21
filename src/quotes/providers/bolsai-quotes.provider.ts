import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisCacheService } from '../../cache/redis-cache.service';

const FUNDAMENTALS_TTL_SECONDS = 6 * 60 * 60; // 6h

export interface BolsaiFundamentals {
  ticker: string;
  close_price: number;
  market_cap: number;
  pl: number | null;
  pvp: number | null;
  ev_ebitda: number | null;
  roe: number | null;
  roic: number | null;
  net_margin: number | null;
  gross_margin: number | null;
  net_debt_ebitda: number | null;
  lpa: number | null;
  vpa: number | null;
  ebitda: number | null;
  p_sr: number | null;
  cagr_earnings_5y: number | null;
}

@Injectable()
export class BolsaiQuotesProvider {
  private readonly baseUrl: string = 'https://api.usebolsai.com';
  constructor(private readonly cache: RedisCacheService) {}

  async getFundamentals(ticker: string): Promise<BolsaiFundamentals> {
    const cacheKey = `bolsai:fundamentals:${ticker}`;
    const cached = await this.cache.get<BolsaiFundamentals>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await fetch(
      `${this.baseUrl}/api/v1/fundamentals/${ticker}`,
      {
        headers: { 'X-API-KEY': process.env.BOLSAI_API_KEY ?? '' },
      },
    );

    if (response.status === 404) {
      throw new HttpException(
        `Ticker ${ticker} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!response.ok) {
      console.log(response.statusText);
      throw new HttpException(
        `Error fetching fundamentals for ticker ${ticker}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const data = (await response.json()) as BolsaiFundamentals;
    await this.cache.set(cacheKey, data, FUNDAMENTALS_TTL_SECONDS);
    return data;
  }
}
