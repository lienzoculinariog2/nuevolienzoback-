import { Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Orders } from './entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrderFromCart(@Req() req): Promise<Orders> {
    return this.ordersService.createOrderFromCart(req.user.id);
  }

  @Get()
  async getUserOrders(@Req() req): Promise<Orders[]> {
    return this.ordersService.findUserOrders(req.user.id);
  }
}
