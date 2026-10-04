import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssetType, KnownTicker } from '../../generated/prisma/client';

@Injectable()
export class KnownTickersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByTicker(ticker: string): Promise<KnownTicker | null> {
    return this.prisma.knownTicker.findUnique({ where: { ticker } });
  }

  findMostRecent(assetType: AssetType, limit: number): Promise<KnownTicker[]> {
    return this.prisma.knownTicker.findMany({
      where: { assetType },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async upsert(
    ticker: string,
    assetType: AssetType,
    name?: string | null,
  ): Promise<void> {
    await this.prisma.knownTicker.upsert({
      where: { ticker },
      create: { ticker, assetType, name: name ?? null },
      // Só sobrescreve o nome quando veio um — uma falha pontual não apaga o que já existe.
      update: { assetType, ...(name ? { name } : {}) },
    });
  }
}
