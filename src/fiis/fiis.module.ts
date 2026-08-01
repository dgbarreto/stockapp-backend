import { Module } from '@nestjs/common';
import { FiisController } from './fiis.controller';
import { FiisService } from './fiis.service';
import { BolsaiFiisProvider } from './providers/bolsai-fiis.provider';
import { FiiHistoryRepository } from './fii-history.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { KnownTickersModule } from 'src/known-tickers/known-tickers.module';

@Module({
  imports: [PrismaModule, KnownTickersModule],
  controllers: [FiisController],
  providers: [FiisService, BolsaiFiisProvider, FiiHistoryRepository],
  exports: [FiisService],
})
export class FiisModule {}
