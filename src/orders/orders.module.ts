import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { PositionsModule } from '../positions/positions.module';
import { QuotesModule } from 'src/quotes/quotes.module';
import { FiisModule } from 'src/fiis/fiis.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, PositionsModule, QuotesModule, FiisModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
