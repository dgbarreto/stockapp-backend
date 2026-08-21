import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisCacheService } from '../../cache/redis-cache.service';

const FII_TTL_SECONDS = 6 * 60 * 60; // 6h

export interface BolsaiFii {
  ticker: string;
  name: string;
  segment: string | null;
  management_type: string | null;
  close_price: number;
  book_value_per_share: number | null;
  pvp: number | null;
  dividend_yield_ttm: number | null;
  net_asset_value: number | null;
  shares_outstanding: number | null;
  total_shareholders: number | null;
}

@Injectable()
export class BolsaiFiisProvider {
  private readonly baseUrl: string = 'https://api.usebolsai.com';
  constructor(private readonly cache: RedisCacheService) {}

  async getFii(ticker: string): Promise<BolsaiFii> {
    const cacheKey = `bolsai:fiis:${ticker}`;
    const cached = await this.cache.get<BolsaiFii>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await fetch(`${this.baseUrl}/api/v1/fiis/${ticker}`, {
      headers: { 'X-API-KEY': process.env.BOLSAI_API_KEY ?? '' },
    });

    if (response.status === 404) {
      throw new HttpException(`FII ${ticker} not found`, HttpStatus.NOT_FOUND);
    }

    if (!response.ok) {
      console.log(response.statusText);
      throw new HttpException(
        `Error fetching FII ${ticker}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const data = (await response.json()) as BolsaiFii;
    await this.cache.set(cacheKey, data, FII_TTL_SECONDS);
    return data;
  }
}
