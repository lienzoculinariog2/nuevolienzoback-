// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    // La llamada a 'super' debe ser la primera línea.
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${configService.get('REACT_APP_AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }),
      audience: 'http://localhost:3000/api', 
      issuer: `https://${configService.get('REACT_APP_AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'],
    });
  }

  // Se elimina el 'async' ya que no se usa 'await'
  validate(payload: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return payload;
  }
}
