import { Controller, Get, Post, Body, Param, Put, Delete, ParseUUIDPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/addTo-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Cart } from './entities/cart.entity';
import { CartSummaryDto } from './dto/cart-summary.dto';
import { Orders } from '../orders/entities/order.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { TemporaryCartDto } from './dto/temporary-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  async getCart(@Param('userId', ParseUUIDPipe) userId: string): Promise<Cart> {
    return this.cartService.getCart(userId);
  }

  @Get()
  async findAllActiveCarts() {
    return this.cartService.findAllActive();
  }

  @Post(':userId')
  async addToCart(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartSummaryDto> {
    return this.cartService.addToCart(userId, addToCartDto);
  }

  // @Put(':userId')
  // async updateCartItems(
  //   @Param('userId', ParseUUIDPipe) userId: string,
  //   @Body() updateCartDto: UpdateCartDto,
  // ): Promise<Cart | null> {
  //   return this.cartService.updateCartItems(userId, updateCartDto);
  // }

  @Delete('item/:userId/:itemId')
  async removeCartItem(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<Cart> {
    return this.cartService.removeCartItem(userId, itemId);
  }

  @Delete(':userId')
  async clearCart(@Param('userId', ParseUUIDPipe) userId: string): Promise<void> {
    return this.cartService.clearCart(userId);
  }

  // Nuevo: Endpoint para fusionar carritos de usuarios no logueados
  @Post('merge-cart/:userId')
  async mergeCarts(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() temporaryCartDto: TemporaryCartDto,
  ): Promise<Cart> {
    return this.cartService.mergeCarts(userId, temporaryCartDto);
  }

  // Nuevo: Endpoint para el proceso de checkout
  @Post('checkout/:userId')
  async checkout(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() checkoutDto: CheckoutDto,
  ): Promise<Orders> {
    return this.cartService.checkout(userId, checkoutDto);
  }
}
