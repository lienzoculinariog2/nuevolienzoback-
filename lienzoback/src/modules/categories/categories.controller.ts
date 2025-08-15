import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Put,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Crear una nueva categoría' })
  @ApiBody({
    description: 'Datos para crear una categoría. Puede incluir imagen opcional.',
    type: CreateCategoryDto,
  })
  @ApiResponse({ status: 201, description: 'Categoría creada correctamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() categoryDto: CreateCategoryDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.categoriesService.create(categoryDto, file);
  }

  @ApiOperation({ summary: 'Obtener todas las categorías (paginadas opcionalmente)' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Cantidad por página' })
  @ApiResponse({ status: 200, description: 'Lista de categorías obtenida correctamente.' })
  @Get()
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    if (page && limit) {
      return this.categoriesService.findAll(+page, +limit);
    }
    return this.categoriesService.findAll(1, 5);
  }

  @ApiOperation({ summary: 'Obtener una categoría por ID' })
  @ApiParam({ name: 'id', description: 'ID de la categoría (UUID)' })
  @ApiResponse({ status: 200, description: 'Categoría encontrada.' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @ApiOperation({ summary: 'Actualizar una categoría por ID' })
  @ApiParam({ name: 'id', description: 'ID de la categoría (UUID)' })
  @ApiBody({
    description: 'Datos para actualizar la categoría. Puede incluir imagen opcional.',
    type: UpdateCategoryDto,
  })
  @ApiResponse({ status: 200, description: 'Categoría actualizada correctamente.' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() categoryDto: UpdateCategoryDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.categoriesService.update(id, categoryDto, file);
  }

  @ApiOperation({ summary: 'Inactivar una categoría' })
  @ApiParam({ name: 'id', description: 'ID de la categoría (UUID)' })
  @ApiResponse({ status: 200, description: 'Categoría inactivada correctamente.' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  @Put('inactivate/:id')
  inactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.inactivate(id);
  }
}
