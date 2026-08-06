import { Inject, Injectable } from '@nestjs/common';
import {
  BolsaiFiisProvider,
  BolsaiFii,
} from './providers/bolsai-fiis.provider';
import { FiiHistoryRepository } from './fii-history.repository';
import { KnownTickersRepository } from 'src/known-tickers/known-tickers.repository';
import { DIVIDENDS_PROVIDER } from '../dividends/providers/dividends.provider';
import type { DividendsProvider } from '../dividends/providers/dividends.provider';

export interface FiiResponse extends BolsaiFii {
  dividendPerShareTtm: number | null;
  distributionGrowthRate: number | null;
}

@Injectable()
export class FiisService {
  constructor(
    private readonly bolsaiFiisProvider: BolsaiFiisProvider,
    private readonly fiiHistoryRepository: FiiHistoryRepository,
    private readonly knownTickersRepository: KnownTickersRepository,
    @Inject(DIVIDENDS_PROVIDER)
    private readonly dividendsProvider: DividendsProvider,
  ) {}

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
}
