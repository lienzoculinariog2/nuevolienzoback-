// src/cart/dto/cart-item-response.dto.ts
import { IsUUID, IsNumber, IsString, IsOptional } from 'class-validator';

export class CartItemResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional() // Hacemos la propiedad opcional
  imgUrl?: string; // Usamos '?' para indicar que puede ser undefined

  @IsNumber()
  totalItemPrice: number;
}
