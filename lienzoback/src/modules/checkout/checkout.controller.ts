import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CheckoutService } from './checkout.service';
import { CheckoutIntegrationService } from './services/checkout-integration.service';
import { CheckoutDto } from './dto/check-out.dto';
import type { RequestWithUser } from '../common/utils/request-with-user.interface';
import { RolesGuard } from '../common/guard/roles.guard';
import { HasRoles } from '../decorators/roles';
import { Roles } from '../users/entities/user.entity';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly checkoutIntegrationService: CheckoutIntegrationService,
  ) {}

  @Post(':userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Procesar checkout básico (solo validación)' })
  @ApiResponse({ status: 200, description: 'Checkout procesado exitosamente' })
  async checkout(
    @Param('userId') userId: string,
    @Body() checkoutDto: CheckoutDto,
    @Req() req: RequestWithUser,
  ) {
    this.assertUserAccess(userId, req);
    return this.checkoutService.checkout(userId, checkoutDto);
  }

  @Post(':userId/complete')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Procesar checkout completo con integración de pago' })
  @ApiResponse({ status: 200, description: 'Checkout completo procesado exitosamente' })
  async completeCheckout(
    @Param('userId') userId: string,
    @Body() checkoutDto: CheckoutDto,
    @Req() req: RequestWithUser,
  ) {
    this.assertUserAccess(userId, req);
    return this.checkoutIntegrationService.processCompleteCheckout(userId, checkoutDto);
  }

  @Post('payment-success/:orderId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Procesar pago exitoso (actualizar stock, vaciar carrito)' })
  @ApiResponse({ status: 200, description: 'Pago procesado exitosamente' })
  async processSuccessfulPayment(@Param('orderId') orderId: string) {
    await this.checkoutIntegrationService.processSuccessfulPayment(orderId);
    return { message: 'Pago procesado exitosamente' };
  }

  @Get('diagnose/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Diagnosticar carrito del usuario (solo lectura)' })
  @ApiResponse({ status: 200, description: 'Diagnóstico completado' })
  async diagnoseCart(@Param('userId') userId: string, @Req() req: RequestWithUser) {
    this.assertUserAccess(userId, req);
    return this.checkoutService.diagnoseCart(userId);
  }

  private assertUserAccess(userId: string, req: RequestWithUser): void {
    if (req.user.roles !== Roles.ADMIN && req.user.sub !== userId) {
      throw new ForbiddenException('No tienes permiso para acceder a los datos de este usuario.');
    }
  }
}
