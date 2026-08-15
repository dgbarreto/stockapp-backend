import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwksController } from './jwks.controller';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      privateKey: process.env.JWT_PRIVATE_KEY,
      publicKey: process.env.JWT_PUBLIC_KEY,
      signOptions: {
        algorithm: 'RS256',
        expiresIn: Number(process.env.JWT_EXPIRES_IN ?? 604800),
        issuer: 'stockapp-backend',
        audience: 'stockapp-api',
      },
    }),
  ],
  controllers: [AuthController, JwksController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
