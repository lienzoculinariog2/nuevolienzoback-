import { IsUUID, IsNumber, IsPositive } from 'class-validator';

export class AddSingleProductToCartDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}
