import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Orders } from '../../orders/entities/order.entity';
import { OrderDetail } from '../../orders/entities/order-detail.entity';
import { Products } from '../../products/entities/product.entity';

@Injectable()
export class PaymentCalculationService {
  constructor(
    @InjectRepository(Orders)
    private readonly ordersRepository: Repository<Orders>,
    @InjectRepository(OrderDetail)
    private readonly orderDetailsRepository: Repository<OrderDetail>,
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
  ) {}

  /**
   * Calculate payment amount based on order items and discounts
   * This ensures the amount is calculated server-side, not trusted from client
   */
  async calculateOrderAmount(orderId: string): Promise<{
    subtotal: number;
    discount: number;
    total: number;
    currency: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  }> {
    // Get order with details
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['orderDetails', 'orderDetails.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.orderDetails.length === 0) {
      throw new BadRequestException(`Order ${orderId} has no items`);
    }

    // Calculate subtotal from order details
    let subtotal = 0;
    const items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const detail of order.orderDetails) {
      // Get product information
      const product = await this.productsRepository.findOne({
        where: { id: detail.product.id },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${detail.product.id} not found`);
      }

      // Validate that the unit price in order detail matches current product price
      if (detail.unitPrice !== product.price) {
        throw new BadRequestException(
          `Price mismatch for product ${product.id}. Expected: ${product.price}, Got: ${detail.unitPrice}`
        );
      }

      const itemTotal = detail.unitPrice * detail.quantity;
      subtotal += itemTotal;

      items.push({
        productId: detail.product.id,
        productName: product.name,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        totalPrice: itemTotal,
      });
    }

    // Calculate discount (if any)
    let discount = 0;
    // TODO: Implement discount calculation based on discount codes
    // For now, we'll use a placeholder
    discount = 0;

    const total = subtotal - discount;

    // Validate total matches order total
    if (Math.abs(total - order.totalAmount) > 0.01) {
      throw new BadRequestException(
        `Total mismatch. Calculated: ${total}, Order total: ${order.totalAmount}`
      );
    }

    return {
      subtotal,
      discount,
      total,
      currency: 'usd', // Default currency
      items,
    };
  }

  /**
   * Validate that the provided amount matches the calculated amount
   */
  async validatePaymentAmount(orderId: string, providedAmount: number): Promise<boolean> {
    const calculated = await this.calculateOrderAmount(orderId);
    return Math.abs(calculated.total - providedAmount) < 0.01;
  }

  /**
   * Get order summary for payment
   */
  async getOrderSummary(orderId: string): Promise<{
    orderId: string;
    customerEmail?: string;
    description: string;
    amount: number;
    currency: string;
    items: any[];
  }> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'orderDetails', 'orderDetails.product'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const calculation = await this.calculateOrderAmount(orderId);

    return {
      orderId,
      customerEmail: order.user?.email,
      description: `Payment for order #${orderId}`,
      amount: calculation.total,
      currency: calculation.currency,
      items: calculation.items,
    };
  }
}
