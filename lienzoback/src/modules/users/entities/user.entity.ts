import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Orders } from 'src/modules/orders/entities/order.entity';
import { Reviews } from 'src/modules/product-review/entities/review.entity';
import { DiscountCodesUsed } from 'src/modules/discount-codes/entities/discount-codes-used.entity';
import { Categories } from 'src/modules/categories/entities/category.entity';
import { Cart } from 'src/modules/cart/entities/cart.entity';

export enum Roles {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

@Entity({ name: 'users' })
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  password: string;

  @Column({ type: 'text', nullable: false })
  address: string;

  @Column({ type: 'bigint', nullable: false })
  phone: number;

  @Column({ type: 'date' })
  birthday: Date;

  @Column({ type: 'enum', enum: Roles, default: Roles.USER })
  roles: Roles;

  @Column({ default: false })
  isSuscribed: boolean;

  @OneToMany(() => Orders, (order) => order.user)
  orders: Orders[];

  @OneToMany(() => Reviews, (review) => review.user)
  reviews: Reviews[];

  @OneToMany(() => DiscountCodesUsed, (discountCodesUsed) => discountCodesUsed.user)
  discountCodesUsed: DiscountCodesUsed[];

  @ManyToOne(() => Categories, (category) => category.users, {
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Categories;

  @OneToOne(() => Cart, (cart) => cart.user)
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;
}
