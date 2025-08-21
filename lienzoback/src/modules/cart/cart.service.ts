import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
import { CheckoutDto } from '../checkout/dto/check-out.dto';
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

  async findAllActive() {
    const carts = await this.cartRepository.find({
      where: { isActive: true },
      relations: ['items', 'items.product', 'user'],
    });
    if (carts.length === 0) {
      throw new NotFoundException('No active carts found.');
    }
    return carts;
  }

  async findInactive() {
    const carts = await this.cartRepository.find({
      where: { isActive: false },
      relations: ['items', 'items.product', 'user'],
    });
    if (carts.length === 0) {
      throw new NotFoundException('No inactive carts found.');
    }
    return carts;
  }

  async removeInactiveCarts(): Promise<void> {
    const inactiveCarts = await this.findInactive();

    if (inactiveCarts.length === 0) {
      throw new NotFoundException('There is not inactive carts.');
    }

    await this.cartRepository.remove(inactiveCarts);
  }

  async getCart(userId: string): Promise<FullCartSummaryDto> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      return {
        items: [],
        totalItems: 0,
        subTotal: 0,
      };
    }
    return this.calculateCartSummary(cart);
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
        isActive: false,
        items: [],
      });
      await this.cartRepository.save(cart);
    }

    const { productId, quantity } = addDto;
    const product = await this.productsRepository.findOneBy({ id: productId });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    let cartItem = cart.items.find((item) => item.product.id === productId);

    const newTotalQuantity = (cartItem ? cartItem.quantity : 0) + quantity;

    if (product.stock < newTotalQuantity) {
      throw new BadRequestException(
        `Not enough stock for product with id ${productId}. Available: ${product.stock}, Requested: ${newTotalQuantity}`,
      );
    }

    if (!cart.isActive && cart.items.length === 0) {
      cart.isActive = true;
      await this.cartRepository.save(cart);
    }
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
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        user: user,
        isActive: false,
        items: [],
      });
      await this.cartRepository.save(cart);
    }

    if (!cart.isActive && addMultipleDto.products.length > 0) {
      cart.isActive = true;
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

      let cartItem = cart.items.find((item) => item.product.id === productId);

      const newTotalQuantity = (cartItem ? cartItem.quantity : 0) + quantity;

      if (product.stock < newTotalQuantity) {
        throw new BadRequestException(
          `Not enough stock for product with id ${productId}. Available: ${product.stock}, Requested: ${newTotalQuantity}`,
        );
      }

      if (cartItem) {
        cartItem.quantity = newTotalQuantity;
        cartItem.price = product.price;
      } else {
        cartItem = this.cartItemRepository.create({
          product: product,
          quantity: newTotalQuantity,
          cart,
          price: product.price,
        });
        cart.items.push(cartItem);
      }

      await this.cartItemRepository.save(cartItem);
    }

    const updatedCart = await this.cartRepository.findOne({
      where: { id: cart.id },
      relations: ['items', 'items.product', 'user'],
    });

    if (!updatedCart) {
      throw new NotFoundException(`Cart with id ${cart.id} not found`);
    }

    return this.calculateCartSummary(updatedCart);
  }

  async updateCartItems(userId: string, updateCartDto: UpdateCartDto): Promise<FullCartSummaryDto> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart for user with id ${userId} not found`);
    }

    const errors: string[] = [];
    const updatesToProcess: { cartItem: CartItem; product: Products; quantity: number }[] = [];

    for (const updateItem of updateCartDto.updates) {
      const { itemId, quantity } = updateItem;
      const cartItem = cart.items.find((item) => item.id === itemId);

      if (!cartItem) {
        errors.push(`CartItem con ID ${itemId} not found.`);
        continue;
      }

      const product = await this.productsRepository.findOne({
        where: { id: cartItem.product.id },
      });

      if (!product) {
        errors.push(`Product ID ${cartItem.product.id} not found.`);
        continue;
      }

      if (quantity > 0 && product.stock < quantity) {
        errors.push(
          `Not enough stock for product with id ${product.id}. Available: ${product.stock}, Request: ${quantity}`,
        );
        continue;
      }

      updatesToProcess.push({ cartItem, product, quantity });
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Could not update cart due to the following errors:',
        errors: errors,
      });
    }

    for (const update of updatesToProcess) {
      const { cartItem, quantity } = update;

      if (quantity <= 0) {
        await this.cartItemRepository.delete(cartItem.id);
        cart.items = cart.items.filter((item) => item.id !== cartItem.id);
      } else {
        cartItem.quantity = quantity;
        await this.cartItemRepository.save(cartItem);
      }
    }

    const updatedCart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!updatedCart) {
      throw new NotFoundException(`Cart with id ${cart.id} not found`);
    }

    return this.calculateCartSummary(updatedCart);
  }

  async removeCartItem(userId: string, itemId: string): Promise<FullCartSummaryDto> {
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
    return this.calculateCartSummary(updatedCart);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      throw new NotFoundException(`Cart for user with id ${userId} not found`);
    }
    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }
    cart.isActive = false;
    await this.cartRepository.save(cart);
  }

  async findCartItem(userId: string, itemId: string): Promise<CartItem> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.cart'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart for user with ID ${userId} not found`);
    }

    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem) {
      throw new NotFoundException(`Item with ID ${itemId} not found in this cart`);
    }

    return cartItem;
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

  private calculateCartSummary(cart: Cart): FullCartSummaryDto {
    let subTotal = 0;
    let totalItems = 0;

    const itemsResponse = cart.items.map((item) => {
      const totalItemPrice = item.quantity * item.product.price;
      subTotal += totalItemPrice;
      totalItems += item.quantity;

      const imgUrl = item.product.imgUrl ?? 'https://via.placeholder.com/150';

      return {
        id: item.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        imgUrl: imgUrl,
        totalItemPrice: totalItemPrice,
        description: item.product.description,
        stock: item.product.stock,
      };
    });

    return {
      items: itemsResponse,
      totalItems,
      subTotal,
    };
  }
}
