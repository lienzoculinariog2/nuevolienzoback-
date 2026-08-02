import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Users } from 'src/modules/users/entities/user.entity';
import { OrderDetail } from 'src/modules/orders/entities/order-detail.entity';
import { DiscountCodesUsed } from 'src/modules/discount-codes/entities/discount-codes-used.entity';

import { Payment } from 'src/modules/payments/entities/payment.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@Entity({ name: 'orders' })
export class Orders {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'date', type: 'date', default: () => 'CURRENT_DATE' })
  date: Date = new Date();

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'total', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'statusOrder', type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'shipping_address', type: 'character varying', nullable: true })
  shippingAddress: any;

  @Column({ name: 'is_paid', type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ name: 'stripe_payment_intent_id', type: 'character varying', nullable: true })
  stripePaymentIntentId: string;

  @Column({ name: 'stripe_charge_id', type: 'character varying', nullable: true })
  stripeChargeId: string;

  @Column({ name: 'payment_status', type: 'character varying', nullable: true })
  paymentStatus: string;

  @Column({ name: 'discount_code_id', type: 'uuid', nullable: true })
  discountCodeId: string;

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
