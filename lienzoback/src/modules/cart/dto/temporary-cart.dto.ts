import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { AddToCartDto } from './addTo-cart.dto';

export class TemporaryCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddToCartDto)
  products: AddToCartDto[];
}
