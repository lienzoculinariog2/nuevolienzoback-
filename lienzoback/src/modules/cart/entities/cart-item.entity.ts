import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cart } from './cart.entity';
import { Products } from '../../products/entities/product.entity';

@Entity({ name: 'CART_ITEMS' })
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quantity: number;

  @ManyToOne(() => Cart, (cart) => cart.items)
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @ManyToOne(() => Products, (product) => product.cartItems)
  @JoinColumn({ name: 'product_id' })
  product: Products;
}
