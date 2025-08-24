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

    // Filtrar items que no tienen producto asociado
    const validItems = cart.items.filter(item => item.product && item.product.id);
    if (validItems.length === 0) {
      throw new BadRequestException('No valid items found in cart');
    }

    let subTotal = 0;
    const orderItems: OrderItemDto[] = [];

    for (const item of validItems) {
      // Verificar que el producto existe en la relación
      if (!item.product || !item.product.id) {
        throw new NotFoundException(`Product not found for cart item ${item.id}`);
      }
      
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

  /**
   * Diagnosticar carrito del usuario (solo lectura, no modifica datos)
   */
  async diagnoseCart(userId: string) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      return {
        status: 'no_cart',
        message: 'User has no cart',
        issues: []
      };
    }

    if (cart.items.length === 0) {
      return {
        status: 'empty_cart',
        message: 'Cart is empty',
        issues: []
      };
    }

    const issues: string[] = [];
    const validItems: Array<{
      id: string;
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }> = [];
    const invalidItems: Array<{
      id: string;
      productId?: string;
      issue: string;
    }> = [];

    for (const item of cart.items) {
      if (!item.product || !item.product.id) {
        issues.push(`Cart item ${item.id} has no product associated`);
        invalidItems.push({
          id: item.id,
          issue: 'no_product'
        });
      } else {
        const product = await this.productsRepository.findOneBy({ id: item.product.id });
        if (!product) {
          issues.push(`Product ${item.product.id} not found in database`);
          invalidItems.push({
            id: item.id,
            productId: item.product.id,
            issue: 'product_not_found'
          });
        } else {
          validItems.push({
            id: item.id,
            productId: item.product.id,
            productName: product.name,
            quantity: item.quantity,
            price: product.price
          });
        }
      }
    }

    return {
      status: issues.length > 0 ? 'has_issues' : 'healthy',
      message: issues.length > 0 ? 'Cart has issues' : 'Cart is healthy',
      totalItems: cart.items.length,
      validItemsCount: validItems.length,
      invalidItemsCount: invalidItems.length,
      issues,
      validItems,
      invalidItems
    };
  }
}
