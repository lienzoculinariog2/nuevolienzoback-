import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProductDto {

  @ApiProperty({ example: 'Ensalada', description: 'Nombre del Platillo' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Una ensalada con mezclas de lechuga alta en proteína', description: 'Describe brevemente el platillo' })
  @IsString()
  description: string;

  @ApiProperty({ example: 89.99, description: 'Precio del platillo' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 20, description: 'Cantidad en stock disponible' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'https://mis-imagenes.com/ensalada.jpg', description: 'URL de la imagen del producto', required: false })
  @IsOptional()
  @IsString()
  imgUrl?: string;

  @ApiProperty({ example: true, description: 'Indica si el producto está activo' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === '1')
  isActive?: boolean;

  @ApiProperty({ example: 250, description: 'Nivel calórico del producto', required: false })
  @IsNumber()
  caloricLevel: number;

  @ApiProperty({ example: 'uuid-de-categoría', description: 'ID de la categoría a la que pertenece el producto' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    example: ['Lechugas', 'Tomate', 'Pollo'],
    description: 'Lista de ingredientes o materiales',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  ingredients?: string[];
}
