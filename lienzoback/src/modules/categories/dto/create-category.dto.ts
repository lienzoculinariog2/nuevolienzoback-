import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  /**
   *@description category´s name
   *@example vegetariano
   */
  @IsString()
  name: string;

  /**
   *@description category´s description
   *@example "Comidas sin carne, ave ni pescado, que pueden incluir lácteos y huevos, perfectas para quienes siguen esta dieta."
   */
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  imgUrl?: string;
}
