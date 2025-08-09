import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Products } from './entities/product.entity';
import { Categories } from '../categories/entities/category.entity';
import { GetProductsFilterDto } from './dto/get-productsFilter.dto';
import dataProducts from '../../data.Products.json';
import { OrderDetail } from '../orders/entities/order-detail.entity';
import { OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
    @InjectRepository(Categories)
    private readonly categoriesRepository: Repository<Categories>,
    @InjectRepository(OrderDetail)
    private readonly ordersDetailRepository: Repository<OrderDetail>,
  ) {}

  async seeder() {
    const categories: Categories[] = await this.categoriesRepository.find();

    const newProducts: Products[] = dataProducts.map((element) => {
      const category: Categories | undefined = categories.find(
        (category) => element.category.name === category.name,
      );

      if (!category) {
        throw new Error(
          `Category '${element.category.name}' not found. Cannot seed product '${element.name}'.`,
        );
      }

      const newProduct = new Products();
      newProduct.name = element.name;
      newProduct.description = element.description;
      newProduct.price = element.price;
      newProduct.stock = element.stock;
      newProduct.imgUrl = element.imgUrl;
      newProduct.caloricLevel = element.caloricLevel;
      newProduct.ingredients = element.ingredients;

      newProduct.category = category;

      return newProduct;
    });
    await this.productsRepository.upsert(newProducts, ['name']);

    return {
      message: 'Products seeded successfully',
      count: newProducts.length,
      newProducts,
    };
  }

  async create(dto: CreateProductDto): Promise<Products> {
    const category = await this.categoriesRepository.findOneBy({
      id: dto.categoryId,
    });
    if (!category) {
      throw new NotFoundException(`Categoría con ID ${dto.categoryId} no encontrada.`);
    }

    const existingProduct = await this.productsRepository.findOne({
      where: { name: dto.name },
    });
    if (existingProduct) {
      throw new ConflictException(`Ya existe un producto con el nombre "${dto.name}".`);
    }

    const product = this.productsRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      caloricLevel: dto.caloricLevel,
      ingredients: dto.ingredients ?? [],
      isActive: dto.isActive ?? true,
      category: category,
      imgUrl: dto.imgUrl,
    });

    return await this.productsRepository.save(product);
  }

  async findAll(filterDto: GetProductsFilterDto): Promise<Products[]> {
    const { name, price_min, price_max, isActive, categoryId, sortBy, order = 'asc' } = filterDto;

    const query = this.productsRepository.createQueryBuilder('product');

    if (categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (name) {
      query.andWhere('product.name ILIKE :name', { name: `%${name}%` });
    }

    if (price_min) {
      query.andWhere('product.price >= :price_min', { price_min });
    }

    if (price_max) {
      query.andWhere('product.price <= :price_max', { price_max });
    }

    if (isActive !== undefined) {
      query.andWhere('product.isActive = :isActive', { isActive });
    }

    if (sortBy) {
      const orderDirection = order.toUpperCase() as 'ASC' | 'DESC';
      query.orderBy(`product.${sortBy}`, orderDirection);
    }

    return await query.getMany();
  }

  // async findAll(page: number = 1, limit: number = 5): Promise<Products[]> {
  //   if (!page || !limit) {
  //     return this.productsRepository.find();
  //   }

  //   return this.productsRepository.find({
  //     skip: (page - 1) * limit,
  //     take: limit,
  //   });
  // }

  async getProductById(id: string): Promise<Products | null> {
    const product = await this.productsRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Products> {
    const product = await this.productsRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }

    Object.assign(product, updateProductDto);

    return this.productsRepository.save(product);
  }

  async inactivateProduct(id: string): Promise<Products> {
    const productToInactivate = await this.productsRepository.findOne({
      where: { id },
    });
    if (!productToInactivate) {
      throw new NotFoundException(`Product with ${id} not found.`);
    }

    if (productToInactivate.stock > 0) {
      throw new ConflictException(
        `Cannot inactivate the product with ID ${id}, it has available stock.`,
      );
    }

    const activeOrdersCount = await this.ordersDetailRepository.count({
      where: {
        product: { id },
        order: {
          statusOrder: Not(In([OrderStatus.CANCELED, OrderStatus.DELIVERED])),
        },
      },
    });

    if (activeOrdersCount > 0) {
      throw new ConflictException(
        `Cannot inactivate the product with ID ${id}, it has ${activeOrdersCount} active orders.`,
      );
    }

    productToInactivate.isActive = false;
    return this.productsRepository.save(productToInactivate);
  }
}
