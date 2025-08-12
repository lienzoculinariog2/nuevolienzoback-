// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Param,
//   Put,
//   Delete,
//   Req,
//   ParseUUIDPipe,
// } from '@nestjs/common';
// import { CartService } from './cart.service';
// import { AddToCartDto } from './dto/addTo-cart.dto';
// import { UpdateCartDto } from './dto/update-cart.dto';
// import { Cart } from './entities/cart.entity';

// @Controller('cart')
// export class CartController {
//   constructor(private readonly cartService: CartService) {}

//   @Get()
//   async getCart(@Param('id', ParseUUIDPipe) id: string): Promise<Cart> {
//     return this.cartService.getCart(id);
//   }

//   @Get('active')
//   async findAllActiveCarts() {
//     return this.cartService.findAllActive();
//   }

//   @Post()
//   async addToCart(@Req() req, @Body() addToCartDto: AddToCartDto): Promise<Cart> {
//     return this.cartService.addToCart(req.user.id, addToCartDto);
//   }

//   @Put(':itemId')
//   async updateCartItem(
//     @Req() req,
//     @Param('itemId') itemId: string,
//     @Body() updateCartDto: UpdateCartDto,
//   ): Promise<Cart> {
//     return this.cartService.updateCartItem(req.user.id, itemId, updateCartDto);
//   }

//   @Delete(':itemId')
//   async removeCartItem(@Req() req, @Param('itemId') itemId: string): Promise<Cart> {
//     return this.cartService.removeCartItem(req.user.id, itemId);
//   }

//   @Delete()
//   async clearCart(@Req() req): Promise<void> {
//     return this.cartService.clearCart(req.user.id);
//   }
// }
