import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PositionsRepository } from './positions.repository';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

@Injectable()
export class PositionsService {
    constructor(private readonly positionsRepository: PositionsRepository) {}

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
}