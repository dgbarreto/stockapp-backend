import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
         

@UseGuards(JwtAuthGuard)
@Controller('positions')
export class PositionsController {
    constructor(private readonly positionsService: PositionsService) {}

    @Get()
    findAll(@Request() req) {
        return this.positionsService.findAll(req.user.userId);
    }

    @Post()
    create(@Request() req, @Body() dto: CreatePositionDto) {
        return this.positionsService.create(req.user.userId, dto);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() dto: UpdatePositionDto) {
        return this.positionsService.update(req.user.userId, id, dto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.positionsService.remove(req.user.userId, id);
    }
}