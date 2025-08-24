import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module'; // 👈 Importa UsersModule

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
    UsersModule, // 👈 Agregado aquí
  ],
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
