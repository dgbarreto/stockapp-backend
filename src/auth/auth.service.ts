import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { randomInt, randomBytes, createHash } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { RedisCacheService } from '../cache/redis-cache.service';
import { PasswordResetEmailService } from './password-reset-email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ValidateResetCodeDto } from './dto/validate-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PrismaService } from 'src/prisma/prisma.service';

const SALT_ROUNDS = 10;
const RESET_CODE_TTL_SECONDS = 900; // 15 min
const RESET_TOKEN_TTL_SECONDS = 600; // 10 min
const MAX_RESET_ATTEMPTS = 5;
const INVALID_CODE_MESSAGE = 'Código inválido ou expirado.';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly redisCache: RedisCacheService,
    private readonly passwordResetEmail: PasswordResetEmailService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    return await this.buildToken(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return await this.buildToken(user.id, user.email);
  }

  private async buildToken(userId: string, email: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email });
    const refreshToken = randomBytes(48).toString('hex');

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async refreshAccessToken(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotação: revoga o token atual. O filtro revokedAt: null impede que
    // duas chamadas simultâneas usem o mesmo token (só uma revoga).
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.buildToken(stored.user.id, stored.user.email);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findByEmail(dto.email);
    const genericResponse = {
      message: 'Se o e-mail existir, enviamos um código de confirmação.',
    };

    if (!user) {
      return genericResponse;
    }

    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, SALT_ROUNDS);

    await this.redisCache.set(
      `password-reset:code:${user.id}`,
      { codeHash },
      RESET_CODE_TTL_SECONDS,
    );
    await this.redisCache.del(`password-reset:attempts:${user.id}`);
    await this.passwordResetEmail.sendResetCode(user.email, code);

    return genericResponse;
  }

  async validateResetCode(
    dto: ValidateResetCodeDto,
  ): Promise<{ resetToken: string }> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    const attempts = await this.redisCache.incr(
      `password-reset:attempts:${user.id}`,
      RESET_CODE_TTL_SECONDS,
    );
    if (attempts > MAX_RESET_ATTEMPTS) {
      await this.redisCache.del(`password-reset:code:${user.id}`);
      throw new BadRequestException('Muitas tentativas. Peça um novo código.');
    }

    const stored = await this.redisCache.get<{ codeHash: string }>(
      `password-reset:code:${user.id}`,
    );
    if (!stored) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    const codeMatches = await bcrypt.compare(dto.code, stored.codeHash);
    if (!codeMatches) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    await this.redisCache.del(`password-reset:code:${user.id}`);
    await this.redisCache.del(`password-reset:attempts:${user.id}`);

    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(resetToken).digest('hex');
    await this.redisCache.set(
      `password-reset:token:${tokenHash}`,
      { userId: user.id },
      RESET_TOKEN_TTL_SECONDS,
    );

    return { resetToken };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(dto.resetToken).digest('hex');
    const stored = await this.redisCache.get<{ userId: string }>(
      `password-reset:token:${tokenHash}`,
    );
    if (!stored) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.usersRepository.updatePassword(stored.userId, passwordHash);
    await this.redisCache.del(`password-reset:token:${tokenHash}`);

    return { message: 'Senha atualizada com sucesso.' };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    const ordersCount = await this.prisma.order.count({ where: { userId } });
    return {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      ordersCount,
    };
  }
}
