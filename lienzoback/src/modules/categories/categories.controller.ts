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
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Optional } from '@nestjs/common';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('seeder')
  seeder() {
    return this.categoriesService.seederService();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() categoryDto: CreateCategoryDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 300 * 1024 }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png|gif)/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.categoriesService.create(categoryDto, file);
  }

  @Get()
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    if (page && limit) {
      return this.categoriesService.findAll(+page, +limit);
    }
    return this.categoriesService.findAll(1, 5);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() categoryDto: UpdateCategoryDto,
    @Optional()
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 300 * 1024 }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png|gif)/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.categoriesService.update(id, categoryDto, file);
  }

  @Put('inactivate/:id')
  inactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.inactivate(id);
  }
}
