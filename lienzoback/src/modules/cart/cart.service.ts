import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Products } from '../products/entities/product.entity';
import { Users } from '../users/entities/user.entity';
import { AddToCartDto } from './dto/addTo-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

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
  ) {}

  //USER
  async getCart(id: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id } },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      cart = this.cartRepository.create({ user });
      await this.cartRepository.save(cart);
    }
    return cart;
  }

  //ADMIN
  async findAllActive(): Promise<Cart[]> {
    return this.cartRepository.find({
      where: {
        isActive: true,
      },
      relations: ['items', 'items.product', 'user'],
    });
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, quantity } = addToCartDto;
    const cart = await this.getCart(userId);
    const product = await this.productsRepository.findOne({ where: { id: productId } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (!product.isActive) {
      throw new NotFoundException('Product not available');
    }
    if (product.stock < quantity) {
      throw new BadRequestException('Not enough stock available');
    }

    let cartItem = await this.cartItemRepository.findOne({
      where: { cart: { id: cart.id }, product: { id: productId } },
    });

    if (cartItem) {
      cartItem.quantity += quantity; // si el carro existe le suma otra unidad del item
      await this.cartItemRepository.save(cartItem);
    } else {
      cartItem = this.cartItemRepository.create({ cart, product, quantity });
      await this.cartItemRepository.save(cartItem);
    }

    return this.getCart(userId);
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    updateCartDto: UpdateCartDto,
  ): Promise<Cart> {
    const { quantity } = updateCartDto;
    if (typeof quantity !== 'number' || quantity < 0) {
      throw new BadRequestException('Quantity must be a positive number.');
    }

    const cart = await this.getCart(userId);
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cart: { id: cart.id } },
      relations: ['product'],
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }
    if (cartItem.product.stock < quantity) {
      throw new BadRequestException('Not enough stock available');
    }

    cartItem.quantity = quantity;
    await this.cartItemRepository.save(cartItem);

    return this.getCart(userId);
  }

  async removeCartItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cart: { id: cart.id } },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.remove(cartItem);
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getCart(userId);
    await this.cartItemRepository.remove(cart.items);
  }
}
