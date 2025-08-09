import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Products } from '../products/entities/product.entity';
import { FileUploadRepository } from './file-upload.repository';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly fileUploadRepository: FileUploadRepository,
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
  ) {}

  // Asegúrate que esta función recibe los 2 parámetros: file y productId
  async uploadImage(file: Express.Multer.File, productId: string): Promise<Products | null> {
    const product = await this.productsRepository.findOneBy({ id: productId });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let uploadResponse;
    try {
      uploadResponse = await this.fileUploadRepository.uploadImage(file);
    } catch (error) {
      console.error('Upload Error:', error);
      throw new InternalServerErrorException('Failed to upload image');
    }

    try {
      await this.productsRepository.update(product.id, {
        imgUrl: uploadResponse.secure_url,
      });
    } catch (error) {
      console.error('Database Update Error:', error);
      throw new InternalServerErrorException('Failed to update product image URL');
    }

    return this.productsRepository.findOneBy({ id: productId });
  }

  async uploadImageForCategory(file: Express.Multer.File) {
    const uploadResponse = await this.fileUploadRepository.uploadImage(file);

    if (!uploadResponse || !uploadResponse.secure_url) {
      throw new Error('Cloudinary upload failed');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return uploadResponse;
  }
}
