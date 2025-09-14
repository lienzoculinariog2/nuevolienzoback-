import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckoutIntegrationService } from './services/checkout-integration.service';
import { CheckoutDto } from './dto/check-out.dto';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutIntegrationService: CheckoutIntegrationService) {}

  @Post(':userId/complete')
  @ApiOperation({ summary: 'Procesar checkout completo con integración de pago' })
  @ApiResponse({ status: 200, description: 'Checkout completo procesado exitosamente' })
  async completeCheckout(@Param('userId') userId: string, @Body() checkoutDto: CheckoutDto) {
    return this.checkoutIntegrationService.processCompleteCheckout(userId, checkoutDto);
  }
}
