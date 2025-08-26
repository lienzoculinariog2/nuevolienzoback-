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

  @Column({ name: 'userId' })
  userId: string;

  @Column({ name: 'totalAmount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'shippingAddress', type: 'jsonb', nullable: true })
  shippingAddress: any;

  @Column({ name: 'billingAddress', type: 'jsonb', nullable: true })
  billingAddress: any;

  @Column({ name: 'discountCodeId', type: 'uuid', nullable: true })
  discountCodeId: string;

  @Column({ name: 'discountAmount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'createdAt', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updatedAt', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToOne(() => Users, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: Users;

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order)
  orderDetails: OrderDetail[];

  @OneToMany(() => DiscountCodesUsed, (discountCodesUsed) => discountCodesUsed.order)
  discountCodesUsed: DiscountCodesUsed[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];
}
