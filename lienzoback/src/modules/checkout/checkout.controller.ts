import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckoutIntegrationService } from './services/checkout-integration.service';
import { CheckoutDto } from './dto/check-out.dto';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutIntegrationService: CheckoutIntegrationService) {}

  @Post(':userId/validate')
  @ApiOperation({ summary: 'Validar checkout (solo validación y cálculo, sin crear orden)' })
  @ApiResponse({ status: 200, description: 'Validación de checkout exitosa' })
  // eslint-disable-next-line @typescript-eslint/require-await
  async validateCheckout(@Param('userId') userId: string, @Body() checkoutDto: CheckoutDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.checkoutIntegrationService.validateCheckout(userId, checkoutDto);
  }

  @Post(':userId/complete')
  @ApiOperation({ summary: 'Procesa el checkout completo y crea la orden' })
  @ApiResponse({
    status: 200,
    description: 'Checkout completo procesado exitosamente, la orden ha sido creada.',
  })
  // eslint-disable-next-line @typescript-eslint/require-await
  async completeCheckout(@Param('userId') userId: string, @Body() checkoutDto: CheckoutDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.checkoutIntegrationService.processCompleteCheckout(userId, checkoutDto);
  }

  @Get(':userId/diagnose')
  @ApiOperation({ summary: 'Diagnosticar carrito del usuario' })
  @ApiResponse({ status: 200, description: 'Diagnóstico del carrito completado' })
  // eslint-disable-next-line @typescript-eslint/require-await
  async diagnoseCart(@Param('userId') userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.checkoutIntegrationService.diagnoseCart(userId);
  }
}
