import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from '../cart/entities/cart.entity';
import { Products } from '../products/entities/product.entity';
import { Users } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { CheckoutDto } from './dto/check-out.dto';
import { CartService } from '../cart/cart.service';
import { DiscountCodesUsed } from '../discount-codes/entities/discount-codes-used.entity';
import { DiscountCodesService } from '../discount-codes/discount-codes.service';
import { OrdersService } from '../orders/orders.service';
import { OrderItemDto } from '../orders/dto/create-order.dto';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(DiscountCodesUsed)
    private discountCodesUsedRepository: Repository<DiscountCodesUsed>,
    private readonly discountCodesService: DiscountCodesService,
  ) {}

  async checkout(userId: string, checkoutDto: CheckoutDto) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let subTotal = 0;
    const orderItems: OrderItemDto[] = [];

    for (const item of cart.items) {
      const product = await this.productsRepository.findOneBy({ id: item.product.id });
      if (!product) {
        throw new NotFoundException(`Product with id ${item.product.id} not found`);
      }
      if (product.stock === 0) {
        throw new BadRequestException(
          `The product ${product.name} is out of stock and cannot be added to the order.`,
        );
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Not enough stock for product ${product.name}`);
      }

      subTotal += item.quantity * product.price;

      orderItems.push({
        productId: item.product.id,
        quantity: item.quantity,
        price: product.price,
        imgUrl: product.imgUrl,
      });
    }

    let finalTotal = subTotal;
    let savings = 0; // Se inicializa savings en 0 aquí
    let appliedDiscountCode: string | undefined = undefined;
    let discountPercentage: number | undefined = undefined;

    if (checkoutDto.discountCode) {
      const discount = await this.discountCodesService.findOne(checkoutDto.discountCode);

      if (!discount) {
        throw new NotFoundException('Discount code not found or is not valid.');
      }

      if (discount.isSingleUsePerUser) {
        const usedCode = await this.discountCodesUsedRepository.findOne({
          where: {
            discountCode: { id: discount.id },
            user: { id: userId },
          },
        });
        if (usedCode) {
          throw new BadRequestException('This discount code has already been used by this user.');
        }
      }

      // Este es el cálculo que necesitas mover fuera del if de 'isSingleUsePerUser'
      savings = subTotal * (discount.percentage / 100);
      finalTotal = subTotal - savings;
      appliedDiscountCode = discount.code;
      discountPercentage = discount.percentage;
    }

    return {
      message: 'Checkout successful',
      subTotal: subTotal,
      savings: savings,
      discountPercentage: discountPercentage ? `${discountPercentage}%` : undefined,
      finalTotal: finalTotal,
      orderItems: orderItems,
    };
  }
}
