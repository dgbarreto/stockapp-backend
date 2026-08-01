import { Injectable } from '@nestjs/common';
import {
  AssetType,
  Order,
  OrderSide,
  OrderSource,
  Prisma,
} from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type OrderData = {
  ticker: string;
  assetType: AssetType;
  side: OrderSide;
  quantity: number;
  price: number;
  fees: number;
  executedAt: Date;
  source?: OrderSource;
  importBatchId?: string | null;
};

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUser(userId: string, ticker?: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: { userId, ...(ticker ? { ticker } : {}) },
      orderBy: { executedAt: 'desc' },
    });
  }

  findAllByUserAndTickerTx(
    tx: Prisma.TransactionClient,
    userId: string,
    ticker: string,
  ): Promise<Order[]> {
    return tx.order.findMany({
      where: { userId, ticker },
      orderBy: [{ executedAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findByIdForUser(id: string, userId: string): Promise<Order | null> {
    return this.prisma.order.findFirst({ where: { id, userId } });
  }

  createTx(
    tx: Prisma.TransactionClient,
    userId: string,
    data: OrderData,
  ): Promise<Order> {
    return tx.order.create({ data: { userId, ...data } });
  }

  updateTx(
    tx: Prisma.TransactionClient,
    id: string,
    data: Partial<OrderData>,
  ): Promise<Order> {
    return tx.order.update({ where: { id }, data });
  }

  deleteTx(tx: Prisma.TransactionClient, id: string): Promise<Order> {
    return tx.order.delete({ where: { id } });
  }
}
