import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersRepository } from './orders.repository';
import { PositionsRepository } from '../positions/positions.repository';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';
import { AssetType, Prisma } from '../../generated/prisma/client';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { QuotesService } from 'src/quotes/quotes.service';
import { FiisService } from 'src/fiis/fiis.service';
import { KnownTickersRepository } from 'src/known-tickers/known-tickers.repository';
import { guessAssetTypeOrder } from './ticker-type.util';
import { randomUUID } from 'crypto';
import { parseB3NegociacaoFile, parseBrDate } from './spreadsheet-parser.util';

export interface ImportOrdersResult {
  importBatchId: string;
  totalRows: number;
  created: number;
  skipped: { row: number; ticker: string | null; reason: string }[];
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersRepository: OrdersRepository,
    private readonly positionsRepository: PositionsRepository,
    private readonly quotesService: QuotesService,
    private readonly fiisService: FiisService,
    private readonly knownTickersRepository: KnownTickersRepository,
  ) {}

  findAll(userId: string, ticker?: string) {
    return this.ordersRepository.findAllByUser(userId, ticker?.toUpperCase());
  }

  private async validateTickerExists(
    ticker: string,
    assetType: AssetType,
  ): Promise<void> {
    const cached = await this.knownTickersRepository.findByTicker(ticker);
    if (cached?.assetType === assetType) return;

    if (assetType === 'FII') {
      await this.fiisService.getFii(ticker);
    } else {
      await this.quotesService.getFundamentals(ticker);
    }
  }

  async resolveAssetType(ticker: string): Promise<AssetType | null> {
    const cached = await this.knownTickersRepository.findByTicker(ticker);
    if (cached) return cached.assetType;

    for (const type of guessAssetTypeOrder(ticker)) {
      try {
        if (type === 'FII') {
          await this.fiisService.getFii(ticker);
        } else {
          await this.quotesService.getFundamentals(ticker);
        }
        return type;
      } catch {
        // ticker não confirmado para esse assetType nessa tentativa - segue pra próxima heurística
      }
    }

    return null;
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

  async importFromFile(
    userId: string,
    buffer: Buffer,
  ): Promise<ImportOrdersResult> {
    const rows = parseB3NegociacaoFile(buffer);
    const importBatchId = randomUUID();
    const skipped: ImportOrdersResult['skipped'] = [];

    type ValidRow = {
      rowIndex: number;
      ticker: string;
      side: 'BUY' | 'SELL';
      quantity: number;
      price: number;
      executedAt: Date;
    };
    const validRows: ValidRow[] = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +1 cabeçalho, +1 base 1 (bate com a linha da planilha)
      const ticker = row['Código de Negociação']
        ?.toString()
        .toUpperCase()
        .trim();
      const mercado = row['Mercado']?.toString().trim();
      const tipo = row['Tipo de Movimentação']?.toString().trim();

      if (
        !ticker ||
        !row['Data do Negócio'] ||
        !row['Quantidade'] ||
        !row['Preço']
      ) {
        skipped.push({
          row: rowNumber,
          ticker: ticker ?? null,
          reason: 'Linha incompleta',
        });
        return;
      }
      if (mercado !== 'Mercado à Vista') {
        skipped.push({
          row: rowNumber,
          ticker,
          reason: `Mercado não suportado: ${mercado}`,
        });
        return;
      }
      if (tipo !== 'Compra' && tipo !== 'Venda') {
        skipped.push({
          row: rowNumber,
          ticker,
          reason: `Tipo de movimentação não suportado: ${tipo}`,
        });
        return;
      }

      validRows.push({
        rowIndex: rowNumber,
        ticker,
        side: tipo === 'Compra' ? 'BUY' : 'SELL',
        quantity: Number(row['Quantidade']),
        price: Number(row['Preço']),
        executedAt: parseBrDate(row['Data do Negócio']),
      });
    });

    // Resolve o tipo de ativo uma vez por ticker único, não uma vez por linha - é aqui que o
    // known_tickers/heurística de sufixo economizam chamada da bolsai de verdade.
    const uniqueTickers = [...new Set(validRows.map((r) => r.ticker))];
    const assetTypeByTicker = new Map<string, AssetType | null>();
    for (const ticker of uniqueTickers) {
      assetTypeByTicker.set(ticker, await this.resolveAssetType(ticker));
    }

    const ordersToCreate = validRows.filter((r) => {
      const assetType = assetTypeByTicker.get(r.ticker);
      if (!assetType) {
        skipped.push({
          row: r.rowIndex,
          ticker: r.ticker,
          reason: 'Ticker não reconhecido',
        });
        return false;
      }
      return true;
    });

    let created = 0;
    if (ordersToCreate.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const row of ordersToCreate) {
          await this.ordersRepository.createTx(tx, userId, {
            ticker: row.ticker,
            assetType: assetTypeByTicker.get(row.ticker)!,
            side: row.side,
            quantity: row.quantity,
            price: row.price,
            fees: 0,
            executedAt: row.executedAt,
            source: 'IMPORT',
            importBatchId,
          });
          created++;
        }

        const affectedTickers = new Set(ordersToCreate.map((r) => r.ticker));
        for (const ticker of affectedTickers) {
          await this.recalculatePosition(
            tx,
            userId,
            ticker,
            assetTypeByTicker.get(ticker)!,
          );
        }
      });
    }

    return { importBatchId, totalRows: rows.length, created, skipped };
  }
}
