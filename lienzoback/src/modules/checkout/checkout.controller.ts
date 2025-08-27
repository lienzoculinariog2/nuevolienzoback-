import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { CheckoutDto } from './dto/check-out.dto';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post(':userId/applydiscount')
  @ApiOperation({ summary: 'Aplica un código de descuento y retorna el resumen del carrito' })
  @ApiResponse({ status: 200, description: 'Descuento aplicado y resumen del carrito retornado.' })
  @ApiResponse({
    status: 400,
    description: 'El carrito está vacío o el código de descuento no es válido.',
  })
  async applyDiscount(@Param('userId') userId: string, @Body() checkoutDto: CheckoutDto) {
    return this.checkoutService.applyDiscount(userId, checkoutDto);
  }

  @Post(':userId/complete')
  @ApiOperation({ summary: 'Procesa el checkout completo y crea la orden' })
  @ApiResponse({
    status: 200,
    description: 'Checkout completo procesado exitosamente, la orden ha sido creada.',
  })
  async completeCheckout(@Param('userId') userId: string, @Body() checkoutDto: CheckoutDto) {
    return this.checkoutService.processCompleteCheckout(userId, checkoutDto);
  }
}
