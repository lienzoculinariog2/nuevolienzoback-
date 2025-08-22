import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Users } from './entities/user.entity';
import { Orders } from '../orders/entities/order.entity';
import { OrderDetail } from '../orders/entities/order-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, Orders, OrderDetail])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
