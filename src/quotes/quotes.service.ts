import { Injectable } from '@nestjs/common';
import { BolsaiQuotesProvider, BolsaiFundamentals } from './providers/bolsai-quotes.provider';
import { QuoteHistoryRepository } from './quote-history.repository';

@Injectable()
export class QuotesService {
    constructor(
        private readonly bolsaiQuotesProvider: BolsaiQuotesProvider,
        private readonly quoteHistoryRepository: QuoteHistoryRepository
    ) {}

    async getFundamentals(ticker: string): Promise<BolsaiFundamentals> {
        const normalizedTicker = ticker.toUpperCase();
        const fundamentals = await this.bolsaiQuotesProvider.getFundamentals(normalizedTicker);
        await this.quoteHistoryRepository.save(normalizedTicker, fundamentals);
        return fundamentals;
    }

    async getHistory(ticker: string){
        return this.quoteHistoryRepository.findHistory(ticker.toUpperCase());
    }
}
