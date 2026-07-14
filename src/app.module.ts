import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { QuotesModule } from './quotes/quotes.module';

@Module({
  imports: [PrismaModule, QuotesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
