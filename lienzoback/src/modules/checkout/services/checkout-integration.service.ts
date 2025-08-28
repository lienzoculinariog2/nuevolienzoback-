import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart } from '../../cart/entities/cart.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { Users } from '../../users/entities/user.entity';
import { Orders, OrderStatus } from '../../orders/entities/order.entity';
import { OrderDetail } from '../../orders/entities/order-detail.entity';
import { Products } from '../../products/entities/product.entity';
import { DiscountCodesUsed } from '../../discount-codes/entities/discount-codes-used.entity';
import { DiscountCodes } from '../../discount-codes/entities/discount-codes.entity';
import { CheckoutDto } from '../dto/check-out.dto';
import { CartService } from '../../cart/cart.service';
import { DiscountCodesService } from '../../discount-codes/discount-codes.service';
import { PaymentsService } from '../../payments/payments.service';
import { CreatePaymentIntentDto } from '../../payments/dto/create-payment-intent.dto';

@Injectable()
export class CheckoutIntegrationService {
  private readonly logger = new Logger(CheckoutIntegrationService.name);

  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Orders)
    private ordersRepository: Repository<Orders>,
    @InjectRepository(OrderDetail)
    private orderDetailRepository: Repository<OrderDetail>,
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
    @InjectRepository(DiscountCodesUsed)
    private discountCodesUsedRepository: Repository<DiscountCodesUsed>,
    @InjectRepository(DiscountCodes)
    private discountCodesRepository: Repository<DiscountCodes>,
    private readonly cartService: CartService,
    private readonly discountCodesService: DiscountCodesService,
    private readonly paymentsService: PaymentsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Flujo completo de checkout: validación → creación de orden → payment intent
   */
  async processCompleteCheckout(
    userId: string,
    checkoutDto: CheckoutDto,
  ): Promise<{
    orderId: string;
    paymentIntent: any;
    message: string;
  }> {
    this.logger.log(`Iniciando checkout completo para usuario: ${userId}`);

    try {
      // 1. Validar usuario
      const user = await this.usersRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // 2. Validar carrito
      const cart = await this.cartRepository.findOne({
        where: { user: { id: userId } },
        relations: ['items', 'items.product'],
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('El carrito está vacío');
      }

      // 3. Validar stock y calcular totales
      const { orderItems, subTotal, finalTotal, appliedDiscountCode } =
        await this.validateCartAndCalculateTotals(cart, checkoutDto);

      // 4. Validar código de descuento si se proporciona
      let discountCode: DiscountCodes | undefined = undefined;
      if (checkoutDto.discountCode) {
        discountCode = await this.validateDiscountCode(checkoutDto.discountCode, userId);
      }

      // 5. Crear la orden
      const order = await this.createOrder(
        userId,
        orderItems,
        subTotal,
        finalTotal,
        checkoutDto.shippingAddress,
        discountCode,
      );

      // NOTA: El carrito se limpia cuando el pago sea exitoso, no aquí
      // para evitar problemas si el pago falla

      // 6. Crear payment intent
      const paymentIntentDto: CreatePaymentIntentDto = {
        orderId: order.id,
        customerEmail: user.email,
        description: `Pago para orden #${order.id}`,
      };

      const paymentIntent = await this.paymentsService.createPaymentIntent(paymentIntentDto);

      this.logger.log(
        `Checkout completado exitosamente. Orden: ${order.id}, Payment Intent: ${paymentIntent.paymentIntentId}`,
      );

      return {
        orderId: order.id,
        paymentIntent,
        message: 'Checkout procesado exitosamente. Procede con el pago.',
      };
    } catch (error) {
      this.logger.error(`Error en checkout completo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Diagnosticar carrito del usuario (solo lectura, no modifica datos)
   */
  async diagnoseCart(userId: string) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      return {
        status: 'no_cart',
        message: 'El usuario no tiene carrito',
        issues: []
      };
    }

    if (cart.items.length === 0) {
      return {
        status: 'empty_cart',
        message: 'El carrito está vacío',
        issues: []
      };
    }

    const issues: string[] = [];
    const validItems: Array<{
      id: string;
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }> = [];
    const invalidItems: Array<{
      id: string;
      productId?: string;
      issue: string;
    }> = [];

    for (const item of cart.items) {
      if (!item.product || !item.product.id) {
        issues.push(`Item del carrito ${item.id} no tiene producto asociado`);
        invalidItems.push({
          id: item.id,
          issue: 'no_product'
        });
      } else {
        const product = await this.productsRepository.findOneBy({ id: item.product.id });
        if (!product) {
          issues.push(`Producto ${item.product.id} no encontrado en la base de datos`);
          invalidItems.push({
            id: item.id,
            productId: item.product.id,
            issue: 'product_not_found'
          });
        } else {
          validItems.push({
            id: item.id,
            productId: item.product.id,
            productName: product.name,
            quantity: item.quantity,
            price: product.price
          });
        }
      }
    }

    return {
      status: issues.length > 0 ? 'has_issues' : 'healthy',
      message: issues.length > 0 ? 'El carrito tiene problemas' : 'El carrito está saludable',
      totalItems: cart.items.length,
      validItemsCount: validItems.length,
      invalidItemsCount: invalidItems.length,
      issues,
      validItems,
      invalidItems
    };
  }

  /**
   * Validar carrito y calcular totales (sin crear orden)
   */
  async validateCheckout(userId: string, checkoutDto: CheckoutDto) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    // Validar stock y calcular totales
    const { orderItems, subTotal, finalTotal, appliedDiscountCode } = 
      await this.validateCartAndCalculateTotals(cart, checkoutDto);

    let savings = 0;
    let discountPercentage: number | undefined = undefined;

    // Calcular ahorros si hay descuento
    if (checkoutDto.discountCode) {
      const discount = await this.discountCodesService.findOne(checkoutDto.discountCode);
      if (discount) {
        savings = subTotal * (discount.percentage / 100);
        discountPercentage = discount.percentage;
      }
    }

    return {
      message: 'Validación de checkout exitosa',
      subTotal: subTotal,
      savings: savings,
      discountPercentage: discountPercentage ? `${discountPercentage}%` : undefined,
      finalTotal: finalTotal,
      orderItems: orderItems,
      appliedDiscountCode,
    };
  }

  /**
   * Validar carrito y calcular totales
   */
  private async validateCartAndCalculateTotals(
    cart: Cart,
    checkoutDto: CheckoutDto,
  ): Promise<{
    orderItems: any[];
    subTotal: number;
    finalTotal: number;
    appliedDiscountCode?: string;
  }> {
    let subTotal = 0;
    const orderItems: any[] = [];

    // Validar stock y calcular subtotal
    for (const item of cart.items) {
      const product = await this.productsRepository.findOneBy({ id: item.product.id });
      if (!product) {
        throw new NotFoundException(`Producto ${item.product.id} no encontrado`);
      }

      if (product.stock === 0) {
        throw new BadRequestException(`El producto ${product.name} está agotado`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`,
        );
      }

      const itemTotal = item.quantity * product.price;
      subTotal += itemTotal;

      orderItems.push({
        productId: item.product.id,
        quantity: item.quantity,
        price: product.price,
        imgUrl: product.imgUrl,
      });
    }

    let finalTotal = subTotal;
    let appliedDiscountCode: string | undefined = undefined;

    // Aplicar descuento si existe
    if (checkoutDto.discountCode) {
      const discount = await this.discountCodesService.findOne(checkoutDto.discountCode);
      if (discount) {
        const savings = subTotal * (discount.percentage / 100);
        finalTotal = subTotal - savings;
        appliedDiscountCode = discount.code;
      }
    }

    return {
      orderItems,
      subTotal,
      finalTotal,
      appliedDiscountCode,
    };
  }

  /**
   * Validar código de descuento
   */
  private async validateDiscountCode(discountCode: string, userId: string): Promise<DiscountCodes> {
    const discount = await this.discountCodesService.findOne(discountCode);
    if (!discount) {
      throw new NotFoundException('Código de descuento no válido');
    }

    // Verificar si ya fue usado por este usuario
    if (discount.isSingleUsePerUser) {
      const usedCode = await this.discountCodesUsedRepository.findOne({
        where: {
          discountCode: { id: discount.id },
          user: { id: userId },
        },
      });
      if (usedCode) {
        throw new BadRequestException('Este código de descuento ya ha sido usado por este usuario');
      }
    }

    return discount;
  }

  /**
   * Crear orden
   */
  private async createOrder(
    userId: string,
    orderItems: any[],
    subTotal: number,
    finalTotal: number,
    shippingAddress: string,
    discountCode?: DiscountCodes,
  ): Promise<Orders> {
    return this.dataSource.transaction(async (manager) => {
      // Crear la orden
      const order = this.ordersRepository.create({
        user: { id: userId },
        totalAmount: finalTotal,
        status: OrderStatus.PENDING,
        shippingAddress,
        date: new Date(),
      });

      const savedOrder = await manager.save(Orders, order);

      // Crear detalles de la orden
      const orderDetails = orderItems.map((item) =>
        this.orderDetailRepository.create({
          order: savedOrder,
          product: { id: item.productId },
          quantity: item.quantity,
          unitPrice: item.price,
        }),
      );

      await manager.save(OrderDetail, orderDetails);

      // NOTA: El stock se descuenta cuando el pago sea exitoso, no aquí
      // para evitar descuentos dobles. Ver payment-order.service.ts

      // Marcar código de descuento como usado si existe
      if (discountCode) {
        const discountUsed = this.discountCodesUsedRepository.create({
          discountCode: { id: discountCode.id },
          user: { id: userId },
          order: savedOrder,
          usedAt: new Date(),
        });
        await manager.save(DiscountCodesUsed, discountUsed);
      }

      return savedOrder;
    });
  }
}
