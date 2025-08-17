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
      relations: ['items', 'items.product', 'user'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart for user with id ${userId} not found`);
    }

    return cart;
  }

  async findAllActive() {
    return this.cartRepository.find({
      where: { isActive: true },
      relations: ['items', 'items.product', 'user'],
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

    // Si el carrito no existe, se crea con isActive en false
    if (!cart) {
      cart = this.cartRepository.create({
        user: user,
        isActive: false, // <-- Creado inicialmente como false
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

    // ➡️ Lógica para calcular la nueva cantidad total
    const newTotalQuantity = (cartItem ? cartItem.quantity : 0) + quantity;

    // ➡️ La validación ahora usa la cantidad total
    if (product.stock < newTotalQuantity) {
      throw new BadRequestException(
        `Not enough stock for product with id ${productId}. Available: ${product.stock}, Requested: ${newTotalQuantity}`,
      );
    }
    // Si el carrito está inactivo (es decir, está vacío al inicio de esta operación)
    // y se va a añadir el primer artículo, se marca como activo.
    if (!cart.isActive && cart.items.length === 0) {
      cart.isActive = true; // <-- Pasa a true cuando se añade el primer artículo
      await this.cartRepository.save(cart); // Guarda el cambio de estado del carrito
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

      // ➡️ Encuentra el ítem existente en el carrito
      let cartItem = cart.items.find((item) => item.product.id === productId);

      // ➡️ Calcula la nueva cantidad total que habría en el carrito
      const newTotalQuantity = (cartItem ? cartItem.quantity : 0) + quantity;

      // ❗ Nueva validación: Compara el stock con la cantidad total
      if (product.stock < newTotalQuantity) {
        throw new BadRequestException(
          `Not enough stock for product with id ${productId}. Available: ${product.stock}, Requested: ${newTotalQuantity}`,
        );
      }

      // Si la validación pasa, actualiza o crea el ítem
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

    const failedUpdates: { itemId: string; error: string }[] = [];
    const successfulUpdates: string[] = [];

    for (const updateItem of updateCartDto.updates) {
      const { itemId, quantity } = updateItem;
      const cartItem = cart.items.find((item) => item.id === itemId);

      if (!cartItem) {
        failedUpdates.push({ itemId, error: `CartItem with ID ${itemId} not found` });
        continue;
      }

      const product = await this.productsRepository.findOne({
        where: { id: cartItem.product.id },
      });

      if (!product) {
        failedUpdates.push({ itemId, error: `Product with ID ${cartItem.product.id} not found` });
        continue;
      }

      if (quantity <= 0) {
        await this.cartItemRepository.delete(cartItem.id);
        cart.items = cart.items.filter((item) => item.id !== itemId);
        successfulUpdates.push(`Item with ID ${itemId} removed from cart.`);
      } else {
        if (product.stock < quantity) {
          failedUpdates.push({
            itemId,
            error: `Not enough stock for product with id ${product.id}. Available: ${product.stock}, Requested: ${quantity}`,
          });
          continue;
        }

        cartItem.quantity = quantity;
        await this.cartItemRepository.save(cartItem);
        successfulUpdates.push(`Item with ID ${itemId} updated successfully.`);
      }
    }

    // Ahora, se decide la respuesta según los resultados.
    const updatedCart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (failedUpdates.length > 0) {
      throw new HttpException(
        {
          message: 'Some items could not be updated.',
          successfulUpdates,
          failedUpdates,
        },
        HttpStatus.PARTIAL_CONTENT,
      );
    }

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

      const imgUrl = item.product.imgUrl ?? 'https://via.placeholder.com/150';

      return {
        id: item.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        imgUrl: imgUrl,
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
