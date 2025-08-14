import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateIngredientDto {
  /**
   *@description ingredient´s name
   *@example uchuva
   */
  @IsString()
  @IsNotEmpty()
  name: string;
}
