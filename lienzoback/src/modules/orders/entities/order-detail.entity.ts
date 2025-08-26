import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Orders } from 'src/modules/orders/entities/order.entity';
import { Products } from 'src/modules/products/entities/product.entity';

@Entity({ name: 'orders_detail' })
export class OrderDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column()
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ManyToOne(() => Products, (product) => product.orderDetails)
  @JoinColumn({ name: 'product_id' })
  product: Products;

  @ManyToOne(() => Orders, (order) => order.orderDetails)
  @JoinColumn({ name: 'order_id' })
  order: Orders;
}
