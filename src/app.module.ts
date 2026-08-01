import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { QuotesModule } from './quotes/quotes.module';
import { AuthModule } from './auth/auth.module';
import { PositionsModule } from './positions/positions.module';
import { FiisModule } from './fiis/fiis.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    PrismaModule,
    QuotesModule,
    AuthModule,
    PositionsModule,
    FiisModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
