import { Inject, Injectable } from '@nestjs/common';
import {
  BolsaiQuotesProvider,
  BolsaiFundamentals,
} from './providers/bolsai-quotes.provider';
import { QuoteHistoryRepository } from './quote-history.repository';
import { KnownTickersRepository } from 'src/known-tickers/known-tickers.repository';
import { DIVIDENDS_PROVIDER } from '../dividends/providers/dividends.provider';
import type { DividendsProvider } from '../dividends/providers/dividends.provider';
import { RedisCacheService } from 'src/cache/redis-cache.service';
import { YahooPriceHistoryProvider } from './providers/yahoo-price-history.provider';

export interface QuoteFundamentalsResponse extends BolsaiFundamentals {
  dividendPerShareTtm: number | null;
}

export interface QuoteSummary {
  ticker: string;
  price: number;
  changePercent: number;
  sparkline: number[];
}

// Fallback só usado quando known_tickers ainda não tem nenhum ticker de ação
// registrado (ambiente novo/zerado) — mora aqui pra poder trocar sem deploy de app.
const FALLBACK_STOCK_TICKERS = ['PETR4', 'VALE3', 'ITUB4', 'MGLU3'];

@Injectable()
export class QuotesService {
  constructor(
    private readonly bolsaiQuotesProvider: BolsaiQuotesProvider,
    private readonly quoteHistoryRepository: QuoteHistoryRepository,
    private readonly knownTickersRepository: KnownTickersRepository,
    private readonly priceHistoryProvider: YahooPriceHistoryProvider,
    private readonly cache: RedisCacheService,
    @Inject(DIVIDENDS_PROVIDER)
    private readonly dividendsProvider: DividendsProvider,
  ) {}

  async getFundamentals(ticker: string): Promise<QuoteFundamentalsResponse> {
    const normalizedTicker = ticker.toUpperCase();
    const [fundamentals, dividendMetrics] = await Promise.all([
      this.bolsaiQuotesProvider.getFundamentals(normalizedTicker),
      this.dividendsProvider
        .getDividendMetrics(normalizedTicker)
        .catch(() => null),
    ]);
    await this.quoteHistoryRepository.save(normalizedTicker, fundamentals);
    await this.knownTickersRepository.upsert(normalizedTicker, 'STOCK');
    return {
      ...fundamentals,
      dividendPerShareTtm: dividendMetrics?.dividendPerShareTtm ?? null,
    };
  }

  async getHistory(ticker: string) {
    return this.quoteHistoryRepository.findHistory(ticker.toUpperCase());
  }

  async getPopularQuotes(limit = 8): Promise<QuoteSummary[]> {
    const known = await this.knownTickersRepository.findMostRecent(
      'STOCK',
      limit,
    );
    const tickers =
      known.length > 0 ? known.map((k) => k.ticker) : FALLBACK_STOCK_TICKERS;
    const results = await Promise.allSettled(
      tickers.map((ticker) => this.getQuoteSummary(ticker)),
    );

    const summaries: QuoteSummary[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        summaries.push(result.value);
      } else {
        console.warn(
          `[QuotesService] Falha ao buscar cotação de ${tickers[index]} para a lista popular: ${result.reason}`,
        );
      }
    });
    return summaries;
  }

  async getPrices(ticker: string, range: '1m' | '6m' | '1y' | 'max') {
    return this.priceHistoryProvider.getPricesForRange(
      ticker.toUpperCase(),
      range,
    );
  }

  private async getQuoteSummary(ticker: string): Promise<QuoteSummary> {
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
