import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { UpdateDiscountCodeDto } from './dto/update-discount-code.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DiscountCodes } from './entities/discount-codes.entity';
import { Like, Repository } from 'typeorm';
import { DiscountCodesUsed } from './entities/discount-codes-used.entity';
import { DiscountCodesFilterDto } from './dto/discount-codes-filter.dto';

@Injectable()
export class DiscountCodesService {
  constructor(
    @InjectRepository(DiscountCodes)
    private discountCodesRepository: Repository<DiscountCodes>,
    @InjectRepository(DiscountCodesUsed)
    private discountCodesUsedRepository: Repository<DiscountCodesUsed>,
  ) {}

  async createDiscountCode(createDto: CreateDiscountCodeDto): Promise<DiscountCodes> {
    const code = `${createDto.name.toUpperCase()}-LIENZO`;
    const { percentage, validUntil } = createDto;

    const newDiscount = this.discountCodesRepository.create({
      code,
      percentage,
      validUntil: new Date(validUntil),
      isSingleUsePerUser: true,
      isActive: true,
    });

    return this.discountCodesRepository.save(newDiscount);
  }

  async findAll(filterDto: DiscountCodesFilterDto): Promise<DiscountCodes[]> {
    const where: any = {};

    if (filterDto.partialCode) {
      where.code = Like(`%${filterDto.partialCode}%`);
    }

    if (filterDto.isActive !== undefined) {
      where.isActive = filterDto.isActive;
    }

    return this.discountCodesRepository.find({ where });
  }

  async canUserUseDiscount(userId: string, discountId: string): Promise<boolean> {
    const discount = await this.discountCodesRepository.findOne({
      where: { id: discountId },
    });

    if (!discount) {
      throw new BadRequestException('Discount code does not exist');
    }
    if (!discount.isActive) {
      throw new BadRequestException('Discount code is not active ');
    }
    if (discount.validUntil < new Date()) {
      throw new BadRequestException('Discount code has expired');
    }

    if (discount.isSingleUsePerUser) {
      const usedCode = await this.discountCodesUsedRepository.findOne({
        where: {
          discountCode: { id: discount.id },
          order: { user: { id: userId } },
        },
        relations: ['order', 'order.user'],
      });
      if (usedCode) {
        throw new BadRequestException('This discount code has already been used.');
      }
    }
    return true;
  }

  async findOne(code: string): Promise<DiscountCodes> {
    const discount = await this.discountCodesRepository.findOne({
      where: { code, isActive: true },
    });

    if (!discount) {
      throw new NotFoundException('Descuento inválido');
    }

    const currentDate = new Date();
    const discountDate = new Date(discount.validUntil);
    const today = new Date();

    discountDate.setHours(23, 59, 59, 999); // Último momento del día de validez
    today.setHours(0, 0, 0, 0); // Primer momento del día actual

    if (discountDate < today) {
      throw new BadRequestException(
        `This discount code expired on ${new Date(discount.validUntil).toDateString()}.`,
      );
    }
    return discount;
  }

  async update(id: string, updateDiscountCodeDto: UpdateDiscountCodeDto): Promise<DiscountCodes> {
    const discount = await this.discountCodesRepository.findOne({ where: { id } });
    if (!discount) {
      throw new NotFoundException('Discount code not found.');
    }

    if (updateDiscountCodeDto.percentage !== undefined) {
      discount.percentage = updateDiscountCodeDto.percentage;
    }
    if (updateDiscountCodeDto.validUntil !== undefined) {
      discount.validUntil = new Date(updateDiscountCodeDto.validUntil);
    }
    if (updateDiscountCodeDto.isSingleUsePerUser !== undefined) {
      discount.isSingleUsePerUser = updateDiscountCodeDto.isSingleUsePerUser;
    }
    if (updateDiscountCodeDto.isActive !== undefined) {
      discount.isActive = updateDiscountCodeDto.isActive;
    }

    return this.discountCodesRepository.save(discount);
  }

  async inactivate(id: string): Promise<void> {
    const result = await this.discountCodesRepository.update(id, { isActive: false });
    if (result.affected === 0) {
      throw new NotFoundException(`Discount code with ID "${id}" not found.`);
    }
  }

  async activate(id: string): Promise<void> {
    const result = await this.discountCodesRepository.update(id, { isActive: true });
    if (result.affected === 0) {
      throw new NotFoundException(`Discount code with ID "${id}" not found.`);
    }
  }
}
