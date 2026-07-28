import { IsEnum, IsInt, IsNumber, IsPositive, IsString, Matches } from 'class-validator';
import { AssetType } from '../../../generated/prisma/client';

export class CreatePositionDto {
  @IsString()
  @Matches(/^[A-Z0-9]{4,7}$/, { message: 'ticker deve estar em maiúsculas, ex.: PETR4' })
  ticker!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;

  @IsNumber()
  @IsPositive()
  avgPrice!: number;

  @IsEnum(AssetType)
  assetType!: AssetType;
}