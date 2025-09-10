import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Client secret for frontend payment confirmation',
    example: 'pi_3OqX8X2eZvKYlo2C1gQZvKYl_secret_1234567890abcdef',
  })
  clientSecret: string;

  @ApiProperty({
    description: 'Payment intent ID',
    example: 'pi_3OqX8X2eZvKYlo2C1gQZvKYl',
  })
  paymentIntentId: string;

  @ApiProperty({
    description: 'Payment amount in dollars',
    example: 25.5,
    minimum: 0.01,
  })
  amount: number;

  @ApiProperty({
    description: 'Payment currency',
    example: 'usd',
  })
  currency: string;

  @ApiProperty({
    description: 'Payment status',
    example: 'requires_payment_method',
  })
  status: string;

  @ApiProperty({
    description: 'Order ID associated with this payment',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orderId: string;

  @ApiProperty({
    description: 'Payment description',
    example: 'Payment for order #12345',
    required: false,
  })
  description?: string;
}
