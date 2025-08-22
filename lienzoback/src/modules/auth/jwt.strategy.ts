import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { Roles } from '../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }),
      audience: configService.get('AUTH0_AUDIENCE'),
      issuer: `https://${configService.get('AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token JWT inválido o incompleto.');
    }

    try {
      const userInDb = await this.usersService.findOneById(payload.sub);

      // ✅ Verificar si el usuario está baneado
      if (userInDb.roles === Roles.BANNED) {
        throw new UnauthorizedException('Tu cuenta ha sido baneada. No puedes iniciar sesión.');
      }

      // Si no está baneado, devuelve el objeto de usuario con sus roles de la DB
      return {
        sub: userInDb.id,
        email: userInDb.email,
        roles: userInDb.roles,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error; // Relanza la excepción si es la nuestra de 'banned'
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      } else if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
        // Usuario nuevo en DB local (primera vez que se loguea)
        return {
          sub: payload.sub,
          email: payload.email,
          roles: Roles.CUSTOMER, // Rol por defecto para nuevos usuarios
        };
      } else {
        // Otros errores inesperados (ej. problemas de DB)
        console.error('Error inesperado en JwtStrategy:', error);
        throw new UnauthorizedException('Error al validar usuario.');
      }
    }
  }
}
