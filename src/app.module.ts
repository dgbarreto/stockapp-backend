import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { QuotesModule } from './quotes/quotes.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, QuotesModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
