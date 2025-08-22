import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class DiscountCodesFilterDto {
  @IsOptional()
  @IsString()
  partialCode?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
