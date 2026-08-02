import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Query } from '@nestjs/common';
import { DiscountCodesService } from './discount-codes.service';
import { CreateDiscountCodeDto } from './dto/create-discount-code.dto';
import { UpdateDiscountCodeDto } from './dto/update-discount-code.dto';
import { DiscountCodes } from './entities/discount-codes.entity';
import { DiscountCodesFilterDto } from './dto/discount-codes-filter.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('discount-codes')
export class DiscountCodesController {
  constructor(private readonly discountCodesService: DiscountCodesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a discount code (for administrators only)' })
  async createDiscountCode(@Body() createDto: CreateDiscountCodeDto) {
    const newCode = await this.discountCodesService.createDiscountCode(createDto);

    return {
      message: 'Discount code successfully generated.',
      code: newCode.code,
      percentage: newCode.percentage,
      validUntil: newCode.validUntil,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all discount codes - optional filters (for administrators only)',
  })
  async findAll(@Query() filterDto: DiscountCodesFilterDto): Promise<DiscountCodes[]> {
    const discounts = await this.discountCodesService.findAll(filterDto);
    return discounts;
  }

  @Get(':code')
  @ApiOperation({ summary: 'Find a discount code by its name (for administrators only)' })
  async findOne(@Param('code') code: string) {
    const discount = await this.discountCodesService.findOne(code);

    return {
      message: 'Discount code is valid.',
      code: discount.code,
      percentage: discount.percentage,
      validUntil: discount.validUntil,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a discount code by id (for administrators only)' })
  update(@Param('id') id: string, @Body() updateDiscountCodeDto: UpdateDiscountCodeDto) {
    return this.discountCodesService.update(id, updateDiscountCodeDto);
  }

  @Put('inactivate/:id')
  @ApiOperation({ summary: 'Inactivate a discount code by id (for administrators only)' })
  async inactivate(@Param('id') id: string) {
    await this.discountCodesService.inactivate(id);
    return { message: 'Discount code successfully inactivated.' };
  }

  @Put('activate/:id')
  @ApiOperation({ summary: 'Activate a discount code by id (for administrators only)' })
  async activate(@Param('id') id: string) {
    await this.discountCodesService.activate(id);
    return { message: 'Discount code successfully activated.' };
  }
}
