import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { Orders, OrderStatus } from './entities/order.entity';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { UserOwnershipGuard } from '../common/guard/user-ownership.guard';
import { RolesGuard } from '../common/guard/roles.guard';
import { HasRoles } from '../decorators/roles';
import { Roles } from '../users/entities/user.entity';
import type { RequestWithUser } from '../common/utils/request-with-user.interface';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
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
  @UseGuards(UserOwnershipGuard)
  @ApiOperation({ summary: 'Get all orders for a specific user' })
  getUserOrders(@Param('userId') userId: string): Promise<Orders[]> {
    return this.ordersService.getUserOrders(userId);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Find a single order id' })
  async findOrderById(
    @Param('orderId') orderId: string,
    @Req() request: RequestWithUser,
  ): Promise<Orders> {
    const order = await this.ordersService.findOrderById(orderId);
    this.assertCanAccessOrder(request, order);
    return order;
  }

  @Put(':orderId')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Update a specific order ' })
  updateOrder(
    @Param('orderId') orderId: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Orders> {
    return this.ordersService.updateOrder(orderId, updateOrderDto);
  }

  @Put(':orderId/cancel')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Cancel an order (for administrators only)' })
  cancelOrder(@Param('orderId') orderId: string): Promise<Orders> {
    return this.ordersService.cancelOrder(orderId);
  }

  @Put(':orderId/status')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Update the status of an order (for administrators only)' })
  async updateOrderStatus(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body('newStatus') newStatus: OrderStatus,
  ): Promise<Orders> {
    return this.ordersService.updateOrderStatus(orderId, newStatus);
  }

  private assertCanAccessOrder(request: RequestWithUser, order: Orders): void {
    if (request.user.roles !== Roles.ADMIN && order.user.id !== request.user.sub) {
      throw new ForbiddenException('No tienes permiso para acceder a esta orden.');
    }
  }
}
