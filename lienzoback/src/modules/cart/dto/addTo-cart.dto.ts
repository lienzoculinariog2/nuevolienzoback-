import { IsUUID, IsNumber, IsPositive } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
