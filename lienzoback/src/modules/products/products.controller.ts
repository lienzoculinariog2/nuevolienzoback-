import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  ParseUUIDPipe,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsFilterDto } from './dto/get-productsFilter.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Products } from './entities/product.entity';
import type { Express } from 'express';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
    schema: {
      example: {
        id: 'uuid-product-id',
        name: 'Pizza Margarita',
        description: 'Pizza con queso mozzarella y albahaca fresca',
        price: 12.99,
        stock: 20,
        caloricLevel: 250,
        category: {
          id: 'uuid-category-id',
          name: 'Pizzas',
          description: 'Categoría de pizzas',
          imgUrl: 'https://example.com/cat-img.jpg',
        },
        isActive: true,
        ingredients: ['Tomate', 'Queso', 'Albahaca'],
        imgUrl: 'https://res.cloudinary.com/miimagen.jpg',
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body(new ValidationPipe({ transform: true })) createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('Endpoint create llamado con:', {
      productData: createProductDto,
      hasFile: !!file,
      fileName: file?.originalname,
      fileSize: file?.size
    });
    return this.productsService.create(createProductDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos con filtros opcionales' })
  @ApiQuery({ name: 'name', required: false, description: 'Buscar por nombre' })
  @ApiQuery({ name: 'price_min', required: false, description: 'Precio mínimo', type: Number })
  @ApiQuery({ name: 'price_max', required: false, description: 'Precio máximo', type: Number })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrar por estado activo', type: Boolean })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por categoría', type: String, format: 'uuid' })
  @ApiQuery({ name: 'ingredient', required: false, description: 'Buscar productos que contengan este ingrediente' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Campo de ordenación', enum: ['name', 'price', 'stock', 'caloricLevel'] })
  @ApiQuery({ name: 'order', required: false, description: 'Dirección de orden', enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Cantidad de resultados por página', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos',
    schema: {
      example: [
        {
          id: 'uuid-product-id',
          name: 'Salmón al Horno con Espárragos',
          description: 'Filete de salmón fresco horneado...',
          price: 750,
          stock: 25,
          caloricLevel: 2,
          category: {
            id: 'uuid-category-id',
            name: 'Alto en Proteína',
            description: 'Platos diseñados para apoyar el desarrollo muscular...',
            imgUrl: 'https://res.cloudinary.com/...jpg',
          },
          isActive: true,
          ingredients: ['salmón', 'espárragos', 'limón', 'pescado'],
          imgUrl: 'https://res.cloudinary.com/...jpg',
        },
      ],
    },
  })
  findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidNonWhitelisted: true,
      }),
    )
    filterDto: GetProductsFilterDto,
  ) {
    return this.productsService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
    schema: {
      example: {
        id: 'uuid-product-id',
        name: 'Salmón al Horno con Espárragos',
        description: 'Filete de salmón fresco horneado...',
        price: 750,
        stock: 25,
        caloricLevel: 2,
        category: {
          id: 'uuid-category-id',
          name: 'Alto en Proteína',
          description: 'Platos diseñados para apoyar el desarrollo muscular...',
          imgUrl: 'https://res.cloudinary.com/...jpg',
        },
        isActive: true,
        ingredients: ['salmón', 'espárragos', 'limón', 'pescado'],
        imgUrl: 'https://res.cloudinary.com/...jpg',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un producto por ID' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado',
    schema: {
      example: {
        id: 'uuid-product-id',
        name: 'Pizza Margarita',
        description: 'Pizza con queso mozzarella y albahaca fresca',
        price: 12.99,
        stock: 20,
        caloricLevel: 250,
        category: {
          id: 'uuid-category-id',
          name: 'Pizzas',
          description: 'Categoría de pizzas',
          imgUrl: 'https://example.com/cat-img.jpg',
        },
        isActive: true,
        ingredients: ['Tomate', 'Queso', 'Albahaca'],
        imgUrl: 'https://res.cloudinary.com/miimagen.jpg',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body(new ValidationPipe({ transform: true })) updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('Endpoint update llamado con:', {
      productId: id,
      productData: updateProductDto,
      hasFile: !!file,
      fileName: file?.originalname,
      fileSize: file?.size
    });
    return this.productsService.update(id, updateProductDto, file);
  }

  @Put('inactivate/:id')
  @ApiOperation({ summary: 'Inactivar un producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto inactivado',
    schema: {
      example: {
        id: 'uuid-product-id',
        name: 'Pizza Margarita',
        isActive: false,
        stock: 0,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 409, description: 'No se puede inactivar porque tiene stock o pedidos activos' })
  inactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.inactivateProduct(id);
  }

  @Put('activate/:id')
  @ApiOperation({ summary: 'Activar un producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto activado',
    schema: {
      example: {
        id: 'uuid-product-id',
        name: 'Pizza Margarita',
        isActive: true,
        stock: 10,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.activateProduct(id);
  }

  @Get('test/ingredients')
  @ApiOperation({ summary: 'Obtener todos los ingredientes disponibles' })
  async getIngredients() {
    return this.productsService.getIngredientsForTest();
  }
}
