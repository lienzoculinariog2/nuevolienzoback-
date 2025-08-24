import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CheckoutIntegrationService } from './services/checkout-integration.service';
import { CheckoutDto } from './dto/check-out.dto';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly checkoutIntegrationService: CheckoutIntegrationService,
  ) {}

  // 🚫 DESHABILITADO: Checkout básico (no necesario para flujo de compra)
  // @Post(':userId')
  // @ApiOperation({ summary: 'Procesar checkout básico (solo validación)' })
  // @ApiResponse({ status: 200, description: 'Checkout procesado exitosamente' })
  // async checkout(@Param('userId') userId: string, @Body() checkoutDto: CheckoutDto) {
  //   return this.checkoutService.checkout(userId, checkoutDto);
  // }

  @Post(':userId/complete')
  @ApiOperation({ summary: 'Procesar checkout completo con integración de pago' })
  @ApiResponse({ status: 200, description: 'Checkout completo procesado exitosamente' })
  async completeCheckout(@Param('userId') userId: string, @Body() checkoutDto: CheckoutDto) {
    return this.checkoutIntegrationService.processCompleteCheckout(userId, checkoutDto);
  }

  @Post('payment-success/:orderId')
  @ApiOperation({ summary: 'Procesar pago exitoso (actualizar stock, vaciar carrito)' })
  @ApiResponse({ status: 200, description: 'Pago procesado exitosamente' })
  async processSuccessfulPayment(@Param('orderId') orderId: string) {
    await this.checkoutIntegrationService.processSuccessfulPayment(orderId);
    return { message: 'Pago procesado exitosamente' };
  }

  // 🚫 DESHABILITADO: Diagnóstico de carrito (solo para debugging)
  // @Get('diagnose/:userId')
  // @ApiOperation({ summary: 'Diagnosticar carrito del usuario (solo lectura)' })
  // @ApiResponse({ status: 200, description: 'Diagnóstico completado' })
  // async diagnoseCart(@Param('userId') userId: string) {
  //   return this.checkoutService.diagnoseCart(userId);
  // }
}
