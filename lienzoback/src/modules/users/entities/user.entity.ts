// import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
// import { Category } from './category.entity';
// import { Order } from './order.entity';
// import { Review } from './review.entity';
// import { DiscountCodesUsed } from './discount-codes-used.entity';
// import { Categories } from 'src/modules/categories/entities/category.entity';

// @Entity('users')
// export class User {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ length: 255 })
//   name: string;

//   @Column({ length: 255, unique: true })
//   email: string;

//   @Column({ name: 'password', length: 255 })
//   passwordHash: string;

//   @Column({ nullable: true })
//   address: string;

//   @Column({ type: 'bigint', nullable: true })
//   phone: number;

//   @Column({ type: 'date', nullable: true })
//   birthday: Date;

//   @Column({ type: 'enum', enum: ['admin', 'user', 'guest'], default: 'user' })
//   isAdmin: string;

//   @Column({ nullable: true })
//   categoryId: string;

//   @ManyToOne(() => Categories, (category) => category.users)
//   @JoinColumn({ name: 'categoryId' })
//   category: Category;

//   //   @OneToMany(() => Order, (order) => order.user)
//   //   orders: Order[];

//   //   @OneToMany(() => Review, (review) => review.user)
//   //   reviews: Review[];

//   //   @OneToMany(() => DiscountCodesUsed, (discountCodeUsed) => discountCodeUsed.user)
//   //   discountCodesUsed: DiscountCodesUsed[];
// }
