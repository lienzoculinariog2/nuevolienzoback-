import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Users } from '../users/entities/user.entity';
import { Orders, OrderStatus } from '../orders/entities/order.entity';
import { OrderDetail } from '../orders/entities/order-detail.entity';
import { Products } from '../products/entities/product.entity';
import { DiscountCodesUsed } from '../discount-codes/entities/discount-codes-used.entity';
import { DiscountCodes } from '../discount-codes/entities/discount-codes.entity';
import { CheckoutDto } from './dto/check-out.dto';
import { CartService } from '../cart/cart.service';
import { DiscountCodesService } from '../discount-codes/discount-codes.service';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
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
    private readonly discountCodesService: DiscountCodesService,
    private readonly dataSource: DataSource,
  ) {}

  async applyDiscount(
    userId: string,
    checkoutDto: CheckoutDto,
  ): Promise<{
    orderItems: any[];
    subTotal: number;
    finalTotal: number;
    discountAmount: number;
    discountCode?: string;
  }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const { orderItems, subTotal, finalTotal, discountCode } =
      await this.validateAndCalculateTotals(cart, checkoutDto, userId);

    const discountAmount = parseFloat((subTotal - finalTotal).toFixed(2));

    return {
      orderItems,
      subTotal,
      finalTotal,
      discountAmount,
      discountCode: discountCode?.code,
    };
  }

  async processCompleteCheckout(
    userId: string,
    checkoutDto: CheckoutDto,
  ): Promise<{
    orderId: string;
    order: Orders;
    message: string;
  }> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const { orderItems, finalTotal, discountCode } = await this.validateAndCalculateTotals(
      cart,
      checkoutDto,
      userId,
    );

    const order = await this.createOrder(userId, orderItems, finalTotal, discountCode);

    //await this.clearCart(cart.id);

    return {
      orderId: order.id,
      order,
      message: 'Checkout procesado exitosamente. Pre-orden creada.',
    };
  }

  private async validateAndCalculateTotals(
    cart: Cart,
    checkoutDto: CheckoutDto,
    userId: string,
  ): Promise<{
    orderItems: any[];
    subTotal: number;
    finalTotal: number;
    discountCode?: DiscountCodes;
  }> {
    let subTotal = 0;
    const orderItems: any[] = [];

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
    let discountCode: DiscountCodes | undefined = undefined;

    if (checkoutDto.discountCode) {
      discountCode = await this.validateDiscountCode(checkoutDto.discountCode, userId);
      if (discountCode) {
        const savings = subTotal * (discountCode.percentage / 100);
        finalTotal = subTotal - savings;
      }
    }

    return {
      orderItems,
      subTotal,
      finalTotal,
      discountCode,
    };
  }

  private async validateDiscountCode(discountCode: string, userId: string): Promise<DiscountCodes> {
    const discount = await this.discountCodesService.findOne(discountCode);
    if (!discount) {
      throw new NotFoundException('Código de descuento no válido');
    }
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

  private async createOrder(
    userId: string,
    orderItems: any[],
    finalTotal: number,
    discountCode?: DiscountCodes,
  ): Promise<Orders> {
    return this.dataSource.transaction(async (manager) => {
      const order = this.ordersRepository.create({
        userId: userId,
        status: OrderStatus.PENDING,
        date: new Date(),
        totalAmount: finalTotal,
        isPaid: false,
        paymentStatus: 'pending',
      });
      const savedOrder = await manager.save(Orders, order);
      const orderDetails = orderItems.map((item) =>
        this.orderDetailRepository.create({
          orderId: savedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
        }),
      );
      await manager.save(OrderDetail, orderDetails);
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

  // private async clearCart(cartId: string): Promise<void> {
  //   await this.cartItemRepository.delete({ cart: { id: cartId } });
  //   await this.cartRepository.update(cartId, { isActive: false });
  // }
}
