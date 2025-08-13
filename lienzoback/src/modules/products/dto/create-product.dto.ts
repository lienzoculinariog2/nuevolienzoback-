import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Pizza Margarita', description: 'Nombre único del producto' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Pizza con queso mozzarella y albahaca fresca', description: 'Descripción del producto' })
  @IsString()
  description: string;

  @ApiProperty({ example: 12.99, description: 'Precio del producto' })
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: 20, description: 'Stock disponible' })
  @IsNumber()
  @Type(() => Number)
  stock: number;

  @ApiPropertyOptional({ example: true, description: 'Estado activo/inactivo del producto' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ example: 250, description: 'Nivel calórico del producto' })
  @IsNumber()
  @Type(() => Number)
  caloricLevel: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID de la categoría del producto' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: ['Tomate', 'Queso', 'Albahaca'], description: 'Lista de ingredientes' })
  @IsOptional()
  @IsString({ each: true })
  ingredients?: string[];
}
