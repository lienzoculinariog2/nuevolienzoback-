import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from 'src/modules/users/entities/user.entity';
import { Products } from 'src/modules/products/entities/product.entity';

@Entity({ name: 'REVIEWS' })
export class Reviews {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'varchar', length: 255 })
  comment: string;

  // Relaciones
  @ManyToOne(() => Products, (product) => product.reviews)
  @JoinColumn({ name: 'product_id' })
  product: Products;

  @ManyToOne(() => Users, (user) => user.reviews)
  @JoinColumn({ name: 'user_id' })
  user: Users;
}
