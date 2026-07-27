import { Injectable } from '@nestjs/common';
import { BolsaiFiisProvider, BolsaiFii } from './providers/bolsai-fiis.provider';
import { FiiHistoryRepository } from './fii-history.repository';

@Injectable()
export class FiisService {
    constructor(
        private readonly bolsaiFiisProvider: BolsaiFiisProvider,
        private readonly fiiHistoryRepository: FiiHistoryRepository
    ) {}

    async getFii(ticker: string): Promise<BolsaiFii> {
        const normalizedTicker = ticker.toUpperCase();
        const fii = await this.bolsaiFiisProvider.getFii(normalizedTicker);
        await this.fiiHistoryRepository.save(normalizedTicker, fii);
        return fii;
    }

    async getHistory(ticker: string){
        return this.fiiHistoryRepository.findHistory(ticker.toUpperCase());
    }
}