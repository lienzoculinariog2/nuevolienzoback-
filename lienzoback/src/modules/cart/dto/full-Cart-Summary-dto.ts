import { IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CartItemResponseDto } from './cart-item-response.dto';

export class FullCartSummaryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemResponseDto)
  items: CartItemResponseDto[];

  @IsNumber()
  totalItems: number;

  @IsNumber()
  subTotal: number;
}
