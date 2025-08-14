import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from 'src/modules/users/entities/user.entity';
import { DiscountCodes } from 'src/modules/discount-codes/entities/discount-codes.entity';
import { Orders } from 'src/modules/orders/entities/order.entity';

@Entity({ name: 'discount_codes_used' })
export class DiscountCodesUsed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Users, (user) => user.discountCodesUsed)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => DiscountCodes, (discountCode) => discountCode.discountCodesUsed)
  @JoinColumn({ name: 'discount_code_id' })
  discountCode: DiscountCodes;

  @ManyToOne(() => Orders, (order) => order.discountCodesUsed)
  @JoinColumn({ name: 'order_id' })
  order: Orders;
}
