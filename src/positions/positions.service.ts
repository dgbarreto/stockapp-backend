import {
  Injectable,
  Inject
} from '@nestjs/common';
import { PositionsRepository } from './positions.repository';
import { QuotesService } from '../quotes/quotes.service';
import {
  PortfolioSummary,
  PositionSummaryItem,
} from './dto/position-summary.dto';
import { TickerLogoProvider } from './providers/ticker-logo.provider';
import { FiisService } from 'src/fiis/fiis.service';
import { DIVIDENDS_PROVIDER } from './providers/dividends.provider';
import type { DividendsProvider } from './providers/dividends.provider';
import type { BolsaiFundamentals } from '../quotes/providers/bolsai-quotes.provider';

@Injectable()
export class PositionsService {
  constructor(
    private readonly positionsRepository: PositionsRepository,
    private readonly quotesService: QuotesService,
    private readonly fiisService: FiisService,
    private readonly tickerLogoProvider: TickerLogoProvider,
    @Inject(DIVIDENDS_PROVIDER)
    private readonly dividendsProvider: DividendsProvider,
  ) { }

  findAll(userId: string) {
    return this.positionsRepository.findAllByUser(userId);
  }

  async getSummary(userId: string): Promise<PortfolioSummary> {
    const positions = await this.positionsRepository.findAllByUser(userId);

    const [quotes, logos, dividendMetrics] = await Promise.all([
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
      Promise.allSettled(
        positions.map((p) =>
          this.dividendsProvider.getDividendMetrics(p.ticker),
        ),
      ),
    ]);

    const items: PositionSummaryItem[] = positions.map((position, i) => {
      const quote = quotes[i];
      const logo = logos[i];
      const dividends = dividendMetrics[i];
      const currentPrice =
        quote.status === 'fulfilled' ? quote.value.close_price : null;
      const currentValue =
        currentPrice !== null ? currentPrice * position.quantity : null;
      const profitPercent =
        currentPrice !== null
          ? ((currentPrice - position.avgPrice) / position.avgPrice) * 100
          : null;
      const logoUrl = logo.status === 'fulfilled' ? logo.value : null;
      const dividendPerShareTtm =
        dividends.status === 'fulfilled'
          ? dividends.value.dividendPerShareTtm
          : null;

      const fundamentals =
        quote.status === 'fulfilled' && position.assetType !== 'FII'
          ? (quote.value as BolsaiFundamentals)
          : null;
      const eps = fundamentals?.lpa ?? null;
      const bookValuePerShare = fundamentals?.vpa ?? null;
      const priceToSalesRatio = fundamentals?.p_sr ?? null;

      // earningsCagr5y: pra ação vem da bolsai (CAGR de lucro de verdade).
      // FII não tem "lucro" no sentido contábil, então usamos o CAGR de
      // provento calculado a partir do histórico de dividendos do Yahoo —
      // mesmo campo do domínio, fonte e significado diferentes por trás.
      const earningsCagr5y =
        position.assetType === 'FII'
          ? dividends.status === 'fulfilled'
            ? dividends.value.distributionGrowthRate
            : null
          : (fundamentals?.cagr_earnings_5y ?? null);

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
        dividendPerShareTtm,
        eps,
        bookValuePerShare,
        priceToSalesRatio,
        earningsCagr5y,
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