import { Controller, Post, Param, UseInterceptors, UploadedFile, Get, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import type { Express } from 'express';

@ApiTags('FileUpload')
@Controller('file')
export class FileUploadController {
  private readonly logger = new Logger(FileUploadController.name);

  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('uploadImage/:productId')
  @ApiOperation({ summary: 'Subir imagen para un producto' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Imagen subida exitosamente' })
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(`📤 Endpoint uploadImage llamado para producto: ${productId}`);
    return this.fileUploadService.uploadImage(file, productId);
  }

  @Get('test/cloudinary-config')
  @ApiOperation({ summary: 'Verificar configuración de Cloudinary' })
  @ApiResponse({ status: 200, description: 'Estado de la configuración de Cloudinary' })
  testCloudinaryConfig() {
    this.logger.log('🔍 Verificando configuración de Cloudinary...');
    
    // Log detallado de las variables
    this.logger.log(`🌥️ CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME || 'NO CONFIGURADO'}`);
    this.logger.log(`🔑 CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
    this.logger.log(`🔐 CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? 'CONFIGURADO' : 'NO CONFIGURADO'}`);
    
    const config = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'Configurado' : 'No configurado',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Configurado' : 'No configurado',
    };

    const isConfigured = config.cloud_name && config.api_key === 'Configurado' && config.api_secret === 'Configurado';
    
    this.logger.log(`📊 Estado de configuración: ${isConfigured ? '✅ Configurado' : '❌ No configurado'}`);
    
    return {
      status: isConfigured ? 'success' : 'error',
      message: isConfigured ? 'Cloudinary está configurado correctamente' : 'Cloudinary no está configurado correctamente',
      config: {
        cloud_name: config.cloud_name || 'No configurado',
        api_key: config.api_key,
        api_secret: config.api_secret,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('test/health')
  @ApiOperation({ summary: 'Verificar salud del módulo de file-upload' })
  @ApiResponse({ status: 200, description: 'Estado del módulo' })
  testHealth() {
    this.logger.log('🏥 Verificando salud del módulo de file-upload...');
    
    return {
      status: 'success',
      message: 'Módulo de file-upload funcionando correctamente',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
