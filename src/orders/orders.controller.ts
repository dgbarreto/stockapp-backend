import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Get()
  findAll(@Request() req, @Query('ticker') ticker?: string) {
    return this.ordersService.findAll(req.user.userId, ticker);
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB - extrato pessoal não chega perto disso
    }),
  )
  importOrders(@Request() req, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    return this.ordersService.importFromFile(req.user.userId, file.buffer);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, dto);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.ordersService.remove(req.user.userId, id);
  }
}
