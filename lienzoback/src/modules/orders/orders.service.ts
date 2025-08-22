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
  create(createOrderDto: CreateOrderDto) {
    return 'This action adds a new order';
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
