import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Products } from '../products/entities/product.entity';
import { Users } from '../users/entities/user.entity';
import { AddSingleProductToCartDto } from './dto/add-single-product.dto';
import { AddMultipleProductsToCartDto } from './dto/add-multiple-products.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Orders, OrderStatus } from '../orders/entities/order.entity';
import { OrderDetail } from '../orders/entities/order-detail.entity';
import { CheckoutDto } from './dto/check-out.dto';
import { TemporaryCartDto } from './dto/temporary-cart.dto';
import { FullCartSummaryDto } from './dto/full-Cart-Summary-dto';

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
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.product.images'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart for user with id ${userId} not found`);
    }

    return cart;
  }

  async findAllActive() {
    return this.cartRepository.find({
      where: { isActive: true },
      relations: ['items', 'items.product', 'items.product.images'],
    });
  }

  async addSingleProductToCart(
    userId: string,
    addDto: AddSingleProductToCartDto,
  ): Promise<FullCartSummaryDto> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        user: user,
        isActive: true,
        items: [],
      });
      await this.cartRepository.save(cart);
    }

    const { productId, quantity } = addDto;
    const product = await this.productsRepository.findOneBy({ id: productId });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (product.stock < quantity) {
      throw new BadRequestException(`Not enough stock for product with id ${productId}`);
    }

    let cartItem = cart.items.find((item) => item.product.id === productId);

    if (cartItem) {
      cartItem.quantity += quantity;
      cartItem.price = product.price;
    } else {
      cartItem = this.cartItemRepository.create({
        product: product,
        quantity,
        cart,
        price: product.price,
      });
      cart.items.push(cartItem);
    }

    await this.cartItemRepository.save(cartItem);

    const updatedCart = await this.cartRepository.findOne({
      where: { id: cart.id },
      relations: ['items', 'items.product'],
    });

    if (!updatedCart) {
      throw new NotFoundException(`Cart with id ${cart.id} not found`);
    }

    return this.calculateCartSummary(updatedCart);
  }

  async addMultipleProductsToCart(
    userId: string,
    addMultipleDto: AddMultipleProductsToCartDto,
  ): Promise<FullCartSummaryDto> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.product.images'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        user: user,
        isActive: true,
        items: [],
      });
      await this.cartRepository.save(cart);
    }

    for (const itemDto of addMultipleDto.products) {
      const { productId, quantity } = itemDto;
      const product = await this.productsRepository.findOneBy({
        id: productId,
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      if (product.stock < quantity) {
        throw new BadRequestException(`Not enough stock for product with id ${productId}`);
      }

      let cartItem = cart.items.find((item) => item.product.id === productId);

      if (cartItem) {
        cartItem.quantity += quantity;
        cartItem.price = product.price;
      } else {
        cartItem = this.cartItemRepository.create({
          product: product,
          quantity,
          cart,
          price: product.price,
        });
        cart.items.push(cartItem);
      }
      await this.cartItemRepository.save(cartItem);
    }

    const updatedCart = await this.cartRepository.findOne({
      where: { id: cart.id },
      relations: ['items', 'items.product', 'items.product.images'],
    });

    if (!updatedCart) {
      throw new NotFoundException(`Cart with id ${cart.id} not found`);
    }

    return this.calculateCartSummary(updatedCart);
  }

  async updateCartItems(userId: string, updateCartDto: UpdateCartDto): Promise<Cart | null> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart for user with id ${userId} not found`);
    }

    for (const updateItem of updateCartDto.updates) {
      const { itemId, quantity } = updateItem;
      const cartItem = cart.items.find((item) => item.id === itemId);

      if (!cartItem) {
        throw new NotFoundException(`CartItem with ID ${itemId} not found`);
      }

      if (quantity <= 0) {
        await this.cartItemRepository.delete(cartItem.id);
        cart.items = cart.items.filter((item) => item.id !== itemId);
      } else {
        const product = await this.productsRepository.findOne({
          where: { id: cartItem.product.id },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${cartItem.product.id} not found`);
        }

        if (product.stock < quantity) {
          throw new BadRequestException(`Not enough stock for product with id ${product.id}`);
        }

        cartItem.quantity = quantity;
        await this.cartItemRepository.save(cartItem);
      }
    }
    return this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });
  }

  async removeCartItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      throw new NotFoundException(`Cart for user with id ${userId} not found`);
    }
    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem) {
      throw new NotFoundException(`CartItem with ID ${itemId} not found`);
    }
    await this.cartItemRepository.remove(cartItem);

    const updatedCart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });
    if (!updatedCart) {
      throw new NotFoundException(`Cart for user with id ${userId} not found`);
    }
    return updatedCart;
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      throw new NotFoundException(`Cart for user with id ${userId} not found`);
    }
    await this.cartItemRepository.remove(cart.items);
  }

  async checkout(userId: string, checkoutDto: CheckoutDto): Promise<Orders> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
    let subTotal = 0;
    for (const item of cart.items) {
      const product = await this.productsRepository.findOne({
        where: { id: item.product.id },
      });
      if (!product) {
        throw new NotFoundException(`Product with id ${item.product.id} not found`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Not enough stock for product with id ${product.id}`);
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

  // Nuevo: Servicio para fusionar carritos
  async mergeCarts(
    userId: string,
    temporaryCartDto: TemporaryCartDto,
  ): Promise<FullCartSummaryDto> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.product.images'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        user: user,
        isActive: true,
        items: [],
      });
      await this.cartRepository.save(cart);
    }

    for (const itemDto of temporaryCartDto.products) {
      const { productId, quantity } = itemDto;
      const product = await this.productsRepository.findOneBy({
        id: productId,
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      if (product.stock < quantity) {
        throw new BadRequestException(`Not enough stock for product with id ${productId}`);
      }

      let cartItem = cart.items.find((item) => item.product.id === productId);

      if (cartItem) {
        cartItem.quantity += quantity;
        cartItem.price = product.price;
      } else {
        cartItem = this.cartItemRepository.create({
          product: product,
          quantity,
          cart,
          price: product.price,
        });
        cart.items.push(cartItem);
      }
      await this.cartItemRepository.save(cartItem);
    }

    const updatedCart = await this.cartRepository.findOne({
      where: { id: cart.id },
      relations: ['items', 'items.product', 'items.product.images'],
    });

    if (!updatedCart) {
      throw new NotFoundException(`Cart with id ${cart.id} not found`);
    }

    return this.calculateCartSummary(updatedCart);
  }

  private calculateCartSummary(cart: Cart): FullCartSummaryDto {
    let subTotal = 0;
    let totalItems = 0;

    const itemsResponse = cart.items.map((item) => {
      const totalItemPrice = item.quantity * item.product.price;
      subTotal += totalItemPrice;
      totalItems += item.quantity;

      // Aquí está el cambio. Se asigna una URL por defecto
      // si item.product.imgUrl es null o undefined.
      const imgUrl = item.product.imgUrl ?? 'https://via.placeholder.com/150';

      return {
        id: item.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        imgUrl: imgUrl, // Usamos la nueva variable imgUrl
        totalItemPrice: totalItemPrice,
      };
    });

    return {
      items: itemsResponse,
      totalItems,
      subTotal,
    };
  }
}
