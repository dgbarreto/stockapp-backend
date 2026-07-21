import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { QuotesModule } from './quotes/quotes.module';
import { AuthModule } from './auth/auth.module';
import { PositionsModule } from './positions/positions.module';

@Module({
  imports: [PrismaModule, QuotesModule, AuthModule, PositionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
