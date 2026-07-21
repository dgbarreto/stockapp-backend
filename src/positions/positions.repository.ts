import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Position } from '../../generated/prisma/client';

@Injectable()
export class PositionsRepository {
    constructor(private readonly prisma: PrismaService) {}

    findAllByUser(userId: string): Promise<Position[]> {
        return this.prisma.position.findMany({
            where: { userId },
            orderBy: { ticker: 'asc' },
        });
    }

    findByUserAndTicker(userId: string, ticker: string): Promise<Position | null> {
        return this.prisma.position.findUnique({
            where: { userId_ticker: { userId, ticker } },
        });
    }

    findByIdForUser(id: string, userId: string): Promise<Position | null> {
        return this.prisma.position.findFirst({ where: { id, userId } });
    }

    create(userId: string, data: { ticker: string; quantity: number; avgPrice: number }): Promise<Position> {
        return this.prisma.position.create({ data: { userId, ...data } });
    }

    update(id: string, data: { quantity?: number; avgPrice?: number }): Promise<Position> {
        return this.prisma.position.update({ where: { id }, data });
    }

    delete(id: string): Promise<Position> {
        return this.prisma.position.delete({ where: { id } });
    }
}