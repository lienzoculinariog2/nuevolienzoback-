import { IsString, IsOptional, IsIn, IsNumber, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetProductsFilterDto {
@ApiPropertyOptional({
    description: 'Filtra productos cuyo nombre contenga este valor',
    example: 'Hamburguesa Vegana',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtra productos con precio mínimo',
    example: 10.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price_min?: number;

  @ApiPropertyOptional({
    description: 'Filtra productos con precio máximo',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price_max?: number;

  @ApiPropertyOptional({
    description: 'Filtra por estado de disponibilidad',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filtra por ID de categoría (UUID)',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Campo por el que se ordenarán los productos',
    enum: ['name', 'price', 'stock', 'caloricLevel'],
    example: 'price',
  })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'price', 'stock', 'caloricLevel'])
  sortBy?: 'name' | 'price' | 'stock' | 'caloricLevel';

  @ApiPropertyOptional({
    description: 'Orden de los resultados',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Número de página para paginación',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de productos por página',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;
}
