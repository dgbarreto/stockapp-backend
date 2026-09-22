import { Inject, Injectable } from '@nestjs/common';
import {
  BolsaiFiisProvider,
  BolsaiFii,
} from './providers/bolsai-fiis.provider';
import { FiiHistoryRepository } from './fii-history.repository';
import { KnownTickersRepository } from 'src/known-tickers/known-tickers.repository';
import { DIVIDENDS_PROVIDER } from '../dividends/providers/dividends.provider';
import type { DividendsProvider } from '../dividends/providers/dividends.provider';
import { YahooPriceHistoryProvider } from 'src/quotes/providers/yahoo-price-history.provider';
import { RedisCacheService } from 'src/cache/redis-cache.service';

export interface FiiResponse extends BolsaiFii {
  dividendPerShareTtm: number | null;
  distributionGrowthRate: number | null;
}

export interface FiiSummary {
  ticker: string;
  price: number;
  changePercent: number;
  sparkline: number[];
}

// Mesmo racional do quotes: fallback só entra em jogo se known_tickers ainda
// não tiver nenhum FII registrado (ambiente novo/zerado).
const FALLBACK_FII_TICKERS = ['HGLG11', 'KNRI11'];

@Injectable()
export class FiisService {
  constructor(
    private readonly bolsaiFiisProvider: BolsaiFiisProvider,
    private readonly fiiHistoryRepository: FiiHistoryRepository,
    private readonly knownTickersRepository: KnownTickersRepository,
    private readonly priceHistoryProvider: YahooPriceHistoryProvider,
    private readonly cache: RedisCacheService,
    @Inject(DIVIDENDS_PROVIDER)
    private readonly dividendsProvider: DividendsProvider,
  ) { }

  async getFii(ticker: string): Promise<FiiResponse> {
    const normalizedTicker = ticker.toUpperCase();
    const [fii, dividendMetrics] = await Promise.all([
      this.bolsaiFiisProvider.getFii(normalizedTicker),
      this.dividendsProvider
        .getDividendMetrics(normalizedTicker)
        .catch(() => null),
    ]);
    await this.fiiHistoryRepository.save(normalizedTicker, fii);
    await this.knownTickersRepository.upsert(normalizedTicker, 'FII');
    return {
      ...fii,
      dividendPerShareTtm: dividendMetrics?.dividendPerShareTtm ?? null,
      distributionGrowthRate: dividendMetrics?.distributionGrowthRate ?? null,
    };
  }

  async getHistory(ticker: string) {
    return this.fiiHistoryRepository.findHistory(ticker.toUpperCase());
  }

  async getPopularFiis(limit = 8): Promise<FiiSummary[]> {
    const known = await this.knownTickersRepository.findMostRecent('FII', limit);
    const tickers = known.length > 0 ? known.map((k) => k.ticker) : FALLBACK_FII_TICKERS;
    const results = await Promise.allSettled(tickers.map((ticker) => this.getFiiSummary(ticker)));

    const summaries: FiiSummary[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        summaries.push(result.value);
      } else {
        console.warn(
          `[FiisService] Falha ao buscar FII de ${tickers[index]} para a lista popular: ${result.reason}`,
        );
      }
    });
    return summaries;
  }

  async getPrices(ticker: string, range: '1m' | '6m' | '1y' | 'max') {
    return this.priceHistoryProvider.getPricesForRange(ticker.toUpperCase(), range);
  }

  private async getFiiSummary(ticker: string): Promise<FiiSummary> {
    const cacheKey = `yahoo:daily:${ticker}`;
    let closes = await this.cache.get<number[]>(cacheKey);
    if (!closes) {
      const points = await this.priceHistoryProvider.getDailyCloses(ticker, 14);
      closes = points.map((p) => p.close);
      await this.cache.set(cacheKey, closes, 15 * 60);
    }
    const last = closes.at(-1) ?? 0;
    const prev = closes.at(-2) ?? last;
    return {
      ticker,
      price: last,
      changePercent: prev ? ((last - prev) / prev) * 100 : 0,
      sparkline: closes,
    };
  }
}
