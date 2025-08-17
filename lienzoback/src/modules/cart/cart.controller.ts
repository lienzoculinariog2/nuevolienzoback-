import { Controller, Get, Post, Body, Param, Put, Delete, ParseUUIDPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddSingleProductToCartDto } from './dto/add-single-product.dto';
import { AddMultipleProductsToCartDto } from './dto/add-multiple-products.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Cart } from './entities/cart.entity';
import { Orders } from '../orders/entities/order.entity';
import { CheckoutDto } from './dto/check-out.dto';
import { TemporaryCartDto } from './dto/temporary-cart.dto';
import { FullCartSummaryDto } from './dto/full-Cart-Summary-dto';
import { CartItem } from './entities/cart-item.entity';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('active')
  findActiveCarts() {
    return this.cartService.findAllActive();
  }

  @Get('inactive')
  findInactiveCarts() {
    return this.cartService.findAllInactive();
  }

  @Delete('inactive')
  async removeInactiveCarts() {
    await this.cartService.removeInactiveCarts();
    return { message: 'All inactive carts have been removed successfully.' };
  }

  @Get(':userId')
  getCart(@Param('id') userId: string): Promise<Cart> {
    return this.cartService.getCart(userId);
  }

  @Post('addsingle/:userId')
  addSingleProductToCart(
    @Param('id') userId: string,
    @Body() addDto: AddSingleProductToCartDto,
  ): Promise<FullCartSummaryDto> {
    return this.cartService.addSingleProductToCart(userId, addDto);
  }

  @Post('addmultiple/:userId')
  addMultipleProductsToCart(
    @Param('id') userId: string,
    @Body() addMultipleDto: AddMultipleProductsToCartDto,
  ): Promise<FullCartSummaryDto> {
    return this.cartService.addMultipleProductsToCart(userId, addMultipleDto);
  }

  @Put(':userId')
  updateCartItems(
    @Param('id') userId: string,
    @Body() updateCartDto: UpdateCartDto,
  ): Promise<FullCartSummaryDto | null> {
    return this.cartService.updateCartItems(userId, updateCartDto);
  }

  @Delete(':userId/:itemId')
  removeCartItem(
    @Param('id') userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<FullCartSummaryDto> {
    return this.cartService.removeCartItem(userId, itemId);
  }

  @Delete(':userId')
  async clearCart(@Param('id') userId: string): Promise<{ message: string }> {
    await this.cartService.clearCart(userId);
    return { message: 'Cart has been successfully cleared.' };
  }

  @Get(':userId/:itemId')
  findCartItem(
    @Param('id') userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<CartItem> {
    return this.cartService.findCartItem(userId, itemId);
  }

  @Post('checkout/:userId')
  checkout(@Param('id') userId: string, @Body() checkoutDto: CheckoutDto): Promise<Orders> {
    return this.cartService.checkout(userId, checkoutDto);
  }
}
