import { Module } from '@nestjs/common';
import { KnownTickersRepository } from './known-tickers.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [KnownTickersRepository],
  exports: [KnownTickersRepository],
})
export class KnownTickersModule {}