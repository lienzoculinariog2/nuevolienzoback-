import { Entity, PrimaryGeneratedColumn, OneToOne, OneToMany, Column, JoinColumn } from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';

@Entity({ name: 'CARTS' })
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  isActive: boolean;

  @OneToOne(() => Users)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart)
  items: CartItem[];
}
