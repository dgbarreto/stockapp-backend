import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersRepository } from './orders.repository';
import { PositionsRepository } from '../positions/positions.repository';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';
import { AssetType, Prisma } from '../../generated/prisma/client';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { QuotesService } from 'src/quotes/quotes.service';
import { FiisService } from 'src/fiis/fiis.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersRepository: OrdersRepository,
    private readonly positionsRepository: PositionsRepository,
    private readonly quotesService: QuotesService,
    private readonly fiisService: FiisService,
  ) {}

  findAll(userId: string, ticker?: string) {
    return this.ordersRepository.findAllByUser(userId, ticker?.toUpperCase());
  }

  private async validateTickerExists(
    ticker: string,
    assetType: AssetType,
  ): Promise<void> {
    if (assetType === 'FII') {
      await this.fiisService.getFii(ticker);
    } else {
      await this.quotesService.getFundamentals(ticker);
    }
  }

  async create(userId: string, dto: CreateOrderDto) {
    const ticker = dto.ticker.toUpperCase();
    await this.validateTickerExists(ticker, dto.assetType);

    return this.prisma.$transaction(async (tx) => {
      const order = await this.ordersRepository.createTx(tx, userId, {
        ticker,
        assetType: dto.assetType,
        side: dto.side,
        quantity: dto.quantity,
        price: dto.price,
        fees: dto.fees ?? 0,
        executedAt: new Date(dto.executedAt),
        source: 'MANUAL',
      });
      await this.recalculatePosition(tx, userId, ticker, dto.assetType);
      return order;
    });
  }

  async update(userId: string, id: string, dto: UpdateOrderDto) {
    const existing = await this.ordersRepository.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundException('Order not found');

    if (dto.ticker || dto.assetType) {
      await this.validateTickerExists(
        (dto.ticker ?? existing.ticker).toUpperCase(),
        dto.assetType ?? existing.assetType,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const ticker = dto.ticker?.toUpperCase();
      const order = await this.ordersRepository.updateTx(tx, id, {
        ticker,
        assetType: dto.assetType,
        side: dto.side,
        quantity: dto.quantity,
        price: dto.price,
        fees: dto.fees ?? 0,
        executedAt: new Date(dto.executedAt ?? new Date()),
        source: 'MANUAL',
      });
      await this.recalculatePosition(
        tx,
        userId,
        existing.ticker,
        existing.assetType,
      );
      if (order.ticker !== existing.ticker) {
        await this.recalculatePosition(
          tx,
          userId,
          order.ticker,
          order.assetType,
        );
      }
      return order;
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.ordersRepository.findByIdForUser(id, userId);
    if (!existing) throw new NotFoundException('Order not found');

    return this.prisma.$transaction(async (tx) => {
      const order = await this.ordersRepository.deleteTx(tx, id);
      await this.recalculatePosition(
        tx,
        userId,
        existing.ticker,
        existing.assetType,
      );
      return order;
    });
  }

  private async recalculatePosition(
    tx: Prisma.TransactionClient,
    userId: string,
    ticker: string,
    assetType: AssetType,
  ) {
    const orders = await this.ordersRepository.findAllByUserAndTickerTx(
      tx,
      userId,
      ticker,
    );

    let quantity = 0;
    let totalCost = 0;

    for (const order of orders) {
      if (order.side === 'BUY') {
        totalCost += order.price * order.quantity + order.fees;
        quantity += order.quantity;
      } else {
        if (order.quantity > quantity) {
          throw new ConflictException(
            `Venda de ${order.quantity} de ${ticker} excede a posição atual (${quantity})`,
          );
        }
        const avgPriceBeforeSell = quantity > 0 ? totalCost / quantity : 0;
        totalCost -= avgPriceBeforeSell * order.quantity;
        quantity -= order.quantity;
      }
    }

    if (quantity === 0) {
      await this.positionsRepository.deleteByUserAndTicker(tx, userId, ticker);
    } else {
      await this.positionsRepository.upsertForRecalculation(
        tx,
        userId,
        ticker,
        {
          assetType,
          quantity,
          avgPrice: totalCost / quantity,
        },
      );
    }
  }
}
