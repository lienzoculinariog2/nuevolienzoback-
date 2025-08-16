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
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsFilterDto } from './dto/get-productsFilter.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  // @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image')) // El nombre 'image' debe coincidir con el campo en form-data
  create(
    @Body(new ValidationPipe({ transform: true })) createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('Archivo recibido:', file); // Para verificar que llegue el archivo
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
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productsService.update(id, updateProductDto, file);
  }

  @Put('inactivate/:id')
  // @UseGuards(AuthGuard('jwt'))
  inactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.inactivateProduct(id);
  }
}
