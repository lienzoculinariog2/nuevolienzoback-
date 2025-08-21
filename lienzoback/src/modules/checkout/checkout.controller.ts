import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutDto } from './dto/check-out.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post(':userId')
  async checkout(@Param('userId') userId: string, @Body() checkoutDto: CheckoutDto) {
    return this.checkoutService.checkout(userId, checkoutDto);
  }
}
