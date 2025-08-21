import {
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
  Param,
  Body,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Orders, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post(':userId')
  async createOrder(
    @Param('userId') userId: string, //
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Orders> {
    return this.ordersService.createOrder(userId, createOrderDto);
  }

  @Get()
  getAllOrders(@Query('status') status?: OrderStatus): Promise<Orders[]> {
    return this.ordersService.getAllOrders(status);
  }

  @Get(':orderId')
  getOrderById(@Param('id', ParseUUIDPipe) id: string): Promise<Orders[]> {
    return this.ordersService.getOrderById(id);
  }

  @Put(':orderId')
  updateOrder(
    @Param('orderId') orderId: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Orders> {
    return this.ordersService.updateOrder(orderId, updateOrderDto);
  }

  // @Put('cancel/:orderId')
  // async cancelOrder(@Param('orderId') orderId: string): Promise<Orders> {
  //   return this.ordersService.cancelOrder(orderId);
  // }

  // @Put('shipped/:orderId')
  // async shippedOrder(@Param('orderId') orderId: string): Promise<Orders> {
  //   return this.ordersService.shippedOrder(orderId, OrderStatus.SHIPPED);
  // }

  // @Put('delivered/:orderId')
  // async deliveredOrder(@Param('orderId') orderId: string): Promise<Orders> {
  //   return this.ordersService.deliveredOrder(orderId, OrderStatus.DELIVERED);
  // }
}
