import { Module } from '@nestjs/common';
import { DiscountCodesService } from './discount-codes.service';
import { DiscountCodesController } from './discount-codes.controller';

@Module({
  controllers: [DiscountCodesController],
  providers: [DiscountCodesService],
})
export class DiscountCodesModule {}
