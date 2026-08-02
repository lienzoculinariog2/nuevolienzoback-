import { Type } from 'class-transformer';
import { IsArray, IsInt, IsPositive, IsUUID, ValidateNested } from 'class-validator';

export class CartItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;
}

export class AddMultipleProductsToCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  products: CartItemDto[];
}
