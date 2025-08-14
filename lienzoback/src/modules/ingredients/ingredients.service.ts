import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredients } from './entities/ingredient.entity';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import dataProducts from '../../data.Products.json';

@Injectable()
export class IngredientsService {
  constructor(
    @InjectRepository(Ingredients)
    private readonly ingredientsRepository: Repository<Ingredients>,
  ) {}

  async seedIngredients(): Promise<void> {
    const uniqueIngredientNames = new Set<string>();
    dataProducts.forEach((product) =>
      product.ingredients.forEach((i) => uniqueIngredientNames.add(i.name)),
    );
    const ingredientsToSeed = Array.from(uniqueIngredientNames).map((name) =>
      this.ingredientsRepository.create({ name }),
    );
    await this.ingredientsRepository.save(ingredientsToSeed, { chunk: 100 });
  }

  async create(dto: CreateIngredientDto): Promise<Ingredients> {
    const existingIngredient = await this.ingredientsRepository.findOne({
      where: { name: dto.name },
    });
    if (existingIngredient) {
      throw new ConflictException(`The ingredient '${dto.name}' already exists.`);
    }
    const newIngredient = this.ingredientsRepository.create(dto);
    return this.ingredientsRepository.save(newIngredient);
  }

  async findOrCreate(name: string): Promise<Ingredients> {
    let ingredient = await this.ingredientsRepository.findOne({
      where: { name },
    });
    if (!ingredient) {
      ingredient = this.ingredientsRepository.create({ name });
      await this.ingredientsRepository.save(ingredient);
    }
    return ingredient;
  }

  async findAll(): Promise<Ingredients[]> {
    return this.ingredientsRepository.find();
  }

  async findOne(id: string): Promise<Ingredients> {
    const ingredient = await this.ingredientsRepository.findOneBy({ id });
    if (!ingredient) {
      throw new NotFoundException(`Ingredient with ID '${id}' not found.`);
    }
    return ingredient;
  }

  async update(id: string, dto: UpdateIngredientDto): Promise<Ingredients> {
    const ingredient = await this.findOne(id);
    this.ingredientsRepository.merge(ingredient, dto);
    return this.ingredientsRepository.save(ingredient);
  }
}
