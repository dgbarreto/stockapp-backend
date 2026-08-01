import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PositionsService } from './positions.service';

@UseGuards(JwtAuthGuard)
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  findAll(@Request() req) {
    return this.positionsService.findAll(req.user.userId);
  }

  @Get('summary')
  getSummary(@Request() req) {
    return this.positionsService.getSummary(req.user.userId);
  }
}
