import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import typeOrmConfig from './config/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeOrmConfig],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('typeorm')!,
    }),

    UsersModule,
    ProductsModule,
    CategoriesModule,
    AuthModule,
    FileUploadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
