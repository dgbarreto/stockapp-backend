import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BolsaiFundamentals } from './providers/bolsai-quotes.provider';

@Injectable()
export class QuoteHistoryRepository {
    constructor(private readonly prisma: PrismaService) {}

    async save(ticker: string, data: BolsaiFundamentals): Promise<void> {
        await this.prisma.quoteSnapshot.create({
            data: {
                ticker,
                closePrice: data.close_price,
                marketCap: data.market_cap,
                pl: data.pl,
                pvp: data.pvp,
                evEbitda: data.ev_ebitda,
                roe: data.roe,
                roic: data.roic,
                netMargin: data.net_margin,
                grossMargin: data.gross_margin,
                netDebtEbitda: data.net_debt_ebitda,
                lpa: data.lpa,
                vpa: data.vpa,
                ebitda: data.ebitda
            }
        })
    }

    async findHistory(ticker: string, limit = 50){
        return this.prisma.quoteSnapshot.findMany({
            where: { ticker },
            orderBy: { fetchedAt: 'desc' },
            take: limit
        })
    }
}