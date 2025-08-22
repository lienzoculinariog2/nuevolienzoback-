import { Type } from 'class-transformer';
import { IsUUID, IsNumber, IsPositive, IsArray, ValidateNested } from 'class-validator';

export class CartItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class AddMultipleProductsToCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  products: CartItemDto[];
}
