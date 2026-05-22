import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AlertService } from '../../common/services/alert.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly alertService: AlertService,
  ) {}

  async register(dto: RegisterDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new BadRequestException('E-mail já cadastrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        provider: 'LOCAL',
      },
    });

    const token = await this.generateToken(user.id, user.email);

    return this.alertService.success('Usuário cadastrado com sucesso!', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        provider: user.provider,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      access_token: token,
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordIsValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordIsValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const token = await this.generateToken(user.id, user.email);

    return this.alertService.success('Login realizado com sucesso!', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        provider: user.provider,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      access_token: token,
    });
  }

  private async generateToken(userId: string, email: string | null) {
    return this.jwtService.signAsync({
      sub: userId,
      email,
    });
  }

  async profile(userId: string) {

  const user = await this.prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      provider: true,
      avatarUrl: true,
      nickname: true,
      coins: true,
      createdAt: true,
    },
  });

  return this.alertService.success(
    'Perfil encontrado com sucesso.',
    user,
  );
}
}