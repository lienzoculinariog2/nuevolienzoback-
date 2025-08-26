import { Entity, PrimaryGeneratedColumn, OneToOne, OneToMany, Column, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';

@Entity({ name: 'carts' })
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId: string;

  @Column({ name: 'isActive', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @OneToOne(() => Users)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, { cascade: true })
  items: CartItem[];
}
