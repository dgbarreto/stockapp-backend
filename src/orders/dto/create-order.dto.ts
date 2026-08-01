import { AssetType, OrderSide } from '../../../generated/prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @Matches(/^[A-Z0-9]{4,7}$/, {
    message: 'ticker deve estar em maiúsculas, ex.: PETR4',
  })
  ticker!: string;

  @IsEnum(AssetType)
  assetType!: AssetType;

  @IsEnum(OrderSide)
  side!: OrderSide;

  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fees?: number = 0;

  @IsDateString()
  executedAt!: string;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{4,7}$/, {
    message: 'ticker deve estar em maiúsculas, ex.: PETR4',
  })
  ticker?: string;

  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType;

  @IsOptional()
  @IsEnum(OrderSide)
  side?: OrderSide;

  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fees?: number;

  @IsOptional()
  @IsDateString()
  executedAt?: string;
}
