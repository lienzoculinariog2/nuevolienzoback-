import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Users } from 'src/modules/users/entities/user.entity';
import { OrderDetail } from 'src/modules/orders/entities/order-detail.entity';
import { DiscountCodesUsed } from 'src/modules/discount-codes/entities/discount-codes-used.entity';

import { Payment } from 'src/modules/payments/entities/payment.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
  PAYMENT_FAILED = 'payment_failed',
}

@Entity({ name: 'orders' })
export class Orders {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ name: 'discount_id', type: 'int', nullable: true })
  discountId: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  statusOrder: OrderStatus;

  @Column({ name: 'is_paid', default: false })
  isPaid: boolean;

  @Column({ name: 'stripe_payment_intent_id', nullable: true })
  stripePaymentIntentId: string;

  @Column({ name: 'stripe_charge_id', nullable: true })
  stripeChargeId: string;

  @Column({ name: 'payment_status', nullable: true })
  paymentStatus: string;

  @Column({ name: 'shipping_address', nullable: true })
  shippingAddress: string;

  @ManyToOne(() => Users, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order)
  orderDetails: OrderDetail[];

  @OneToMany(() => DiscountCodesUsed, (discountCodesUsed) => discountCodesUsed.order)
  discountCodesUsed: DiscountCodesUsed[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];
}
