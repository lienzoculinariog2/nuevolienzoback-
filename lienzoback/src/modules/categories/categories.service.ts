import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import dataProducts from '../../data.Products.json';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Categories } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Products } from '../products/entities/product.entity';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import toStream from 'buffer-to-stream';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Categories) private readonly categoriesRepository: Repository<Categories>,
    @InjectRepository(Products) private readonly productsRepository: Repository<Products>,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private async uploadImage(
    file: Express.Multer.File,
    folderName: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: folderName },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result!);
          }
        },
      );

      toStream(file.buffer).pipe(upload);
    });
  }

  async seeder() {
    const categoriesMap = new Map();
    dataProducts.forEach((product) => {
      if (!categoriesMap.has(product.category.name)) {
        categoriesMap.set(product.category.name, {
          description: product.category.description,
          imgUrl: product.category.imgUrl,
        });
      }
    });

    const categoriesArray = Array.from(categoriesMap).map(([name, data]) => ({
      name,
      description: data.description,
      imgUrl: data.imgUrl,
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
      const cloudinaryResponse = await this.uploadImage(file, 'categories');

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

    if (file) {
      const cloudinaryResponse = await this.uploadImage(file, `categories/${id}`);

      if (cloudinaryResponse) {
        categoryDto.imgUrl = cloudinaryResponse.secure_url;
      }
    }
    await this.categoriesRepository.update(id, categoryDto);
    const updatedCategory = await this.categoriesRepository.findOne({
      where: { id },
    });
    return { message: 'Category successfully updated', updatedCategory };
  }

  async inactivate(id: string) {
    const categoryToInactivate = await this.categoriesRepository.findOne({ where: { id } });

    if (!categoryToInactivate) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    const productsCount = await this.productsRepository.count({
      where: { category: categoryToInactivate },
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
