import { Module } from '@nestjs/common';
import { DiscountCodesService } from './discount-codes.service';
import { DiscountCodesController } from './discount-codes.controller';
import { DiscountCodes } from './entities/discount-codes.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountCodesUsed } from './entities/discount-codes-used.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DiscountCodes, DiscountCodesUsed])],
  providers: [DiscountCodesService],
  controllers: [DiscountCodesController],
  exports: [DiscountCodesService],
})
export class DiscountCodesModule {}
