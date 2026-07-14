import { Controller, Get, Param } from '@nestjs/common';
import { QuotesService } from './quotes.service';

@Controller('quotes')
export class QuotesController {
    constructor(private readonly quotesService: QuotesService) {}

    @Get(':ticker/history')
    async getHistory(@Param('ticker') ticker: string) {
        return this.quotesService.getHistory(ticker);
    }

    @Get(':ticker')
    async getFundamentals(@Param('ticker') ticker: string) {
        return this.quotesService.getFundamentals(ticker);
    }
}