import { IsNotEmpty, IsNumber, IsString, IsDateString } from 'class-validator';

export class CreateDiscountCodeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  percentage: number;

  @IsDateString()
  @IsNotEmpty()
  validUntil: string;
}
