import {
  Injectable,
} from '@nestjs/common';
import { PositionsRepository } from './positions.repository';
import { QuotesService } from '../quotes/quotes.service';
import {
  PortfolioSummary,
  PositionSummaryItem,
} from './dto/position-summary.dto';
import { TickerLogoProvider } from './providers/ticker-logo.provider';
import { FiisService } from 'src/fiis/fiis.service';

@Injectable()
export class PositionsService {
  constructor(
    private readonly positionsRepository: PositionsRepository,
    private readonly quotesService: QuotesService,
    private readonly fiisService: FiisService,
    private readonly tickerLogoProvider: TickerLogoProvider,
  ) { }

  findAll(userId: string) {
    return this.positionsRepository.findAllByUser(userId);
  }

  async getSummary(userId: string): Promise<PortfolioSummary> {
    const positions = await this.positionsRepository.findAllByUser(userId);

    const [quotes, logos] = await Promise.all([
      Promise.allSettled(
        positions.map((p) =>
          p.assetType === 'FII'
            ? this.fiisService.getFii(p.ticker)
            : this.quotesService.getFundamentals(p.ticker),
        ),
      ),
      Promise.allSettled(
        positions.map((p) => this.tickerLogoProvider.getLogoUrl(p.ticker)),
      ),
    ]);

    const items: PositionSummaryItem[] = positions.map((position, i) => {
      const quote = quotes[i];
      const logo = logos[i];
      const currentPrice =
        quote.status === 'fulfilled' ? quote.value.close_price : null;
      const currentValue =
        currentPrice !== null ? currentPrice * position.quantity : null;
      const profitPercent =
        currentPrice !== null
          ? ((currentPrice - position.avgPrice) / position.avgPrice) * 100
          : null;
      const logoUrl = logo.status === 'fulfilled' ? logo.value : null;

      return {
        id: position.id,
        ticker: position.ticker,
        assetType: position.assetType,
        quantity: position.quantity,
        avgPrice: position.avgPrice,
        currentPrice,
        currentValue,
        profitPercent,
        logoUrl,
        allocationPercent: null, // will be calculated later
      };
    });

    const investedValue = positions.reduce(
      (sum, p) => sum + p.avgPrice * p.quantity,
      0,
    );
    const totalValue = items.reduce(
      (sum, item) => sum + (item.currentValue ?? 0),
      0,
    );
    const profitValue = totalValue - investedValue;
    const profitPercent =
      investedValue > 0 ? (profitValue / investedValue) * 100 : null;

    const itemsWithAllocation = items.map((item) => ({
      ...item,
      allocationPercent:
        item.currentValue !== null && totalValue > 0
          ? (item.currentValue / totalValue) * 100
          : null,
    }));

    return {
      totalValue,
      investedValue,
      profitValue,
      profitPercent,
      positions: itemsWithAllocation,
    };
  }
}
