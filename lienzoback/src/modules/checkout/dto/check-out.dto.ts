import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  shippingAddress: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  discountCode?: string;
}
