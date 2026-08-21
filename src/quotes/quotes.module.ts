import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { BolsaiQuotesProvider } from './providers/bolsai-quotes.provider';
import { QuoteHistoryRepository } from './quote-history.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { KnownTickersModule } from 'src/known-tickers/known-tickers.module';
import { DividendsModule } from 'src/dividends/dividends.module';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  imports: [PrismaModule, KnownTickersModule, DividendsModule, CacheModule],
  controllers: [QuotesController],
  providers: [QuotesService, BolsaiQuotesProvider, QuoteHistoryRepository],
  exports: [QuotesService],
})
export class QuotesModule {}
