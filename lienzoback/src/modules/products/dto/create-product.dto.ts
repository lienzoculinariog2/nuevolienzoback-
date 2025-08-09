import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @Type(() => Number)
  @IsNumber()
  stock: number;

  // @IsOptional()
  // @IsString()
  // imgUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Type(() => Number)
  @IsNumber()
  caloricLevel: number;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsString({ each: true })
  ingredients?: string[];
}
