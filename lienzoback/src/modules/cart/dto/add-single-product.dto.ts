import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class AddSingleProductToCartDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;
}
