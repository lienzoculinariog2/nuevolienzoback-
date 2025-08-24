import { Controller, Get, Post, Body, Param, Put, Delete, ParseUUIDPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddSingleProductToCartDto } from './dto/add-single-product.dto';
import { AddMultipleProductsToCartDto } from './dto/add-multiple-products.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Orders } from '../orders/entities/order.entity';
import { CheckoutDto } from '../checkout/dto/check-out.dto';
import { FullCartSummaryDto } from './dto/full-Cart-Summary-dto';
import { CartItem } from './entities/cart-item.entity';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // 🚫 DESHABILITADO: Gestión de carritos activos/inactivos (solo admin)
  // @Get('active')
  // findActiveCarts() {
  //   return this.cartService.findAllActive();
  // }

  // @Get('inactive')
  // findInactiveCarts() {
  //   return this.cartService.findInactive();
  // }

  // @Delete('inactive')
  // async removeInactiveCarts() {
  //   await this.cartService.removeInactiveCarts();
  //   return { message: 'All inactive carts have been removed successfully.' };
  // }

  @Get(':userId')
  getCart(@Param('userId') userId: string): Promise<FullCartSummaryDto> {
    return this.cartService.getCart(userId);
  }

  @Post('addsingle/:userId')
  addSingleProductToCart(
    @Param('userId') userId: string,
    @Body() addDto: AddSingleProductToCartDto,
  ): Promise<FullCartSummaryDto> {
    return this.cartService.addSingleProductToCart(userId, addDto);
  }

  // 🚫 DESHABILITADO: Agregar múltiples productos (no necesario para flujo de compra)
  // @Post('addmultiple/:userId')
  // addMultipleProductsToCart(
  //   @Param('userId') userId: string,
  //   @Body() addMultipleDto: AddMultipleProductsToCartDto,
  // ): Promise<FullCartSummaryDto> {
  //   return this.cartService.addMultipleProductsToCart(userId, addMultipleDto);
  // }

  @Put(':userId')
  updateCartItems(
    @Param('userId') userId: string,
    @Body() updateCartDto: UpdateCartDto,
  ): Promise<FullCartSummaryDto | null> {
    return this.cartService.updateCartItems(userId, updateCartDto);
  }

  @Delete(':userId/:itemId')
  removeCartItem(
    @Param('userId') userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<FullCartSummaryDto> {
    return this.cartService.removeCartItem(userId, itemId);
  }

  @Delete(':userId')
  async clearCart(@Param('userId') userId: string): Promise<{ message: string }> {
    await this.cartService.clearCart(userId);
    return { message: 'Cart has been successfully cleared.' };
  }

  // 🚫 DESHABILITADO: Buscar item específico del carrito (no necesario para flujo de compra)
  // @Get(':userId/:itemId')
  // findCartItem(
  //   @Param('userId') userId: string,
  //   @Param('itemId', ParseUUIDPipe) itemId: string,
  // ): Promise<CartItem> {
  //   return this.cartService.findCartItem(userId, itemId);
  // }
}
