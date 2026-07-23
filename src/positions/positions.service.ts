import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PositionsRepository } from './positions.repository';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QuotesService } from '../quotes/quotes.service';
import { PortfolioSummary, PositionSummaryItem } from './dto/position-summary.dto';

@Injectable()
export class PositionsService {
    constructor(
        private readonly positionsRepository: PositionsRepository,
        private readonly quotesService: QuotesService
    ) {}

    findAll(userId: string) {
        return this.positionsRepository.findAllByUser(userId);
    }

    async create(userId: string, dto: CreatePositionDto) {
        const ticker = dto.ticker.toUpperCase();
        const existing = await this.positionsRepository.findByUserAndTicker(userId, ticker);
        if (existing) {
            throw new ConflictException(`Position for ${ticker} already exists — use PATCH to update it`);
        }
        return this.positionsRepository.create(userId, { ...dto, ticker });
    }

    async update(userId: string, id: string, dto: UpdatePositionDto) {
        const position = await this.positionsRepository.findByIdForUser(id, userId);
        if (!position) {
            throw new NotFoundException('Position not found');
        }
        return this.positionsRepository.update(id, dto);
    }

    async remove(userId: string, id: string) {
        const position = await this.positionsRepository.findByIdForUser(id, userId);
        if (!position) {
            throw new NotFoundException('Position not found');
        }
        return this.positionsRepository.delete(id);
    }


    async getSummary(userId: string): Promise<PortfolioSummary> {
        const positions = await this.positionsRepository.findAllByUser(userId);

        const quotes = await Promise.allSettled(
            positions.map((p) => this.quotesService.getFundamentals(p.ticker))
        )

        const items: PositionSummaryItem[] = positions.map((position, i) => {
            const quote = quotes[i];
            const currentPrice = quote.status === 'fulfilled' ? quote.value.close_price : null;
            const currentValue = currentPrice !== null ? currentPrice * position.quantity : null;
            const profitPercent =
                currentPrice !== null ? ((currentPrice - position.avgPrice) / position.avgPrice) * 100 : null;

            return{
                id: position.id,
                ticker: position.ticker,
                quantity: position.quantity,
                avgPrice: position.avgPrice,
                currentPrice,
                currentValue,
                profitPercent,
                allocationPercent: null, // will be calculated later
            }
        });

        const investedValue = positions.reduce((sum, p) => sum + p.avgPrice * p.quantity, 0);
        const totalValue = items.reduce((sum, item) => sum + (item.currentValue ?? 0), 0);
        const profitValue = totalValue - investedValue;
        const profitPercent = investedValue > 0 ? (profitValue / investedValue) * 100 : null;

        const itemsWithAllocation = items.map((item) => ({
            ...item,
            allocationPercent: 
                item.currentValue !== null && totalValue > 0 ? (item.currentValue / totalValue) * 100 : null,
        }));

        return { totalValue, investedValue, profitValue, profitPercent, positions: itemsWithAllocation };
    }
}