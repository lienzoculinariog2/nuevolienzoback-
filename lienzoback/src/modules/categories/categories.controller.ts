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
import { ApiOperation } from '@nestjs/swagger';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category (for administrators only)' })
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

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    if (page && limit) {
      return this.categoriesService.findAll(+page, +limit);
    }
    return this.categoriesService.findAll(1, 15);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing category (for administrators only)' })
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

  @Put('inactivate/:id')
  @ApiOperation({ summary: 'Inactivate a category by id (for administrators only)' })
  inactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.inactivate(id);
  }

  @Put('activate/:id')
  @ApiOperation({ summary: 'Activate a category by id (for administrators only)' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.activate(id);
  }
}
