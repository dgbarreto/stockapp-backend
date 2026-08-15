import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssetType, KnownTicker } from '../../generated/prisma/client';

@Injectable()
export class KnownTickersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByTicker(ticker: string): Promise<KnownTicker | null> {
    return this.prisma.knownTicker.findUnique({ where: { ticker } });
  }

  async upsert(ticker: string, assetType: AssetType): Promise<void> {
    await this.prisma.knownTicker.upsert({
      where: { ticker },
      create: { ticker, assetType },
      update: { assetType },
    });
  }
}
