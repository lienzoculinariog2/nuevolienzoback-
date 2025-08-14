//
// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const auth0Domain = configService.get<string>('AUTH0_DOMAIN');
    const auth0Audience = configService.get<string>('AUTH0_AUDIENCE');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
      }),
      audience: auth0Audience,
      issuer: `https://${auth0Domain}/`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return payload;
  }
}
