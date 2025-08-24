import { Products } from 'src/modules/products/entities/product.entity';
import { Users } from 'src/modules/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ name: 'categories' })
export class Categories {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false, default: 'Sin descripción' })
  description: string;

  @Column({
    type: 'text',
    default: 'No image',
  })
  imgUrl?: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Products, (product) => product.category)
  product: Products[];

  // categoría de preferencia de un usuario
  @OneToMany(() => Users, (user) => user.category)
  users: Users[];
}
