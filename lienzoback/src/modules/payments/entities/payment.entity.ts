import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Orders } from '../../orders/entities/order.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REQUIRES_ACTION = 'requires_action',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  MERCADOPAGO = 'mercadopago',
}

export enum PaymentType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  PARTIAL_REFUND = 'partial_refund',
}

@Entity({ name: 'payments' })
@Index(['stripePaymentIntentId'], { unique: true })
@Index(['orderId'])
@Index(['status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Orders, (order) => order.payments)
  @JoinColumn({ name: 'orderId' })
  order: Orders;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.STRIPE,
  })
  provider: PaymentProvider;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.PAYMENT,
  })
  type: PaymentType;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'usd' })
  currency: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeChargeId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeRefundId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerEmail: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  errorDetails: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  idempotencyKey: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  get isRefunded(): boolean {
    return this.refundedAmount > 0;
  }

  get isFullyRefunded(): boolean {
    return this.refundedAmount >= this.amount;
  }

  get remainingAmount(): number {
    return this.amount - this.refundedAmount;
  }

  get canRefund(): boolean {
    return this.status === PaymentStatus.SUCCEEDED && this.remainingAmount > 0;
  }
}
