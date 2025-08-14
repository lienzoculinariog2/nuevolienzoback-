import { Entity, PrimaryGeneratedColumn, OneToOne, OneToMany, Column } from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';

@Entity({ name: 'CARTS' })
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => Users)
  user: Users;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart)
  items: CartItem[];
}
