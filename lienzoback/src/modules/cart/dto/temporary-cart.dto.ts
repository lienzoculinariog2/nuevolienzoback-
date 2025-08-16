import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CartItemDto } from './add-multiple-products.dto';

export class TemporaryCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  products: CartItemDto[];
}
