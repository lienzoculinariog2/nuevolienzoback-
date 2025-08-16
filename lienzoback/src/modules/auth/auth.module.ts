import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // El PassportModule es suficiente para que la estrategia funcione
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
  ],
  // La estrategia es lo que realmente valida el token
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
