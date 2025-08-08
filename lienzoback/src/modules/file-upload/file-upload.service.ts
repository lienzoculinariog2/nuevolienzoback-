// src/modules/file-upload/file-upload.service.ts
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

  async uploadImage(file: Express.Multer.File, productId: string) {
    const product = await this.productsRepository.findOneBy({ id: productId });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let uploadResponse;
    try {
      uploadResponse = await this.fileUploadRepository.uploadImage(file);
    } catch (error) {
      console.error('Upload Error:', error); // ✅ Esto te ayudará a ver el error exacto en la consola
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
