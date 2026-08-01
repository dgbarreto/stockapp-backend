import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssetType, Position, Prisma } from '../../generated/prisma/client';

@Injectable()
export class PositionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string): Promise<Position[]> {
    return this.prisma.position.findMany({
      where: { userId },
      orderBy: { ticker: 'asc' },
    });
  }

  async upsertForRecalculation(
    tx: Prisma.TransactionClient,
    userId: string,
    ticker: string,
    data: { assetType: AssetType; quantity: number; avgPrice: number },
  ): Promise<Position> {
    return tx.position.upsert({
      where: { userId_ticker: { userId, ticker } },
      create: { userId, ticker, ...data },
      update: { quantity: data.quantity, avgPrice: data.avgPrice },
    });
  }

  async deleteByUserAndTicker(
    tx: Prisma.TransactionClient,
    userId: string,
    ticker: string,
  ): Promise<void> {
    await tx.position.deleteMany({ where: { userId, ticker } });
  }
}
