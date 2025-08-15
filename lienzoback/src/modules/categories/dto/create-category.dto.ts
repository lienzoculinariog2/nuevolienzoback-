import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Vegetariano',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descripción de la categoría',
    example:
      'Comidas sin carne, ave ni pescado, que pueden incluir lácteos y huevos, perfectas para quienes siguen esta dieta.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen representativa de la categoría',
    example: 'https://midominio.com/images/vegetariano.jpg',
  })
  @IsOptional()
  @IsString()
  imgUrl?: string;
}

