import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Cart } from './cart.entity';
import { Products } from '../../products/entities/product.entity';

@Entity({ name: 'cart_items' })
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cartId', type: 'uuid' })
  cartId: string;

  @Column({ name: 'productId', type: 'uuid' })
  productId: string;

  @Column({ name: 'quantity', default: 1 })
  quantity: number;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @ManyToOne(() => Cart, (cart) => cart.items)
  @JoinColumn({ name: 'cartId' })
  cart: Cart;

  @ManyToOne(() => Products, (product) => product.cartItems)
  @JoinColumn({ name: 'productId' })
  product: Products;
}
