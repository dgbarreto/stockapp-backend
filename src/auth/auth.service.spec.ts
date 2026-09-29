import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { RedisCacheService } from '../cache/redis-cache.service';
import { PasswordResetEmailService } from './password-reset-email.service';
import { PrismaService } from '../prisma/prisma.service';

type RefreshTokenCreateArgs = {
  data: { userId: string; tokenHash: string; expiresAt: Date };
};
type RefreshTokenUpdateManyArgs = {
  where: { id: string; revokedAt: null };
  data: { revokedAt: Date };
};
type StoredRefreshToken = {
  id: string;
  revokedAt: Date | null;
  expiresAt: Date;
  user: { id: string; email: string };
};

function createPrismaMock() {
  return {
    refreshToken: {
      create: jest.fn<(args: RefreshTokenCreateArgs) => Promise<void>>(),
      findUnique: jest.fn<() => Promise<StoredRefreshToken | null>>(),
      updateMany:
        jest.fn<
          (args: RefreshTokenUpdateManyArgs) => Promise<{ count: number }>
        >(),
    },
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: { findByEmail: jest.Mock; create: jest.Mock };
  let jwtService: { sign: jest.Mock };
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    usersRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed-access-token'),
    };
    prisma = createPrismaMock();
    prisma.refreshToken.create.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisCacheService, useValue: {} },
        { provide: PasswordResetEmailService, useValue: {} },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('creates the user and returns an access + refresh token', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue({
        id: 'user-1',
        email: 'new@user.com',
      });

      const result = await service.register({
        email: 'new@user.com',
        password: 'password123',
        name: 'New User',
      });

      expect(result.accessToken).toBe('signed-access-token');
      expect(result.refreshToken).toEqual(expect.any(String));
      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- jest's
         expect.any()/objectContaining() matchers are typed `any` by design */
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        },
      });
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('throws when the email is already in use', async () => {
      usersRepository.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          email: 'taken@user.com',
          password: 'password123',
          name: 'Someone',
        }),
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('login', () => {
    it('returns an access + refresh token for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      usersRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@user.com',
        passwordHash,
      });

      const result = await service.login({
        email: 'user@user.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('signed-access-token');
      expect(result.refreshToken).toEqual(expect.any(String));
    });

    it('throws for a wrong password', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      usersRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'user@user.com',
        passwordHash,
      });

      await expect(
        service.login({ email: 'user@user.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when the user does not exist', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@user.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshAccessToken', () => {
    it('rotates the refresh token and returns a new pair', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: { id: 'user-1', email: 'user@user.com' },
      });
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.refreshAccessToken('some-refresh-token');

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- jest's
         expect.any()/objectContaining() matchers are typed `any` by design */
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { id: 'token-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(result.accessToken).toBe('signed-access-token');
      expect(result.refreshToken).toEqual(expect.any(String));
    });

    it('throws when the token does not exist', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshAccessToken('unknown-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws when the token is already revoked', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        user: { id: 'user-1', email: 'user@user.com' },
      });

      await expect(service.refreshAccessToken('revoked-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws when the token is expired', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 60_000),
        user: { id: 'user-1', email: 'user@user.com' },
      });

      await expect(service.refreshAccessToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws when two concurrent calls race to rotate the same token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: { id: 'user-1', email: 'user@user.com' },
      });
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.refreshAccessToken('raced-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
