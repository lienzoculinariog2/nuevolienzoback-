import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Orders } from 'src/modules/orders/entities/order.entity';
import { Products } from 'src/modules/products/entities/product.entity';

@Entity({ name: 'orders_detail' })
export class OrderDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'orderId' })
  orderId: string;

  @Column({ name: 'productId' })
  productId: string;

  @Column()
  quantity: number;

  @Column({ name: 'unitPrice', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'createdAt', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => Products, (product) => product.orderDetails)
  @JoinColumn({ name: 'productId' })
  product: Products;

  @ManyToOne(() => Orders, (order) => order.orderDetails)
  @JoinColumn({ name: 'orderId' })
  order: Orders;
}
