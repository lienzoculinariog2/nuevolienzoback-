import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRefundDto {
  @ApiProperty({
    description: 'Amount to refund (optional - if not provided, refunds the full amount)',
    example: 25.50,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  amount?: number;
}
