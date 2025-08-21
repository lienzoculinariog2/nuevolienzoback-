import { IsOptional, IsNumber, IsString, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDiscountCodeDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  percentage?: number;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional()
  validUntil?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  isSingleUsePerUser?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional()
  isActive?: boolean;
}
