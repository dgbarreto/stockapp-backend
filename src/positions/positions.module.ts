import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';
import { PositionsRepository } from './positions.repository';
import { QuotesModule } from '../quotes/quotes.module';
import { TickerLogoProvider } from './providers/ticker-logo.provider';
import { FiisModule } from 'src/fiis/fiis.module';
import { DIVIDENDS_PROVIDER } from './providers/dividends.provider';
import { YahooDividendsProvider } from './providers/yahoo-dividends.provider';

@Module({
  providers: [PositionsService, PositionsRepository, TickerLogoProvider, { provide: DIVIDENDS_PROVIDER, useClass: YahooDividendsProvider }],
  controllers: [PositionsController],
  exports: [PositionsRepository],
  imports: [PrismaModule, QuotesModule, FiisModule],
})
export class PositionsModule {}
