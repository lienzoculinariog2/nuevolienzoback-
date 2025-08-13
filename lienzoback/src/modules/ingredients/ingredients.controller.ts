import { Controller, Get, Post, Body, Param, Patch, Put, ParseUUIDPipe } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { Ingredients } from './entities/ingredient.entity';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  async create(@Body() createIngredientDto: CreateIngredientDto): Promise<Ingredients> {
    return this.ingredientsService.create(createIngredientDto);
  }

  @Get()
  async findAll(): Promise<Ingredients[]> {
    return this.ingredientsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Ingredients> {
    return this.ingredientsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateIngredientDto: UpdateIngredientDto,
  ): Promise<Ingredients> {
    return this.ingredientsService.update(id, updateIngredientDto);
  }
}
