import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
}

const fromXForwardedAuthorization = (req: Request): string | null => {
  const header = req.headers['x-forwarded-authorization'];
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        fromXForwardedAuthorization,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_PUBLIC_KEY as string,
      algorithms: ['RS256'],
      issuer: 'stockapp-backend',
      audience: 'stockapp-api',
    });
  }

  validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}