import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FiisService } from './fiis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('fiis')
export class FiisController {
    constructor(private readonly fiisService: FiisService) {}

    @Get(':ticker/history')
    async getHistory(@Param('ticker') ticker: string) {
        return this.fiisService.getHistory(ticker);
    }

    @Get(':ticker')
    async getFii(@Param('ticker') ticker: string) {
        return this.fiisService.getFii(ticker);
    }
}