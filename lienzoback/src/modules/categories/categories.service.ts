import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import dataProducts from '../../data.Products.json';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Categories } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Products } from '../products/entities/product.entity';
import { FileUploadService } from '../file-upload/file-upload.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Categories) private readonly categoriesRepository: Repository<Categories>,
    @InjectRepository(Products) private readonly productsRepository: Repository<Products>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async seederService() {
    const categoriesNames = new Map();
    dataProducts.forEach((product) => {
      if (!categoriesNames.has(product.category.name)) {
        categoriesNames.set(product.category.name, product.category.description);
      }
    });

    const categoriesArray = Array.from(categoriesNames).map(([name, description]) => ({
      name,
      description,
    }));

    await this.categoriesRepository.upsert(categoriesArray, ['name']);

    return {
      message: 'Categories seeded successfully',
      count: categoriesArray.length,
      categories: categoriesArray,
    };
  }

  async create(categoryDto: CreateCategoryDto, file?: Express.Multer.File) {
    const existingCategory = await this.categoriesRepository.findOne({
      where: { name: categoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException(`Category '${categoryDto.name}' already exists`);
    }

    let imgUrl: string | undefined;

    if (file) {
      const cloudinaryResponse = await this.fileUploadService.uploadImageForCategory(file);

      if (!cloudinaryResponse.secure_url) {
        throw new Error('Cloudinary upload did not return a secure URL');
      }

      imgUrl = cloudinaryResponse.secure_url;
    }

    const category = this.categoriesRepository.create({
      ...categoryDto,
      imgUrl,
    });

    await this.categoriesRepository.save(category);

    return { message: 'Category successfully added', category };
  }

  async findAll(page: number, limit: number) {
    let categories: Categories[] = await this.categoriesRepository.find();
    const start = (page - 1) * limit;
    const end = start + limit;
    categories = categories.slice(start, end);
    return categories;
  }

  async findOne(id: string) {
    const categoryById = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!categoryById) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return categoryById;
  }

  async update(id: string, categoryDto: UpdateCategoryDto, file?: Express.Multer.File) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    if (categoryDto.name !== undefined) {
      category.name = categoryDto.name;
    }
    if (categoryDto.description !== undefined) {
      category.description = categoryDto.description;
    }

    await this.categoriesRepository.save(category);

    return { message: 'Category successfully updated', updatedCategory: category };
  }

  async inactivate(id: string) {
    const categoryToInactivate = await this.categoriesRepository.findOne({ where: { id } });

    if (!categoryToInactivate) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    const productsCount = await this.productsRepository.count({
      where: { categoryId: categoryToInactivate },
    });

    if (productsCount > 0) {
      throw new ConflictException(
        `Category cannot be inactivated, ${productsCount} products are still assigned to this category.`,
      );
    }

    categoryToInactivate.isActive = false;
    await this.categoriesRepository.save(categoryToInactivate);

    return { message: 'Category inactivated successfully.', category: categoryToInactivate };
  }
}
