// src/cart/dto/add-multiple-products.dto.ts
import { Type } from 'class-transformer';
import { IsUUID, IsNumber, IsPositive, IsArray, ValidateNested } from 'class-validator';

// estructura de cada ítem
export class CartItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}

// múltiples productos
export class AddMultipleProductsToCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  products: CartItemDto[];
}
