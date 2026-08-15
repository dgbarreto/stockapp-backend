import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PositionsService } from './positions.service';
import type { AuthenticatedRequest } from '../auth/authenticated-request';

@UseGuards(JwtAuthGuard)
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.positionsService.findAll(req.user.userId);
  }

  @Get('summary')
  getSummary(@Request() req: AuthenticatedRequest) {
    return this.positionsService.getSummary(req.user.userId);
  }
}
