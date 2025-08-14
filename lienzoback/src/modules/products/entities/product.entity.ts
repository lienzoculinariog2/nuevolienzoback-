import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Categories } from 'src/modules/categories/entities/category.entity';
import { OrderDetail } from 'src/modules/orders/entities/order-detail.entity';
import { Reviews } from 'src/modules/product-review/entities/review.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

@Entity('products')
export class Products {
  @ApiProperty({ example: 'uuid-product-id', description: 'ID único del producto' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Salmón al Horno con Espárragos', description: 'Nombre del producto' })
  @Column({ length: 100, unique: true })
  name: string;

  @ApiProperty({ example: 'Filete de salmón fresco horneado...', description: 'Descripción del producto' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ example: 750, description: 'Precio del producto' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ example: 25, description: 'Cantidad en stock' })
  @Column()
  stock: number;

  @ApiPropertyOptional({ example: 'https://imagen.jpg', description: 'URL de la imagen del producto' })
  @Column({ type: 'text', nullable: true })
  imgUrl?: string | null;

  @ApiProperty({ example: true, description: 'Estado activo o inactivo del producto' })
  @Column({ default: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: 2, description: 'Nivel calórico del producto' })
  @Column({ type: 'int', nullable: true })
  caloricLevel: number;

  @ApiPropertyOptional({ example: ['salmón', 'espárragos', 'limón'], description: 'Lista de ingredientes' })
  @Column('simple-array', { nullable: true })
  ingredients: string[];

  @ApiProperty({ description: 'Categoría a la que pertenece el producto', type: () => Categories })
  @ManyToOne(() => Categories, (category) => category.product)
  @JoinColumn({ name: 'category_id' })
  category: Categories;
  orderDetails: any;
  reviews: any;

  // Relación con reviews y orderDetails omitida en la documentación para simplificar
}

