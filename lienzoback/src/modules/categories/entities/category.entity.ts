import { Products } from 'src/modules/products/entities/product.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ name: 'CATEGORIES' })
export class Categories {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  description: string;

  @Column({
    type: 'text',
    default: 'No image',
  })
  imgUrl?: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Products, (product) => product.categoryId)
  product: Products[];
}
