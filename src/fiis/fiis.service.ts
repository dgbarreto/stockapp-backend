import { Injectable } from '@nestjs/common';
import {
  BolsaiFiisProvider,
  BolsaiFii,
} from './providers/bolsai-fiis.provider';
import { FiiHistoryRepository } from './fii-history.repository';
import { KnownTickersRepository } from 'src/known-tickers/known-tickers.repository';

@Injectable()
export class FiisService {
  constructor(
    private readonly bolsaiFiisProvider: BolsaiFiisProvider,
    private readonly fiiHistoryRepository: FiiHistoryRepository,
    private readonly knownTickersRepository: KnownTickersRepository,
  ) {}

  async getFii(ticker: string): Promise<BolsaiFii> {
    const normalizedTicker = ticker.toUpperCase();
    const fii = await this.bolsaiFiisProvider.getFii(normalizedTicker);
    await this.fiiHistoryRepository.save(normalizedTicker, fii);
    await this.knownTickersRepository.upsert(normalizedTicker, 'FII');
    return fii;
  }

  async getHistory(ticker: string) {
    return this.fiiHistoryRepository.findHistory(ticker.toUpperCase());
  }
}
