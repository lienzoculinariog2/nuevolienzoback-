import { Controller, Post, Get, Param, Body, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { Orders, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 🚫 DESHABILITADO: Crear orden manualmente (se crea automáticamente en checkout)
  // @Post(':userId')
  // @ApiOperation({ summary: 'Create a new order' })
  // async createOrder(
  //   @Param('userId') userId: string,
  //   @Body() createOrderDto: CreateOrderDto,
  // ): Promise<Orders> {
  //   return this.ordersService.createOrder(userId, createOrderDto);
  // }

  // 🚫 DESHABILITADO: Obtener todas las órdenes (solo admin)
  // @Get()
  // @ApiOperation({ summary: 'Get all orders (optionally filtered by status)' })
  // @ApiQuery({ 
  //   name: 'status', 
  //   required: false, 
  //   enum: OrderStatus,
  //   description: 'Filter orders by status (optional)' 
  // })
  // @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  // getAllOrders(@Query('status') status?: OrderStatus): Promise<Orders[]> {
  //   return this.ordersService.getAllOrders(status);
  // }

  @Get('user/:userId')
  getUserOrders(@Param('userId') userId: string): Promise<Orders[]> {
    return this.ordersService.getUserOrders(userId);
  }

  @Get(':orderId')
  async findOrderById(@Param('orderId') orderId: string): Promise<Orders> {
    return this.ordersService.findOrderById(orderId);
  }

  // 🚫 DESHABILITADO: Actualizar orden manualmente (se actualiza automáticamente)
  // @Put(':orderId')
  // updateOrder(
  //   @Param('orderId') orderId: string,
  //   @Body() updateOrderDto: UpdateOrderDto,
  // ): Promise<Orders> {
  //   return this.ordersService.updateOrder(orderId, updateOrderDto);
  // }

  // 🚫 DESHABILITADO: Cancelar orden (no necesario para flujo de compra)
  // @Put(':orderId/cancel')
  // cancelOrder(@Param('orderId') orderId: string): Promise<Orders> {
  //   return this.ordersService.cancelOrder(orderId);
  // }

  // 🚫 DESHABILITADO: Actualizar estado de orden (se actualiza automáticamente)
  // @Put(':orderId/status')
  // async updateOrderStatus(
  //   @Param('orderId', ParseUUIDPipe) orderId: string,
  //   @Body('newStatus') newStatus: OrderStatus,
  // ): Promise<Orders> {
  //   return this.ordersService.updateOrderStatus(orderId, newStatus);
  // }
}
