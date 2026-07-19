import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
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