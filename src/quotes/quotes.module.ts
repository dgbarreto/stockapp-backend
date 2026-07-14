import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { BolsaiQuotesProvider } from './providers/bolsai-quotes.provider';

@Module({
  controllers: [QuotesController],
  providers: [QuotesService, BolsaiQuotesProvider],
})
export class QuotesModule {}
