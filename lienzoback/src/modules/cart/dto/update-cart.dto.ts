// src/cart/dto/update-cart.dto.ts
import { Type } from 'class-transformer';
import { IsUUID, IsNumber, IsPositive, IsArray, ValidateNested } from 'class-validator';

export class UpdateCartItemDto {
  @IsUUID()
  itemId: string;

  @IsNumber()
  quantity: number;
}

export class UpdateCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCartItemDto)
  updates: UpdateCartItemDto[];
}
