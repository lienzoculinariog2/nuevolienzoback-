import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddSingleProductToCartDto } from './dto/add-single-product.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { FullCartSummaryDto } from './dto/full-Cart-Summary-dto';
import { ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { UserOwnershipGuard } from '../common/guard/user-ownership.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard, UserOwnershipGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get the shopping cart for a specific user' })
  getCart(@Param('userId') userId: string): Promise<FullCartSummaryDto> {
    return this.cartService.getCart(userId);
  }

  @Post('addsingle/:userId')
  @ApiOperation({ summary: 'Add a product to the cart' })
  addSingleProductToCart(
    @Param('userId') userId: string,
    @Body() addDto: AddSingleProductToCartDto,
  ): Promise<FullCartSummaryDto> {
    return this.cartService.addSingleProductToCart(userId, addDto);
  }

  @Put(':userId')
  @ApiOperation({ summary: 'Update cart items (e.g., change quantity)' })
  updateCartItems(
    @Param('userId') userId: string,
    @Body() updateCartDto: UpdateCartDto,
  ): Promise<FullCartSummaryDto | null> {
    return this.cartService.updateCartItems(userId, updateCartDto);
  }

  @Delete(':userId/:itemId')
  @ApiOperation({ summary: 'Remove a single item from the cart' })
  removeCartItem(
    @Param('userId') userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<FullCartSummaryDto> {
    return this.cartService.removeCartItem(userId, itemId);
  }

  @Delete(':userId')
  @ApiOperation({ summary: "Clear all items from a user's cart" })
  async clearCart(@Param('userId') userId: string): Promise<{ message: string }> {
    await this.cartService.clearCart(userId);
    return { message: 'Cart has been successfully cleared.' };
  }
}
