import { Controller, Get, Param, Body, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { Orders, OrderStatus } from './entities/order.entity';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all orders - optionally filtered by status (for administrators only)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatus,
    description: 'Filter orders by status (optional)',
  })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  getAllOrders(@Query('status') status?: OrderStatus): Promise<Orders[]> {
    return this.ordersService.getAllOrders(status);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all orders for a specific user' })
  getUserOrders(@Param('userId') userId: string): Promise<Orders[]> {
    return this.ordersService.getUserOrders(userId);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Find a single order id' })
  async findOrderById(@Param('orderId') orderId: string): Promise<Orders> {
    return this.ordersService.findOrderById(orderId);
  }

  @Put(':orderId')
  @ApiOperation({ summary: 'Update a specific order ' })
  updateOrder(
    @Param('orderId') orderId: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Orders> {
    return this.ordersService.updateOrder(orderId, updateOrderDto);
  }

  @Put(':orderId/cancel')
  @ApiOperation({ summary: 'Cancel an order (for administrators only)' })
  cancelOrder(@Param('orderId') orderId: string): Promise<Orders> {
    return this.ordersService.cancelOrder(orderId);
  }

  @Put(':orderId/status')
  @ApiOperation({ summary: 'Update the status of an order (for administrators only)' })
  async updateOrderStatus(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body('newStatus') newStatus: OrderStatus,
  ): Promise<Orders> {
    return this.ordersService.updateOrderStatus(orderId, newStatus);
  }
}
