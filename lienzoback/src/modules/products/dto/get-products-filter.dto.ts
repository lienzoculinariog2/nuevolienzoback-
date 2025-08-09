import { IsString, IsOptional, IsIn, IsNumber, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProductsFilterDto {

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;
  
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price_max?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['name', 'price', 'stock', 'caloricLevel'])
  sortBy?: 'name' | 'price' | 'stock' | 'caloricLevel';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
