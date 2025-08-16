import { IsString, IsOptional, IsIn, IsNumber, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetProductsFilterDto {
  @ApiPropertyOptional({ example: 'Pizza', description: 'Buscar productos por nombre' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 10, description: 'Precio mínimo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price_min?: number;

  @ApiPropertyOptional({ example: 100, description: 'Precio máximo' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price_max?: number;

  @ApiPropertyOptional({ example: true, description: 'Filtrar por productos activos' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la categoría para filtro',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'salmón',
    description: 'Buscar productos que contengan este ingrediente',
  })
  @IsOptional()
  @IsString()
  ingredient?: string;

  @IsOptional()
  @IsString()
  @IsIn(['name', 'price', 'stock', 'caloricLevel'])
  sortBy?: 'name' | 'price' | 'stock' | 'caloricLevel';

  @ApiPropertyOptional({
    example: 'asc',
    description: 'Dirección de la ordenación',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ example: 1, description: 'Número de página para paginación' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Cantidad de productos por página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
