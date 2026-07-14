import { Injectable } from '@nestjs/common';
import { BolsaiQuotesProvider, BolsaiFundamentals } from './providers/bolsai-quotes.provider';

@Injectable()
export class QuotesService {
    constructor(private readonly bolsaiQuotesProvider: BolsaiQuotesProvider) {}

    async getFundamentals(ticker: string): Promise<BolsaiFundamentals> {
        return this.bolsaiQuotesProvider.getFundamentals(ticker.toUpperCase());
    }
}
