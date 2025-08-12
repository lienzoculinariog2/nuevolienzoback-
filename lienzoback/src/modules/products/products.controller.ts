import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  Put,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsFilterDto } from './dto/get-productsFilter.dto';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiQuery, getSchemaPath } from '@nestjs/swagger';
import { Products } from './entities/product.entity';


@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

@Post()
@ApiBearerAuth()
@ApiOperation({ summary: 'Crear un nuevo producto (solo admin)' })
@ApiResponse({
    status: 201,
    description: 'Producto creado correctamente',
    type: Products,
  })
  create(@Body() product: CreateProductDto) {
    return this.productsService.create(product);
  }

@Get()
@ApiOperation({ summary: 'Obtener lista paginada y filtrada de productos' })
@ApiQuery({ name: 'page', required: false, example: 1, description: 'Número de página' })
@ApiQuery({ name: 'limit', required: false, example: 10, description: 'Cantidad de resultados por página' })
@ApiQuery({ name: 'search', required: false, example: 'Pollo', description: 'Texto a buscar en nombre o descripción' })
@ApiResponse({
    status: 200,
    description: 'Lista de productos (paginada)',
    schema: {
      allOf: [
        {
          properties: {
            total: { type: 'integer', example: 2 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(Products) },
            },
          },
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
@ApiResponse({ status: 200, description: 'Producto encontrado', type: Products })
@ApiResponse({ status: 404, description: 'Producto no encontrado' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductById(id);
  }

@Put(':id')
@ApiBearerAuth()
@ApiOperation({ summary: 'Actualizar un producto (solo admin)' })
@ApiResponse({ status: 200, description: 'Producto actualizado correctamente', type: Products })
@ApiResponse({ status: 404, description: 'Producto no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

@Delete(':id')
@ApiBearerAuth()
@ApiOperation({ summary: 'Eliminar un producto (solo admin)' })
@ApiResponse({ status: 200, description: 'Producto eliminado correctamente' })
@ApiResponse({ status: 404, description: 'Producto no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}

