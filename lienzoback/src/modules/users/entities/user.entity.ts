import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Orders } from 'src/modules/orders/entities/order.entity';
import { Reviews } from 'src/modules/product-review/entities/review.entity';
import { DiscountCodesUsed } from 'src/modules/discount-codes/entities/discount-codes-used.entity';
import { Categories } from 'src/modules/categories/entities/category.entity';
import { Cart } from 'src/modules/cart/entities/cart.entity';

export enum Diet {
  GENERAL = 'general',
  VEGETARIANO = 'vegetariano',
  CELIACO = 'celiaco',
  FITNESS = 'fitness',
}

export enum Roles {
  CUSTOMER = 'user',
  ADMIN = 'admin',
  BANNED = 'banned',
}

@Entity({ name: 'users' })
export class Users {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true })
  email: string;

  // --- CORRECCIÓN DE SEGURIDAD ---
  // Añadimos `{ select: false }` a la columna de la contraseña.
  // Esto le dice a TypeORM que NUNCA incluya este campo en las consultas
  // a menos que se pida explícitamente.
  // Así, nunca se enviará al frontend.
  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'bigint', nullable: true })
  phone: number;

  @Column({
    type: 'enum',
    enum: Diet,
    default: Diet.GENERAL,
  })
  diet: Diet;

  @Column({ type: 'timestamp', nullable: true })
  birthday: Date;

  @Column({
    type: 'enum',
    enum: Roles,
    default: Roles.CUSTOMER,
  })
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
  cart: Cart;
}
