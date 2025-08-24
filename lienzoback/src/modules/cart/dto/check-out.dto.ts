// src/cart/dto/checkout.dto.ts
import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @IsObject()
  paymentInfo: any; // FALTA ESPECIFICAR LO DEL PAGO
}
