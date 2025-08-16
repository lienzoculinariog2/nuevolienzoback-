import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Products } from '../products/entities/product.entity';
import { FileUploadRepository } from './file-upload.repository';
import type { Express } from 'express';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(
    private readonly fileUploadRepository: FileUploadRepository,
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
  ) {}

  async uploadImage(file: Express.Multer.File, productId: string): Promise<Products | null> {
    this.logger.log(`🚀 Iniciando upload de imagen para producto: ${productId}`);
    this.logger.log(
      `📁 Archivo: ${file.originalname}, Tamaño: ${file.size} bytes, Tipo: ${file.mimetype}`,
    );

    // Verificar que el producto existe
    const product = await this.productsRepository.findOneBy({ id: productId });
    if (!product) {
      this.logger.error(`❌ Producto con ID ${productId} no encontrado`);
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    this.logger.log(`✅ Producto encontrado: ${product.name}`);

    let uploadResponse;
    try {
      this.logger.log('☁️ Subiendo imagen a Cloudinary...');
      uploadResponse = await this.fileUploadRepository.uploadImage(file);
      this.logger.log('✅ Imagen subida exitosamente a Cloudinary');
    } catch (error) {
      this.logger.error('❌ Error al subir imagen a Cloudinary:', error);
      throw new InternalServerErrorException(`Error al subir imagen: ${error.message}`);
    }

    try {
      this.logger.log('💾 Actualizando URL de imagen en base de datos...');
      await this.productsRepository.update(product.id, {
        imgUrl: uploadResponse.secure_url,
      });
      this.logger.log('✅ URL de imagen actualizada exitosamente en la base de datos');
    } catch (error) {
      this.logger.error('❌ Error al actualizar URL en base de datos:', error);
      throw new InternalServerErrorException(
        'Error al actualizar URL de imagen en la base de datos',
      );
    }

    // Retornar producto actualizado
    const updatedProduct = await this.productsRepository.findOneBy({ id: productId });
    if (!updatedProduct) {
      this.logger.error(`❌ No se pudo encontrar el producto actualizado con ID: ${productId}`);
      throw new NotFoundException(
        `No se pudo encontrar el producto actualizado con ID: ${productId}`,
      );
    }

    this.logger.log(`✅ Producto actualizado con imagen: ${updatedProduct.name}`);

    return updatedProduct;
  }

  async uploadImageForCategory(file: Express.Multer.File) {
    this.logger.log('🚀 Iniciando upload de imagen para categoría');

    try {
      const uploadResponse = await this.fileUploadRepository.uploadImage(file);

      if (!uploadResponse || !uploadResponse.secure_url) {
        throw new Error('Cloudinary no retornó una URL válida');
      }

      this.logger.log('✅ Imagen de categoría subida exitosamente');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return uploadResponse;
    } catch (error) {
      this.logger.error('❌ Error al subir imagen de categoría:', error);
      throw new InternalServerErrorException(
        `Error al subir imagen de categoría: ${error.message}`,
      );
    }
  }
}
