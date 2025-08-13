import { CartItem } from 'src/modules/cart/entities/cart-item.entity';
import { Categories } from 'src/modules/categories/entities/category.entity';
import { Ingredients } from 'src/modules/ingredients/entities/ingredient.entity';
import { OrderDetail } from 'src/modules/orders/entities/order-detail.entity';
import { Reviews } from 'src/modules/product-review/entities/review.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

import { OneToMany } from 'typeorm';

@Entity('PRODUCTOS')
export class Products {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  stock: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  imgUrl?: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  caloricLevel: number;

  @ManyToMany(() => Ingredients, (ingredient) => ingredient.products, {
    cascade: true,
  })
  @JoinTable({
    name: 'PRODUCTS_INGREDIENTS',
    joinColumn: {
      name: 'products_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'ingredients_id',
      referencedColumnName: 'id',
    },
  })
  ingredients: Ingredients[];

  @ManyToOne(() => Categories, (category) => category.product)
  @JoinColumn({ name: 'category_id' })
  category: Categories;
  secure_url: string | undefined;

  @OneToMany(() => Reviews, (review) => review.product)
  reviews: Reviews[];

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.product)
  orderDetails: OrderDetail[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems: CartItem[];
}
