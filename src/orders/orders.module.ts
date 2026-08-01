import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { PositionsModule } from '../positions/positions.module';
import { QuotesModule } from 'src/quotes/quotes.module';
import { FiisModule } from 'src/fiis/fiis.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { KnownTickersModule } from 'src/known-tickers/known-tickers.module';

@Module({
  imports: [PrismaModule, PositionsModule, QuotesModule, FiisModule, KnownTickersModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
