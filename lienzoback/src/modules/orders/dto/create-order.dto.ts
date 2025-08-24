import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para representar un ítem individual dentro de una orden.
 *  */
export class OrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsUrl()
  imgUrl?: string | null;
}

/**
 * DTO principal para la creación de una nueva orden.
 * En el flujo de "checkout", los items se obtienen del carrito y se mapean a OrderItemDto.
 */
export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty()
  items: OrderItemDto[];

  @IsString()
  @IsOptional()
  discountCode?: string;
}
