import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get('list')
  async getPopularQuotes(@Query('limit') limit?: string) {
    return this.quotesService.getPopularQuotes(
      limit ? Number(limit) : undefined,
    );
  }
  @Get(':ticker/history')
  async getHistory(@Param('ticker') ticker: string) {
    return this.quotesService.getHistory(ticker);
  }

  @Get(':ticker')
  async getFundamentals(@Param('ticker') ticker: string) {
    return this.quotesService.getFundamentals(ticker);
  }

  @Get(':ticker/prices')
  async getPrices(
    @Param('ticker') ticker: string,
    @Query('range') range: '1m' | '6m' | '1y' | 'max' = '1m',
  ) {
    return this.quotesService.getPrices(ticker, range);
  }
}
