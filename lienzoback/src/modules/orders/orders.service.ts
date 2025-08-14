import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Orders, OrderStatus } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Users } from '../users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Orders)
    private ordersRepository: Repository<Orders>,
    @InjectRepository(OrderDetail)
    private orderDetailRepository: Repository<OrderDetail>,
    private dataSource: DataSource,
  ) {}

  async createOrderFromCart(userId: string): Promise<Orders> {
    const user = await this.ordersRepository.manager.findOne(Users, {
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.dataSource.transaction(async (entityManager) => {
      const cart = await entityManager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['items', 'items.product', 'user'],
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty.');
      }

      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          throw new BadRequestException(`Not enough stock for product: ${item.product.name}`);
        }
      }

      const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      const newOrder = this.ordersRepository.create({
        user: cart.user,
        date: new Date(),
        total: total,
        statusOrder: OrderStatus.PENDING,
        isPaid: false,
      });
      const savedOrder = await entityManager.save(newOrder);

      const orderDetails = cart.items.map((item) => {
        item.product.stock -= item.quantity;
        return this.orderDetailRepository.create({
          order: savedOrder,
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.product.price,
        });
      });

      await entityManager.save(orderDetails);
      await entityManager.save(cart.items.map((item) => item.product));
      await entityManager.remove(cart.items);

      return savedOrder;
    });
  }

  async findUserOrders(userId: string): Promise<Orders[]> {
    return this.ordersRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'orderDetails', 'orderDetails.product'],
      order: {
        date: 'DESC',
      },
    });
  }
}
