import { PartialType } from '@nestjs/swagger';
import { AddToCartDto } from './addTo-cart.dto';

export class UpdateCartDto extends PartialType(AddToCartDto) {}
