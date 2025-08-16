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

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  getCart(@Param('userId', ParseUUIDPipe) userId: string): Promise<Cart> {
    return this.cartService.getCart(userId);
  }

  @Get()
  findAllActiveCarts() {
    return this.cartService.findAllActive();
  }

  @Post('addsingle/:userId')
  addSingleProductToCart(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() addDto: AddSingleProductToCartDto,
  ): Promise<FullCartSummaryDto> {
    return this.cartService.addSingleProductToCart(userId, addDto);
  }

  @Post('addmultiple/:userId')
  addMultipleProductsToCart(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() addMultipleDto: AddMultipleProductsToCartDto,
  ): Promise<FullCartSummaryDto> {
    return this.cartService.addMultipleProductsToCart(userId, addMultipleDto);
  }

  @Put('update/:userId')
  async updateCartItems(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateCartDto: UpdateCartDto,
  ): Promise<any> {
    return this.cartService.updateCartItems(userId, updateCartDto);
  }

  @Delete('item/:userId/:itemId')
  removeCartItem(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<Cart> {
    return this.cartService.removeCartItem(userId, itemId);
  }

  @Delete('empty/:userId')
  clearCart(@Param('userId', ParseUUIDPipe) userId: string): Promise<void> {
    return this.cartService.clearCart(userId);
  }

  @Post('checkout/:userId')
  checkout(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() checkoutDto: CheckoutDto,
  ): Promise<Orders> {
    return this.cartService.checkout(userId, checkoutDto);
  }

  // Nuevo: Endpoint para fusionar carritos de usuarios no logueados
  @Post('merge-cart/:userId')
  mergeCarts(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() temporaryCartDto: TemporaryCartDto,
  ): Promise<FullCartSummaryDto> {
    return this.cartService.mergeCarts(userId, temporaryCartDto);
  }
}
