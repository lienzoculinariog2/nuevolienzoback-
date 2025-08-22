import { Controller, Post, Get, Param, Body, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Orders, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post(':userId')
  async createOrder(
    @Param('userId') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Orders> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.ordersService.createOrder(userId, createOrderDto);
  }

  @Get()
  getAllOrders(@Query('status') status?: OrderStatus): Promise<Orders[]> {
    return this.ordersService.getAllOrders(status);
  }

  @Get('user/:userId')
  getUserOrders(@Param('userId') userId: string): Promise<Orders[]> {
    return this.ordersService.getUserOrders(userId);
  }

  @Get(':orderId')
  async findOrderById(@Param('orderId') orderId: string): Promise<Orders> {
    return this.ordersService.findOrderById(orderId);
  }

  @Put(':orderId')
  updateOrder(
    @Param('orderId') orderId: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Orders> {
    return this.ordersService.updateOrder(orderId, updateOrderDto);
  }

  @Put(':orderId/cancel')
  cancelOrder(@Param('orderId') orderId: string): Promise<Orders> {
    return this.ordersService.cancelOrder(orderId);
  }

  @Put(':orderId/status')
  async updateOrderStatus(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body('newStatus') newStatus: OrderStatus,
  ): Promise<Orders> {
    return this.ordersService.updateOrderStatus(orderId, newStatus);
  }
}
