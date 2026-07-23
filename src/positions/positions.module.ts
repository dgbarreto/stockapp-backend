import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';
import { PositionsRepository } from './positions.repository';
import { QuotesModule } from '../quotes/quotes.module';

@Module({
    imports: [PrismaModule, QuotesModule],
    controllers: [PositionsController],
    providers: [PositionsService, PositionsRepository],
})
export class PositionsModule {}