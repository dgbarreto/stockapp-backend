import { IsInt, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdatePositionDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  avgPrice?: number;
}