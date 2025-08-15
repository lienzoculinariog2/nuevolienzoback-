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
import { FileUploadService } from '../file-upload/file-upload.service';
import { Ingredients } from '../ingredients/entities/ingredient.entity';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
    @InjectRepository(Categories)
    private readonly categoriesRepository: Repository<Categories>,
    @InjectRepository(OrderDetail)
    private readonly ordersDetailRepository: Repository<OrderDetail>,
    @InjectRepository(Ingredients)
    private readonly ingredientsRepository: Repository<Ingredients>,
    private readonly fileUploadService: FileUploadService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async isPopulated(): Promise<boolean> {
    const productsCount = await this.productsRepository.count();
    return productsCount > 0;
  }

  async seedProducts(): Promise<void> {
    const categories: Categories[] = await this.categoriesRepository.find();
    const ingredients: Ingredients[] = await this.ingredientsRepository.find();

    const productsToSeed = dataProducts.map((productData) => {
      const category = categories.find((cat) => cat.name === productData.category.name);
      if (!category) {
        throw new NotFoundException(`Category ${productData.category.name} not found`);
      }

      const ingredientsForProduct = productData.ingredients
        .map((i) => ingredients.find((ing) => ing.name === i.name))
        .filter(Boolean) as Ingredients[];

      const newProduct = this.productsRepository.create({
        ...productData,
        category,
        ingredients: ingredientsForProduct,
      });
      return newProduct;
    });

    await this.productsRepository.save(productsToSeed, { chunk: 50 });
  }

  async create(dto: CreateProductDto, file: Express.Multer.File): Promise<Products> {
    const category = await this.categoriesRepository.findOneBy({
      id: dto.categoryId,
    });
    if (!category) {
      throw new NotFoundException(`Categoría con ID ${dto.categoryId} no encontrada.`);
    }
    if (!category.isActive) {
      await this.categoriesService.activate(dto.categoryId);
    }

    const existingProduct = await this.productsRepository.findOne({
      where: { name: dto.name },
    });
    if (existingProduct) {
      throw new ConflictException(`Ya existe un producto con el nombre "${dto.name}".`);
    }

    const ingredients: Ingredients[] = [];
    if (dto.ingredientIds && dto.ingredientIds.length > 0) {
      const foundIngredients = await this.ingredientsRepository.findBy({
        id: In(dto.ingredientIds),
      });

      if (foundIngredients.length !== dto.ingredientIds.length) {
        const foundIds = new Set(foundIngredients.map((i) => i.id));
        const notFoundIds = dto.ingredientIds.filter((id) => !foundIds.has(id));
        throw new NotFoundException(
          `Los siguientes ingredientes no fueron encontrados: ${notFoundIds.join(', ')}`,
        );
      }
      ingredients.push(...foundIngredients);
    }

    const product = this.productsRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      caloricLevel: dto.caloricLevel,
      ingredients: ingredients,
      isActive: dto.isActive ?? true,
      category: category,
      imgUrl: null,
    });

    const savedProduct = await this.productsRepository.save(product);

    if (file) {
      await this.fileUploadService.uploadImage(file, savedProduct.id);
    }

    return this.productsRepository.findOneOrFail({
      where: { id: savedProduct.id },
      relations: ['category', 'ingredients'],
    });
  }

  async findAll(filterDto: GetProductsFilterDto): Promise<Products[]> {
    const {
      name,
      price_min,
      price_max,
      isActive,
      categoryId,
      ingredient,
      sortBy,
      order = 'asc',
      page = 1,
      limit = 12,
    } = filterDto;

    const query = this.productsRepository.createQueryBuilder('product');
    query.leftJoinAndSelect('product.category', 'category');
    query.leftJoinAndSelect('product.ingredients', 'ingredients');

    // --- SECCIÓN DE FILTROS ---
    if (categoryId) {
      query.andWhere('product.category_id = :categoryId', { categoryId });
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
    if (ingredient) {
      query.andWhere('LOWER(ingredients.name) LIKE LOWER(:ingredientName)', {
        ingredientName: `%${ingredient}%`,
      });
    }
    if (sortBy) {
      const orderDirection = order.toUpperCase() as 'ASC' | 'DESC';
      query.orderBy(`product.${sortBy}`, orderDirection);
    } else {
      query.orderBy('product.name', 'ASC');
    }
    query.skip((page - 1) * limit).take(limit);

    return await query.getMany();
  }

  async getProductById(id: string): Promise<Products | null> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'ingredients'], // Incluir ingredientes
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    file: Express.Multer.File,
  ): Promise<Products> {
    const { categoryId, ingredientIds, ...productData } = updateProductDto;

    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['ingredients'],
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }
    if (categoryId) {
      const category = await this.categoriesRepository.findOneBy({ id: categoryId });
      if (!category) {
        throw new NotFoundException(`Categoría con ID ${categoryId} no encontrada.`);
      }
      if (!category.isActive) {
        await this.categoriesService.activate(categoryId);
      }
      product.category = category;
    }

    if (ingredientIds) {
      const foundIngredients = await this.ingredientsRepository.findBy({ id: In(ingredientIds) });
      if (foundIngredients.length !== ingredientIds.length) {
        const foundIds = new Set(foundIngredients.map((i) => i.id));
        const notFoundIds = ingredientIds.filter((id) => !foundIds.has(id));
        throw new NotFoundException(
          `Los siguientes ingredientes no fueron encontrados: ${notFoundIds.join(', ')}`,
        );
      }
      product.ingredients = foundIngredients;
    }

    if (file) {
      await this.fileUploadService.uploadImage(file, product.id);
    }

    Object.assign(product, productData);
    await this.productsRepository.save(product);

    return this.productsRepository.findOneOrFail({
      where: { id: product.id },
      relations: ['category', 'ingredients'],
    });
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
