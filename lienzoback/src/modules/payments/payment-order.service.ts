import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Orders, OrderStatus } from '../orders/entities/order.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { OrderDetail } from '../orders/entities/order-detail.entity';
import { Products } from '../products/entities/product.entity';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto, CreatePaymentForOrderDto } from './dto/create-payment-intent.dto';
import { CartService } from '../cart/cart.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentOrderService {
  handlePaymentFailure(id: string) {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(PaymentOrderService.name);

  constructor(
    @InjectRepository(Orders)
    private readonly ordersRepository: Repository<Orders>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createPaymentForOrder(orderId: string, createPaymentForOrderDto: CreatePaymentForOrderDto) {
    try {
      // Verify the order exists
      const order = await this.ordersRepository.findOne({ where: { id: orderId } });
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      // Create payment intent with orderId from parameter
      const createPaymentIntentDto: CreatePaymentIntentDto = {
        orderId,
        customerEmail: createPaymentForOrderDto.customerEmail,
        description: createPaymentForOrderDto.description,
        idempotencyKey: createPaymentForOrderDto.idempotencyKey,
      };

      const paymentResponse =
        await this.paymentsService.createPaymentIntent(createPaymentIntentDto);

      // Create payment record
      const payment = this.paymentRepository.create({
        orderId,
        stripePaymentIntentId: paymentResponse.paymentIntentId,
        amount: order.totalAmount,
        customerEmail: createPaymentForOrderDto.customerEmail,
        description: createPaymentForOrderDto.description,
        idempotencyKey: createPaymentForOrderDto.idempotencyKey,
        status: PaymentStatus.PENDING,
      });

      await this.paymentRepository.save(payment);

      this.logger.log(
        `Payment intent created for order ${orderId}: ${paymentResponse.paymentIntentId}`,
      );

      return paymentResponse;
    } catch (error) {
      this.logger.error(`Error creating payment for order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  async handlePaymentSuccess(paymentIntentId: string) {
    try {
      this.logger.log(`🔍 ===== MANEJANDO PAGO EXITOSO =====`);
      this.logger.log(`📋 Payment Intent ID: ${paymentIntentId}`);

      // Find payment by payment intent ID
      this.logger.log('🔍 Buscando pago en la base de datos...');
      const payment = await this.paymentRepository.findOne({
        where: { stripePaymentIntentId: paymentIntentId },
        relations: ['order'],
      });

      if (!payment) {
        this.logger.warn(`⚠️ No payment found for payment intent: ${paymentIntentId}`);
        return;
      }

      this.logger.log(`✅ Pago encontrado: ID ${payment.id}, Order ID: ${payment.orderId}`);

      // Update payment status
      this.logger.log('🔄 Actualizando estado del pago...');
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.SUCCEEDED,
        processedAt: new Date(),
      });
      this.logger.log('✅ Estado del pago actualizado');

      // Update order status
      this.logger.log('🔄 Actualizando estado de la orden...');
      await this.ordersRepository.update(payment.orderId, {
        status: OrderStatus.PENDING,
        isPaid: true,
      });
      this.logger.log('✅ Estado de la orden actualizado');

      // Update product stock
      this.logger.log('🔄 Actualizando stock de productos...');
      await this.updateProductStock(payment.orderId);
      this.logger.log('✅ Stock de productos actualizado');

      // Clear and remove the user's cart after successful payment
      try {
        this.logger.log(`🔄 Limpiando y eliminando carrito para usuario: ${payment.order.userId}`);
        // Llama al servicio del carrito para eliminarlo
        await this.cartService.clearCart(payment.order.userId);
        this.logger.log(
          `✅ Carrito limpiado y eliminado para usuario ${payment.order.userId} después del pago exitoso`,
        );
      } catch (cartError) {
        this.logger.error(
          `❌ ERROR CRÍTICO: Failed to clear and remove cart for user ${payment.order.userId}: ${cartError.message}`,
        );
        this.logger.error(`❌ Error stack: ${cartError.stack}`);
        // No lanzar el error aquí para no afectar el proceso, pero registrarlo
      }

      // Send purchase confirmation email
      try {
        this.logger.log(
          `🔄 Enviando correo de confirmación de compra a: ${payment.order.user.email}`,
        );
        await this.notificationsService.sendPurchaseConfirmation(payment.order);
        this.logger.log(
          `✅ Correo de confirmación de compra enviado a ${payment.order.user.email}`,
        );
      } catch (emailError) {
        this.logger.error(
          `❌ ERROR al enviar correo de confirmación de compra a ${payment.order.user.email}: ${emailError.message}`,
        );
      }

      this.logger.log(`✅ ===== PAGO EXITOSO COMPLETADO =====`);
      this.logger.log(
        `📋 Orden ${payment.orderId} marcada como pagada, stock actualizado, carrito eliminado y correo de confirmación enviado`,
      );
    } catch (error) {
      this.logger.error(`❌ Error handling payment success: ${error.message}`);
      this.logger.error(`❌ Error stack: ${error.stack}`);
      throw error;
    }
  }

  async handlePaymentFailure(paymentIntentId: string) {
    try {
      this.logger.log('❌ ===== MANEJANDO FALLO DE PAGO =====');
      this.logger.log(`📋 Payment Intent ID: ${paymentIntentId}`);

      // Find payment by payment intent ID
      const payment = await this.paymentRepository.findOne({
        where: { stripePaymentIntentId: paymentIntentId },
        relations: ['order'],
      });

      if (!payment) {
        this.logger.warn(`⚠️ No payment found for payment intent: ${paymentIntentId}`);
        return;
      }

      this.logger.log(`✅ Pago encontrado: ID ${payment.id}, Order ID: ${payment.orderId}`);

      // Update payment status
      this.logger.log('🔄 Actualizando estado del pago a FAILED...');
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
        processedAt: new Date(),
      });
      this.logger.log('✅ Estado del pago actualizado a FAILED');

      // Update order status
      this.logger.log('🔄 Actualizando estado de la orden a FAILED...');
      await this.ordersRepository.update(payment.orderId, {
        status: OrderStatus.FAILED,
      });
      this.logger.log('✅ Estado de la orden actualizado a FAILED');

      // NOTA: No necesitamos restaurar stock porque nunca se descuenta hasta que el pago sea exitoso
      this.logger.log('ℹ️ No es necesario restaurar stock - nunca se descuento');

      this.logger.log(`✅ ===== FALLO DE PAGO MANEJADO EXITOSAMENTE =====`);
      this.logger.log(`📋 Order ${payment.orderId} marcada como fallida`);
    } catch (error) {
      this.logger.error(`❌ Error handling payment failure: ${error.message}`);
      this.logger.error(`❌ Error stack: ${error.stack}`);
      throw error;
    }
  }

  async getOrderPaymentStatus(orderId: string) {
    try {
      const order = await this.ordersRepository.findOne({ where: { id: orderId } });
      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      // Get the latest payment for this order
      const payment = await this.paymentRepository.findOne({
        where: { orderId },
        order: { createdAt: 'DESC' },
      });

      if (!payment) {
        return {
          orderId,
          hasPaymentIntent: false,
          paymentStatus: null,
        };
      }

      // Get payment intent details from Stripe
      const paymentIntent = await this.paymentsService.getPaymentIntent(
        payment.stripePaymentIntentId,
      );

      return {
        orderId,
        hasPaymentIntent: true,
        paymentIntentId: payment.stripePaymentIntentId,
        paymentStatus: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert cents to dollars
        currency: paymentIntent.currency,
        isPaid: payment.status === PaymentStatus.SUCCEEDED,
        orderStatus: order.status,
      };
    } catch (error) {
      this.logger.error(`Error getting payment status for order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update product stock after successful payment
   * IMPORTANTE: Este es el ÚNICO lugar donde se debe descontar el stock
   * para evitar descuentos dobles. El stock NO se descuenta durante la creación de la orden.
   */
  private async updateProductStock(orderId: string): Promise<void> {
    try {
      this.logger.log('📦 ===== ACTUALIZANDO STOCK DE PRODUCTOS =====');
      this.logger.log(`📋 Order ID: ${orderId}`);

      // Get order details with products
      this.logger.log('🔍 Obteniendo detalles de la orden...');
      const orderDetails = await this.orderDetailRepository.find({
        where: { order: { id: orderId } },
        relations: ['product'],
      });

      this.logger.log(`📦 Encontrados ${orderDetails.length} items en la orden`);

      if (orderDetails.length === 0) {
        this.logger.warn(
          `⚠️ ADVERTENCIA: No se encontraron order details para la orden ${orderId}`,
        );
        return;
      }

      for (const detail of orderDetails) {
        this.logger.log(
          `🔍 Procesando item: Product ID ${detail.product?.id}, Quantity: ${detail.quantity}`,
        );

        if (!detail.product) {
          this.logger.error(`❌ ERROR: Item sin producto asociado en order detail ${detail.id}`);
          continue;
        }

        const product = await this.productsRepository.findOneBy({ id: detail.product.id });
        if (!product) {
          this.logger.error(`❌ ERROR: Producto con ID ${detail.product.id} no encontrado`);
          continue;
        }

        this.logger.log(`📦 Producto: ${product.name}`);
        this.logger.log(`📊 Stock actual: ${product.stock}`);
        this.logger.log(`📉 Cantidad a descontar: ${detail.quantity}`);

        // Validate stock before decreasing
        if (product.stock < detail.quantity) {
          this.logger.error(
            `❌ ERROR: Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Necesario: ${detail.quantity}`,
          );
          continue;
        }

        // Decrease stock
        const newStock = product.stock - detail.quantity;
        product.stock = newStock;

        this.logger.log(`📊 Nuevo stock: ${newStock}`);

        // Deactivate product if stock reaches 0
        if (product.stock <= 0) {
          product.isActive = false;
          this.logger.log(`⚠️ Producto ${product.name} desactivado por stock agotado`);
        }

        await this.productsRepository.save(product);
        this.logger.log(
          `✅ Stock actualizado para producto ${product.name}: -${detail.quantity} (nuevo stock: ${product.stock})`,
        );
      }

      this.logger.log('✅ ===== STOCK DE PRODUCTOS ACTUALIZADO EXITOSAMENTE =====');
    } catch (error) {
      this.logger.error(`❌ ERROR en updateProductStock: ${error.message}`);
      this.logger.error(`❌ Error stack: ${error.stack}`);
      throw error;
    }
  }
}
