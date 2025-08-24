import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Orders, OrderStatus } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Products } from '../products/entities/product.entity';
import { DiscountCodesUsed } from '../discount-codes/entities/discount-codes-used.entity';
import { Users } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { DiscountCodes } from '../discount-codes/entities/discount-codes.entity';
import { DiscountCodesService } from '../discount-codes/discount-codes.service';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Orders)
    private ordersRepository: Repository<Orders>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(OrderDetail)
    private orderDetailRepository: Repository<OrderDetail>,
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
    @InjectRepository(DiscountCodesUsed)
    private discountCodesUsedRepository: Repository<DiscountCodesUsed>,
    @InjectRepository(DiscountCodes)
    private discountCodesRepository: Repository<DiscountCodes>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private discountCodesService: DiscountCodesService,
    private dataSource: DataSource,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto): Promise<Orders> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const user = await manager.findOne(Users, { where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      let finalTotal = 0;
      const items = createOrderDto.items;
      let discount: DiscountCodes | null = null;

      if (createOrderDto.discountCode) {
        discount = await this.discountCodesService.findOne(createOrderDto.discountCode);
        if (discount && discount.isSingleUsePerUser) {
          const usedCode = await manager.findOne(DiscountCodesUsed, {
            where: {
              discountCode: { id: discount.id },
              user: { id: userId },
            },
          });
          if (usedCode) {
            throw new BadRequestException('This discount code has already been used.');
          }
        }
      }
      const productValidations = new Map<string, Products>();
      for (const itemDto of items) {
        const product = await manager.findOneBy(Products, { id: itemDto.productId });
        if (!product) {
          throw new NotFoundException(`Product with id ${itemDto.productId} not found`);
        }
        if (product.stock === 0) {
          throw new BadRequestException(`Product ${product.name} run out stock`);
        }
        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${product.name}`);
        }

        productValidations.set(itemDto.productId, product);
        finalTotal += itemDto.quantity * product.price;
      }
      if (discount) {
        finalTotal = finalTotal - finalTotal * (discount.percentage / 100);
      }

      const newOrder = manager.create(Orders, {
        user: user,
        total: finalTotal,
        date: new Date(),
        statusOrder: OrderStatus.PENDING,
        shippingAddress: createOrderDto.shippingAddress,
        isPaid: true,
      });

      await manager.save(Orders, newOrder);

      if (discount) {
        const discountUsed = new DiscountCodesUsed();
        discountUsed.order = newOrder;
        discountUsed.discountCode = discount;
        discountUsed.usedAt = new Date();
        discountUsed.user = user;

        await manager.save(DiscountCodesUsed, discountUsed);
      }

      for (const itemDto of items) {
        const product = productValidations.get(itemDto.productId);

        if (!product) {
          throw new NotFoundException(`Product with id ${itemDto.productId} not found`);
        }

        const orderDetail = new OrderDetail();
        orderDetail.order = newOrder;
        orderDetail.product = product;
        orderDetail.quantity = itemDto.quantity;
        orderDetail.unitPrice = product.price;

        await manager.save(OrderDetail, orderDetail);

        product.stock -= itemDto.quantity;
        await manager.save(Products, product);
      }

      const userCart = await manager.findOne(Cart, {
        where: { user: { id: userId }, isActive: true },
        relations: ['items'],
      });

      if (userCart) {
        if (userCart.items && userCart.items.length > 0) {
          await manager.remove(CartItem, userCart.items);
        }

        await manager.remove(Cart, userCart);
      }

      const finalOrder = await manager.findOne(Orders, {
        where: { id: newOrder.id },
        relations: ['orderDetails', 'orderDetails.product', 'user'],
      });

      if (!finalOrder) {
        throw new InternalServerErrorException('Order not found after creation.');
      }

      return finalOrder;
    });
  }

  async getAllOrders(status?: OrderStatus): Promise<Orders[]> {
    const findOptions: any = {
      relations: ['user', 'orderDetails', 'orderDetails.product', 'discountCodesUsed'],
      order: {
        date: 'DESC',
      },
    };
    if (status) {
      findOptions.where = { statusOrder: status };
    }
    return this.ordersRepository.find(findOptions);
  }

  async getUserOrders(userId: string): Promise<Orders[]> {
    return this.ordersRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'orderDetails', 'orderDetails.product', 'discountCodesUsed'],
      order: {
        date: 'DESC',
      },
    });
  }

  async findOrderById(orderId: string): Promise<Orders> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'orderDetails', 'orderDetails.product', 'discountCodesUsed'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return order;
  }

  async updateOrder(orderId: string, updateOrderDto: UpdateOrderDto): Promise<Orders> {
    const order = await this.ordersRepository.findOneBy({ id: orderId });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    Object.assign(order, updateOrderDto);
    return this.ordersRepository.save(order);
  }

  async cancelOrder(orderId: string): Promise<Orders> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const order = await manager.findOne(Orders, {
        where: { id: orderId },
        relations: ['orderDetails', 'orderDetails.product'],
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }
      if (
        order.statusOrder === OrderStatus.SHIPPED ||
        order.statusOrder === OrderStatus.DELIVERED ||
        order.statusOrder === OrderStatus.CANCELED
      ) {
        throw new BadRequestException(
          'Cannot cancel an order that is already shipped, delivered, or canceled.',
        );
      }

      for (const detail of order.orderDetails) {
        const product = await manager.findOneBy(Products, { id: detail.product.id });
        if (product) {
          product.stock += detail.quantity;
          await manager.save(Products, product);
        }
      }
      order.statusOrder = OrderStatus.CANCELED;
      const canceledOrder = await manager.save(Orders, order);
      return canceledOrder;
    });
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Orders> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (newStatus === OrderStatus.SHIPPED) {
      if (order.statusOrder !== OrderStatus.PENDING) {
        throw new BadRequestException('Order must be in PENDING status to be SHIPPED.');
      }
    } else if (newStatus === OrderStatus.DELIVERED) {
      if (order.statusOrder !== OrderStatus.SHIPPED) {
        throw new BadRequestException('Order must be in SHIPPED status to be DELIVERED.');
      }
    } else if (newStatus === OrderStatus.CANCELED) {
      throw new BadRequestException('Use cancel button, which handles stock replenishment.');
    }

    order.statusOrder = newStatus;
    const updatedOrder = await this.ordersRepository.save(order);

    return updatedOrder;
  }
}
