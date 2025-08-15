import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Products } from '../products/entities/product.entity';
import { Users } from '../users/entities/user.entity';
import { AddToCartDto } from './dto/addTo-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CartSummaryDto } from './dto/cart-summary.dto';
import { Orders, OrderStatus } from '../orders/entities/order.entity';
import { OrderDetail } from '../orders/entities/order-detail.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { TemporaryCartDto } from './dto/temporary-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Orders)
    private orderRepository: Repository<Orders>,
    @InjectRepository(OrderDetail)
    private orderDetailRepository: Repository<OrderDetail>,
  ) {}

  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found.');
      }
      cart = this.cartRepository.create({ user, isActive: false });
      await this.cartRepository.save(cart);
    }
    return cart;
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<CartSummaryDto> {
    const cart = await this.getCart(userId);

    for (const item of addToCartDto.products) {
      const { productId, quantity } = item;
      const product = await this.productsRepository.findOne({ where: { id: productId } });

      if (!product || !product.isActive) {
        throw new NotFoundException(`Product with id ${productId} not found or not available.`);
      }
      if (product.stock < quantity) {
        throw new BadRequestException(
          `Not enough stock for product with id ${productId}, ${product.stock} available.`,
        );
      }

      let cartItem = await this.cartItemRepository.findOne({
        where: { cart: { id: cart.id }, product: { id: productId } },
      });

      if (cartItem) {
        cartItem.quantity += quantity;
      } else {
        cartItem = this.cartItemRepository.create({
          cart,
          product,
          quantity,
          price: product.price,
        });
      }
      await this.cartItemRepository.save(cartItem);
    }

    if (addToCartDto.products.length > 0 && !cart.isActive) {
      cart.isActive = true;
      await this.cartRepository.save(cart);
    }

    const updatedCart = await this.getCart(userId);
    return this.calculateCartSummary(updatedCart);
  }

  // async updateCartItems(
  //   userId: string,
  //   updateMultipleCartDto: UpdateCartDto,
  // ): Promise<Cart | null> {
  //   const cart = await this.getCart(userId);

  //   for (const update of updateMultipleCartDto.updates) {
  //     const { itemId, quantity } = update;

  //     const cartItem = await this.cartItemRepository.findOne({
  //       where: { id: itemId, cart: { id: cart.id } },
  //       relations: ['product'],
  //     });
  //     if (!cartItem) {
  //       throw new NotFoundException(`Cart item with id ${itemId} not found.`);
  //     }
  //     if (quantity === 0) {
  //       await this.cartItemRepository.remove(cartItem);
  //       continue;
  //     }
  //     if (cartItem.product.stock < quantity) {
  //       throw new BadRequestException(
  //         `Not enough stock available for product with id ${cartItem.product.id}. Only ${cartItem.product.stock} available.`,
  //       );
  //     }
  //     cartItem.quantity = quantity;
  //     await this.cartItemRepository.save(cartItem);
  //   }
  //   const updatedCart = await this.getCart(userId);
  //   if (updatedCart && updatedCart.items.length === 0) {
  //     await this.cartRepository.remove(updatedCart);
  //     throw new HttpException('El carrito ha sido vaciado y eliminado con éxito.', HttpStatus.OK);
  //   }
  // }

  async removeCartItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cart: { id: cart.id } },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found.');
    }

    await this.cartItemRepository.remove(cartItem);
    const updatedCart = await this.getCart(userId);

    if (updatedCart.items.length === 0) {
      updatedCart.isActive = false;
      await this.cartRepository.save(updatedCart);
    }

    return updatedCart;
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getCart(userId);
    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }
    cart.isActive = false;
    await this.cartRepository.save(cart);
  }

  async findAllActive(): Promise<Cart[]> {
    return this.cartRepository.find({
      where: {
        isActive: true,
      },
      relations: ['items', 'items.product', 'user'],
    });
  }

  // Usuarios no logeados
  async mergeCarts(userId: string, temporaryCartDto: TemporaryCartDto): Promise<Cart> {
    const userCart = await this.getCart(userId);

    for (const tempItem of temporaryCartDto.products) {
      const { productId, quantity } = tempItem;
      const product = await this.productsRepository.findOne({ where: { id: productId } });

      if (!product || !product.isActive) {
        continue;
      }

      const existingCartItem = userCart.items.find((item) => item.product.id === productId);

      if (existingCartItem) {
        existingCartItem.quantity += quantity;
        await this.cartItemRepository.save(existingCartItem);
      } else {
        const newCartItem = this.cartItemRepository.create({
          cart: userCart,
          product,
          quantity,
          price: product.price,
        });
        await this.cartItemRepository.save(newCartItem);
      }
    }

    if (userCart.items.length > 0 && !userCart.isActive) {
      userCart.isActive = true;
      await this.cartRepository.save(userCart);
    }

    return this.getCart(userId);
  }

  async checkout(userId: string, checkoutDto: CheckoutDto): Promise<Orders> {
    const cart = await this.getCart(userId);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('The cart is empty.');
    }

    let subTotal = 0;

    for (const item of cart.items) {
      const product = item.product;
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Not enough stock for product '${product.name}'. Only ${product.stock} available.`,
        );
      }
      subTotal += item.quantity * product.price;
    }

    const paymentSuccessful = true;
    if (!paymentSuccessful) {
      throw new BadRequestException('Payment failed. Please try again.');
    }

    const newOrder = this.orderRepository.create({
      user: cart.user,
      total: subTotal,
      date: new Date(),
      statusOrder: OrderStatus.PENDING,
      shippingAddress: checkoutDto.shippingAddress,
      isPaid: true,
    });
    await this.orderRepository.save(newOrder);

    for (const item of cart.items) {
      const product = item.product;

      const orderDetail = this.orderDetailRepository.create({
        order: newOrder,
        product,
        quantity: item.quantity,
        unitPrice: product.price,
      });
      await this.orderDetailRepository.save(orderDetail);

      product.stock -= item.quantity;
      await this.productsRepository.save(product);
    }

    await this.clearCart(userId);

    return (await this.orderRepository.findOne({
      where: { id: newOrder.id },
      relations: ['orderDetails', 'orderDetails.product'],
    }))!;
  }

  private calculateCartSummary(cart: Cart): CartSummaryDto {
    let subTotal = 0;
    let totalItems = 0;

    if (cart && cart.items) {
      for (const item of cart.items) {
        subTotal += item.quantity * item.product.price;
        totalItems += item.quantity;
      }
    }
    return { totalItems, subTotal };
  }
}
