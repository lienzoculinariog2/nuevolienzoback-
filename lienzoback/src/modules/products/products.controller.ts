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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
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
