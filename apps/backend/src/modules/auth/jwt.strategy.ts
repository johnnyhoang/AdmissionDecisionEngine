import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { passportJwtSecret } from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const supabaseUrl = configService.get<string>(
      'SUPABASE_URL',
      'https://czngbleeeiljsrpbaksg.supabase.co',
    );
    const jwksUri = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;

    const jwksSecretProvider = passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: jwksUri,
    });

    const symmetricSecret = configService.get<string>(
      'JWT_SECRET',
      'super_secret_jwt_key_hieu_hoa',
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request: any, rawJwtToken: string, done: any) => {
        try {
          const decoded = jwt.decode(rawJwtToken, { complete: true }) as any;
          if (decoded && decoded.header && decoded.header.alg === 'ES256') {
            // Asymmetric signing key from Supabase (ECC P-256)
            jwksSecretProvider(request, rawJwtToken, done);
          } else {
            // Fallback to symmetric key (Legacy HS256 JWT Secret)
            done(null, symmetricSecret);
          }
        } catch (e) {
          done(e);
        }
      },
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid JWT payload');
    }
    const user = await this.authService.getOrCreateUser(payload);
    return user;
  }
}
