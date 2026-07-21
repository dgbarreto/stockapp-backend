import { IsInt, IsNumber, IsPositive, IsString, Matches } from 'class-validator';

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
}