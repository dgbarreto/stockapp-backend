import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BolsaiFii } from './providers/bolsai-fiis.provider';

@Injectable()
export class FiiHistoryRepository {
    constructor(private readonly prisma: PrismaService) {}

    async save(ticker: string, data: BolsaiFii): Promise<void> {
        await this.prisma.fiiSnapshot.create({
            data: {
                ticker,
                name: data.name,
                segment: data.segment,
                managementType: data.management_type,
                closePrice: data.close_price,
                bookValuePerShare: data.book_value_per_share,
                pvp: data.pvp,
                dividendYieldTtm: data.dividend_yield_ttm,
                netAssetValue: data.net_asset_value,
                sharesOutstanding: data.shares_outstanding,
                totalShareholders: data.total_shareholders
            }
        })
    }

    async findHistory(ticker: string, limit = 50){
        return this.prisma.fiiSnapshot.findMany({
            where: { ticker },
            orderBy: { fetchedAt: 'desc' },
            take: limit
        })
    }
}