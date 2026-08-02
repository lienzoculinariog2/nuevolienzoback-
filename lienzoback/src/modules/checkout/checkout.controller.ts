import { Controller, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CheckoutIntegrationService } from './services/checkout-integration.service';
import { CheckoutDto } from './dto/check-out.dto';
import type { RequestWithUser } from '../common/utils/request-with-user.interface';
import { Roles } from '../users/entities/user.entity';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutIntegrationService: CheckoutIntegrationService) {}

  @Post(':userId/complete')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Procesar checkout completo con integración de pago' })
  @ApiResponse({ status: 200, description: 'Checkout completo procesado exitosamente' })
  async completeCheckout(
    @Param('userId') userId: string,
    @Body() checkoutDto: CheckoutDto,
    @Req() req: RequestWithUser,
  ) {
    if (req.user.roles !== Roles.ADMIN && req.user.sub !== userId) {
      throw new ForbiddenException('No tienes permiso para completar el checkout de este usuario.');
    }
    return this.checkoutIntegrationService.processCompleteCheckout(userId, checkoutDto);
  }
}
