import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { BolsaiQuotesProvider } from './providers/bolsai-quotes.provider';
import { QuoteHistoryRepository } from './quote-history.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { KnownTickersModule } from 'src/known-tickers/known-tickers.module';

@Module({
  imports: [PrismaModule, KnownTickersModule],
  controllers: [QuotesController],
  providers: [QuotesService, BolsaiQuotesProvider, QuoteHistoryRepository],
  exports: [QuotesService],
})
export class QuotesModule {}
