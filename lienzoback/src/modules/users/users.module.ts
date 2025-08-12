// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Users } from './entities/user.entity';

@Module({
  imports: [
    // Importa el TypeOrmModule y proporciona la entidad Users
    TypeOrmModule.forFeature([Users]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Exporta el servicio si otros módulos lo necesitan
})
export class UsersModule {}
