import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DiscountCodesUsed } from 'src/modules/discount-codes/entities/discount-codes-used.entity';

@Entity({ name: 'discount_codes' })
export class DiscountCodes {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number;

  @Column({ name: 'is_single_use_per_user', default: false })
  isSingleUsePerUser: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'valid_until', type: 'date' })
  validUntil: Date;

  @OneToMany(() => DiscountCodesUsed, (discountCodesUsed) => discountCodesUsed.discountCode)
  discountCodesUsed: DiscountCodesUsed[];
}
