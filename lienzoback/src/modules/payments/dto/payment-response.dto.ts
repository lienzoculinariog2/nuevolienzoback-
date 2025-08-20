import { IsString, IsNumber } from 'class-validator';

export class PaymentResponseDto {
  @IsString()
  clientSecret: string;

  @IsString()
  paymentIntentId: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  status: string;
}
