import { IsString, IsOptional, IsEmail, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ 
    description: 'Order ID (amount will be calculated server-side for security)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @Length(1, 255, { message: 'Order ID must be between 1 and 255 characters' })
  orderId: string;

  @ApiProperty({ 
    description: 'Customer email for receipt (optional)',
    example: 'customer@example.com',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  customerEmail?: string;

  @ApiProperty({ 
    description: 'Payment description (optional)',
    example: 'Payment for order #12345',
    required: false
  })
  @IsOptional()
  @IsString()
  @Length(1, 500, { message: 'Description must be between 1 and 500 characters' })
  description?: string;

  @ApiProperty({ 
    description: 'Idempotency key to prevent duplicate payments (optional)',
    example: 'unique-key-12345',
    required: false
  })
  @IsOptional()
  @IsString()
  @Length(1, 255, { message: 'Idempotency key must be between 1 and 255 characters' })
  idempotencyKey?: string;
}

export class CreatePaymentForOrderDto {
  @ApiProperty({ 
    description: 'Customer email for receipt (optional)',
    example: 'customer@example.com',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  customerEmail?: string;

  @ApiProperty({ 
    description: 'Payment description (optional)',
    example: 'Payment for order #12345',
    required: false
  })
  @IsOptional()
  @IsString()
  @Length(1, 500, { message: 'Description must be between 1 and 500 characters' })
  description?: string;

  @ApiProperty({ 
    description: 'Idempotency key to prevent duplicate payments (optional)',
    example: 'unique-key-12345',
    required: false
  })
  @IsOptional()
  @IsString()
  @Length(1, 255, { message: 'Idempotency key must be between 1 and 255 characters' })
  idempotencyKey?: string;
}
