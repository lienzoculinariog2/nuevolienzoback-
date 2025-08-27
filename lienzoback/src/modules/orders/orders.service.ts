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

  async getAllOrders(status?: OrderStatus): Promise<Orders[]> {
    const findOptions: any = {
      relations: ['user', 'orderDetails', 'orderDetails.product', 'discountCodesUsed'],
      order: {
        date: 'DESC',
      },
    };
    if (status) {
      findOptions.where = { status: status };
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
        order.status === OrderStatus.SHIPPED ||
        order.status === OrderStatus.DELIVERED ||
        order.status === OrderStatus.CANCELED
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
      order.status = OrderStatus.CANCELED;
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
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Order must be in PENDING status to be SHIPPED.');
      }
    } else if (newStatus === OrderStatus.DELIVERED) {
      if (order.status !== OrderStatus.SHIPPED) {
        throw new BadRequestException('Order must be in SHIPPED status to be DELIVERED.');
      }
    } else if (newStatus === OrderStatus.CANCELED) {
      throw new BadRequestException('Use cancel button, which handles stock replenishment.');
    }

    order.status = newStatus;
    const updatedOrder = await this.ordersRepository.save(order);

    return updatedOrder;
  }
}
