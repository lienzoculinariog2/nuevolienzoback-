import { Controller, Get, Post, Body, Param, Patch, Put, ParseUUIDPipe } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { Ingredients } from './entities/ingredient.entity';
import { ApiOperation } from '@nestjs/swagger';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ingredient (for administrators only)' })
  async create(@Body() createIngredientDto: CreateIngredientDto): Promise<Ingredients> {
    return this.ingredientsService.create(createIngredientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ingredients (for administrators only)' })
  async findAll(): Promise<Ingredients[]> {
    return this.ingredientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an ingredient by id (for administrators only)' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Ingredients> {
    return this.ingredientsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing ingredient (for administrators only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIngredientDto: UpdateIngredientDto,
  ): Promise<Ingredients> {
    return this.ingredientsService.update(id, updateIngredientDto);
  }
}
