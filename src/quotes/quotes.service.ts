import { Inject, Injectable } from '@nestjs/common';
import {
  BolsaiQuotesProvider,
  BolsaiFundamentals,
} from './providers/bolsai-quotes.provider';
import { QuoteHistoryRepository } from './quote-history.repository';
import { KnownTickersRepository } from 'src/known-tickers/known-tickers.repository';
import { DIVIDENDS_PROVIDER } from '../dividends/providers/dividends.provider';
import type { DividendsProvider } from '../dividends/providers/dividends.provider';

export interface QuoteFundamentalsResponse extends BolsaiFundamentals {
  dividendPerShareTtm: number | null;
}

@Injectable()
export class QuotesService {
  constructor(
    private readonly bolsaiQuotesProvider: BolsaiQuotesProvider,
    private readonly quoteHistoryRepository: QuoteHistoryRepository,
    private readonly knownTickersRepository: KnownTickersRepository,
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
}
