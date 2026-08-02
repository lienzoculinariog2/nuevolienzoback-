import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Req,
  HttpStatus,
  HttpException,
  Logger,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';
import { PaymentOrderService } from './payment-order.service';
import { PaymentManagementService } from './services/payment-management.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { OrdersService } from '../orders/orders.service';
import { RolesGuard } from '../common/guard/roles.guard';
import { HasRoles } from '../decorators/roles';
import { Roles } from '../users/entities/user.entity';
import type { RequestWithUser } from '../common/utils/request-with-user.interface';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentOrderService: PaymentOrderService,
    private readonly paymentManagementService: PaymentManagementService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('create-payment-intent')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a payment intent for Stripe' })
  @ApiBody({ type: CreatePaymentIntentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createPaymentIntent(
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @Req() req: RequestWithUser,
  ): Promise<PaymentResponseDto> {
    try {
      await this.assertOrderAccess(createPaymentIntentDto.orderId, req);
      return await this.paymentsService.createPaymentIntent(createPaymentIntentDto);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error creating payment intent: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error creating payment intent',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('order/:orderId/create-payment')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a payment intent for a specific order' })
  @ApiBody({ type: CreatePaymentIntentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully for order',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createPaymentForOrder(
    @Param('orderId') orderId: string,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
    @Req() req: RequestWithUser,
  ): Promise<PaymentResponseDto> {
    try {
      if (createPaymentIntentDto.orderId !== orderId) {
        throw new ForbiddenException('El ID de la orden no coincide con la ruta solicitada.');
      }
      await this.assertOrderAccess(orderId, req);
      return await this.paymentOrderService.createPaymentForOrder(orderId, createPaymentIntentDto);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error creating payment for order ${orderId}: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error creating payment for order',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('order/:orderId/payment-status')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get payment status for a specific order' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderPaymentStatus(@Param('orderId') orderId: string, @Req() req: RequestWithUser) {
    try {
      await this.assertOrderAccess(orderId, req);
      return await this.paymentOrderService.getOrderPaymentStatus(orderId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error getting payment status for order ${orderId}: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Error getting payment status',
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('order/:orderId/payment-history')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get complete payment history for a specific order' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderPaymentHistory(@Param('orderId') orderId: string, @Req() req: RequestWithUser) {
    try {
      await this.assertOrderAccess(orderId, req);
      const paymentHistory = await this.paymentManagementService.getOrderPaymentHistory(orderId);
      return {
        orderId,
        paymentHistory,
        totalPayments: paymentHistory.length,
        totalAmount: paymentHistory.reduce((sum, payment) => sum + payment.amount, 0),
        totalRefunded: paymentHistory.reduce((sum, payment) => sum + payment.refundedAmount, 0),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error getting payment history for order ${orderId}: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Error getting payment history',
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // 🛡️ SECURITY: Removed manual confirmation endpoint
  // Payment confirmation should only happen through Stripe webhooks
  // This prevents inconsistent states between frontend and webhook processing

  @Get(':paymentIntentId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Get payment intent details' })
  @ApiResponse({ status: 200, description: 'Payment intent retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment intent not found' })
  async getPaymentIntent(@Param('paymentIntentId') paymentIntentId: string) {
    try {
      const paymentIntent = await this.paymentsService.getPaymentIntent(paymentIntentId);
      return {
        status: 'success',
        paymentIntent,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error retrieving payment intent: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Payment intent not found',
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('cancel/:paymentIntentId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Cancel a payment intent' })
  @ApiResponse({ status: 200, description: 'Payment intent canceled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async cancelPaymentIntent(@Param('paymentIntentId') paymentIntentId: string) {
    try {
      const paymentIntent = await this.paymentsService.cancelPaymentIntent(paymentIntentId);
      return {
        status: 'success',
        paymentIntent,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error canceling payment intent: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error canceling payment intent',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('refund/:paymentIntentId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Create a refund for a payment' })
  @ApiBody({ type: CreateRefundDto })
  @ApiResponse({ status: 200, description: 'Refund created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async createRefund(
    @Param('paymentIntentId') paymentIntentId: string,
    @Body() createRefundDto: CreateRefundDto,
  ) {
    try {
      // 🛡️ SECURITY: Get payment from our database first
      const payment =
        await this.paymentManagementService.getPaymentByStripeIntentId(paymentIntentId);

      // Create refund in Stripe
      const stripeRefund = await this.paymentsService.createRefund(
        paymentIntentId,
        createRefundDto.amount,
      );

      // 🛡️ SECURITY: Create refund record in our database
      const refundRecord = await this.paymentManagementService.createRefundRecord(
        payment.id,
        stripeRefund,
        'requested_by_customer', // Default reason
      );

      return {
        status: 'success',
        refund: {
          id: refundRecord.id,
          amount: refundRecord.amount,
          currency: refundRecord.currency,
          status: refundRecord.status,
          stripeRefundId: refundRecord.stripeRefundId,
          reason: 'requested_by_customer',
          createdAt: refundRecord.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error creating refund: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error creating refund',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      if (!request.rawBody) {
        throw new Error('No raw body available');
      }

      const event = await this.paymentsService.handleWebhook(request.rawBody, signature);

      // 🛡️ Use the new payment management service for all webhook events
      await this.handleWebhookEvent(event);

      return { received: true };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Webhook error: ${error.message}`);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Webhook error',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
      case 'payment_intent.processing':
      case 'payment_intent.requires_action':
        await this.handlePaymentIntentEvent(event);
        break;
      case 'charge.refunded':
        this.handleRefundEvent(event);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentEvent(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    this.logger.log(`Processing payment intent event: ${event.type} for ${paymentIntent.id}`);

    try {
      await this.paymentManagementService.updatePaymentStatus(paymentIntent.id, event);
    } catch (error) {
      this.logger.error(`Error processing payment intent event: ${error.message}`);
    }
  }

  private handleRefundEvent(event: Stripe.Event): void {
    const charge = event.data.object as Stripe.Charge;
    this.logger.log(`Processing refund event for charge: ${charge.id}`);

    try {
      // Find the payment by charge ID and create refund record
      // This would need to be implemented based on your charge tracking
      this.logger.log(`Refund processed for charge: ${charge.id}`);
    } catch (error) {
      this.logger.error(`Error processing refund event: ${error.message}`);
    }
  }

  private async assertOrderAccess(orderId: string, req: RequestWithUser): Promise<void> {
    if (req.user.roles === Roles.ADMIN) {
      return;
    }

    const order = await this.ordersService.findOrderById(orderId);
    if (order.user.id !== req.user.sub) {
      throw new ForbiddenException('No tienes permiso para acceder a esta orden.');
    }
  }
}
