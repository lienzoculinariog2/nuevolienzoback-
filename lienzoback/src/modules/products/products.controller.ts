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
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsFilterDto } from './dto/get-productsFilter.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guard/roles.guard';
import { HasRoles } from '../decorators/roles';
import { Roles } from '../users/entities/user.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Create a new product (for administrators only)' })
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
    return this.productsService.create(createProductDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
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
  @ApiOperation({ summary: 'Get a product by id' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Update an existing product (for administrators only)' })
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Inactivate a product (for administrators only)' })
  inactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.inactivateProduct(id);
  }

  @Put('activate/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Activate a product (for administrators only)' })
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

  // @Get('test/ingredients')
  // @ApiOperation({ summary: 'Obtener todos los ingredientes disponibles' })
  // async getIngredients() {
  //   return this.productsService.getIngredientsForTest();
  // }
}
