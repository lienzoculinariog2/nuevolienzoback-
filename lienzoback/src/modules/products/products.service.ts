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
import type { Express } from 'express';
import { Ingredients } from '../ingredients/entities/ingredient.entity';
import { IngredientsService } from '../ingredients/ingredients.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
    @InjectRepository(Categories)
    private readonly categoriesRepository: Repository<Categories>,
    @InjectRepository(OrderDetail)
    private readonly ordersDetailRepository: Repository<OrderDetail>,
    private readonly fileUploadService: FileUploadService,
    private readonly ingredientsService: IngredientsService,
  ) {}

  async isPopulated(): Promise<boolean> {
    const productsCount = await this.productsRepository.count();
    return productsCount > 0;
  }

  async seedProducts(): Promise<void> {
    const categories: Categories[] = await this.categoriesRepository.find();
    const ingredients: Ingredients[] = await this.ingredientsService.findAll();

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
    // Validar categoría
    const category = await this.categoriesRepository.findOneBy({
      id: dto.categoryId,
    });
    if (!category) {
      throw new NotFoundException(`Categoría con ID ${dto.categoryId} no encontrada.`);
    }

    // Validar nombre único
    const existingProduct = await this.productsRepository.findOne({
      where: { name: dto.name },
    });
    if (existingProduct) {
      throw new ConflictException(`Ya existe un producto con el nombre "${dto.name}".`);
    }

    // Procesar ingredientes - crear si no existen
    const ingredients: Ingredients[] = [];
    if (dto.ingredients && dto.ingredients.length > 0) {
      console.log('Procesando ingredientes:', dto.ingredients);
      for (const ingredientName of dto.ingredients) {
        const ingredient = await this.ingredientsService.findOrCreate(ingredientName);
        ingredients.push(ingredient);
        console.log(`Ingrediente procesado: ${ingredient.name} (ID: ${ingredient.id})`);
      }
    }

    // Crear el producto
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
    console.log('Producto creado con ID:', savedProduct.id);

    // Procesar imagen si se proporciona
    if (file) {
      console.log('Procesando imagen:', file.originalname);
      try {
        await this.fileUploadService.uploadImage(file, savedProduct.id);
        console.log('Imagen subida exitosamente');
      } catch (error) {
        console.error('Error al subir imagen:', error);
        // No lanzamos error aquí para no fallar la creación del producto
      }
    }

    // Retornar producto con relaciones
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
      limit = 10,
    } = filterDto;

    const query = this.productsRepository.createQueryBuilder('product');
    query.leftJoinAndSelect('product.category', 'category');
    query.leftJoinAndSelect('product.ingredients', 'ingredients');

    // --- SECCIÓN DE FILTROS ---
    if (categoryId) {
      // 💡 CORRECCIÓN: Usar el alias de la tabla unida 'category'
      query.andWhere('category.id = :categoryId', { categoryId });
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

    // Filtro mejorado por ingredientes
    if (ingredient) {
      query.andWhere('ingredients.name ILIKE :ingredientName', {
        ingredientName: `%${ingredient}%`,
      });
      // Asegurar que solo se incluyan productos que tengan ingredientes
      query.andWhere('ingredients.id IS NOT NULL');
    }

    // Ordenamiento
    if (sortBy) {
      const orderDirection = order.toUpperCase() as 'ASC' | 'DESC';
      query.orderBy(`product.${sortBy}`, orderDirection);
    } else {
      query.orderBy('product.name', 'ASC');
    }

    // Paginación
    query.skip((page - 1) * limit).take(limit);

    console.log('Query SQL generada:', query.getSql());
    console.log('Parámetros:', query.getParameters());

    return await query.getMany();
  }

  async getProductById(id: string): Promise<Products | null> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'ingredients'],
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    file?: Express.Multer.File,
  ): Promise<Products> {
    const { categoryId, ingredients, ...productData } = updateProductDto;

    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['ingredients', 'category'],
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }

    // Validar categoría si se proporciona
    if (categoryId) {
      const category = await this.categoriesRepository.findOneBy({ id: categoryId });
      if (!category) {
        throw new NotFoundException(`Categoría con ID ${categoryId} no encontrada.`);
      }
      product.category = category;
    }

    // Procesar ingredientes - crear si no existen
    if (ingredients && ingredients.length > 0) {
      console.log('Procesando ingredientes en update:', ingredients);
      const newIngredients: Ingredients[] = [];
      for (const ingredientName of ingredients) {
        const ingredient = await this.ingredientsService.findOrCreate(ingredientName);
        newIngredients.push(ingredient);
        console.log(`Ingrediente procesado en update: ${ingredient.name} (ID: ${ingredient.id})`);
      }
      product.ingredients = newIngredients;
    }

    // Actualizar datos del producto
    Object.assign(product, productData);

    // Activar automáticamente si se agrega stock y el producto está inactivo
    if (productData.stock !== undefined && productData.stock > 0 && !product.isActive) {
      product.isActive = true;
      console.log(`Producto ${product.name} activado automáticamente al agregar stock`);
    }

    // Guardar el producto
    const savedProduct = await this.productsRepository.save(product);
    console.log('Producto actualizado con ID:', savedProduct.id);

    // Procesar imagen si se proporciona
    if (file) {
      console.log('Procesando imagen en update:', file.originalname);
      try {
        await this.fileUploadService.uploadImage(file, savedProduct.id);
        console.log('Imagen actualizada exitosamente');
      } catch (error) {
        console.error('Error al actualizar imagen:', error);
        // No lanzamos error aquí para no fallar la actualización del producto
      }
    }

    // Retornar producto con relaciones actualizadas
    return this.productsRepository.findOneOrFail({
      where: { id: savedProduct.id },
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

  async activateProduct(id: string): Promise<Products> {
    const productToActivate = await this.productsRepository.findOne({
      where: { id },
    });
    if (!productToActivate) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }

    productToActivate.isActive = true;
    console.log(`Producto ${productToActivate.name} activado exitosamente`);

    return this.productsRepository.save(productToActivate);
  }

  async getIngredientsForTest() {
    return this.ingredientsService.findAll();
  }
}
