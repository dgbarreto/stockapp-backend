import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { FiisService } from './fiis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('fiis')
export class FiisController {
  constructor(private readonly fiisService: FiisService) {}

  @Get('list')
  async getPopularFiis(@Query('limit') limit?: string) {
    return this.fiisService.getPopularFiis(limit ? Number(limit) : undefined);
  }

  @Get(':ticker/history')
  async getHistory(@Param('ticker') ticker: string) {
    return this.fiisService.getHistory(ticker);
  }

  @Get(':ticker')
  async getFii(@Param('ticker') ticker: string) {
    return this.fiisService.getFii(ticker);
  }
}
