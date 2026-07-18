import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
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

        return this.buildToken(user.id, user.email);
    }

    async login(dto: LoginDto) {
        const user = await this.usersRepository.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.buildToken(user.id, user.email);
    }

    private buildToken(userId: string, email: string) {
        const accessToken = this.jwtService.sign({ sub: userId, email });
        return { accessToken };
    }
}