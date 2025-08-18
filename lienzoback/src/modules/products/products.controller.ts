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
  ParseFilePipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsFilterDto } from './dto/get-productsFilter.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiTags, 
  ApiConsumes, 
  ApiBody, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';

@ApiTags('Productos')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Crear un nuevo producto',
    description: 'Crea un nuevo producto con imagen opcional. Los ingredientes se crean automáticamente si no existen.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos del producto y imagen opcional',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Pizza Margarita' },
        description: { type: 'string', example: 'Pizza clásica italiana con mozzarella y tomate' },
        price: { type: 'number', example: 29.99 },
        stock: { type: 'number', example: 10 },
        caloricLevel: { type: 'number', example: 250 },
        categoryId: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
        ingredients: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['Mozzarella', 'Tomate', 'Albahaca']
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Imagen del producto (JPG, PNG, GIF, WebP, máximo 5MB)'
        }
      },
      required: ['name', 'description', 'price', 'stock', 'caloricLevel', 'categoryId']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Pizza Margarita',
        description: 'Pizza clásica italiana con mozzarella y tomate',
        price: 29.99,
        stock: 10,
        caloricLevel: 250,
        imgUrl: 'https://res.cloudinary.com/example/image/upload/v123/pizza.jpg',
        isActive: true,
        category: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Pizzas'
        },
        ingredients: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Mozzarella'
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body(new ValidationPipe({ transform: true })) createProductDto: CreateProductDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    console.log('Archivo recibido:', file);
    return this.productsService.create(createProductDto, file);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Obtener productos con filtros',
    description: 'Obtiene una lista paginada de productos con filtros opcionales por nombre, categoría, ingredientes, precio y ordenamiento.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Elementos por página' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Buscar por nombre del producto' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filtrar por ID de categoría' })
  @ApiQuery({ name: 'ingredient', required: false, type: String, description: 'Filtrar por ingrediente' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Precio mínimo' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Precio máximo' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Campo para ordenar (name, price, createdAt)' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Orden ascendente o descendente' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos obtenida exitosamente',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Pizza Margarita',
            description: 'Pizza clásica italiana',
            price: 29.99,
            stock: 10,
            caloricLevel: 250,
            imgUrl: 'https://res.cloudinary.com/example/image/upload/v123/pizza.jpg',
            isActive: true,
            category: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              name: 'Pizzas'
            },
            ingredients: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Mozzarella'
              }
            ]
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      }
    }
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
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductById(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    // Extrae los ingredientes del cuerpo y asegúrate de que sea un array
    const { ingredients, ...rest } = body;
    const processedIngredients = Array.isArray(ingredients)
      ? ingredients
      : [ingredients].filter(Boolean);

    // Crea un nuevo DTO para pasar al servicio
    const updateProductDto: UpdateProductDto = {
      ...rest,
      ingredients: processedIngredients,
    };

    return this.productsService.update(id, updateProductDto, file);
  }

  @Put('inactivate/:id')
  // @UseGuards(AuthGuard('jwt'))
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
