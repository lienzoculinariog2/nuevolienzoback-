import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Products } from 'src/modules/products/entities/product.entity';

@Entity('INGREDIENTS')
export class Ingredients {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  name: string;

  @ManyToMany(() => Products, (product) => product.ingredients)
  products: Products[];
}
