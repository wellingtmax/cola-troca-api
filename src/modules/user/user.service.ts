import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AlertService } from '../../common/services/alert.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        phone: true,
        avatarUrl: true,
        coins: true,
        zipCode: true,
        street: true,
        number: true,
        complement: true,
        district: true,
        city: true,
        state: true,
        country: true,
        bio: true,
        createdAt: true,
      },
    });

    return this.alertService.success('Perfil encontrado.', user);
  }

  async updateProfile(userId: string, dto: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        nickname: dto.nickname,
        phone: dto.phone,
        bio: dto.bio,
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        phone: true,
        avatarUrl: true,
        coins: true,
        bio: true,
      },
    });

    return this.alertService.success('Perfil atualizado.', user);
  }

  async updateAddress(userId: string, dto: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        zipCode: dto.zipCode,
        street: dto.street,
        number: dto.number,
        complement: dto.complement,
        district: dto.district,
        city: dto.city,
        state: dto.state,
        country: dto.country || 'Brasil',
      },
    });

    return this.alertService.success('Endereço atualizado.', user);
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    if (!avatarUrl) {
      throw new BadRequestException('Avatar inválido.');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        name: true,
        nickname: true,
        avatarUrl: true,
      },
    });

    return this.alertService.success('Avatar atualizado.', user);
  }

  async dashboard(userId: string) {
    const [
      user,
      totalAlbums,
      totalStickers,
      totalDuplicates,
      totalPlaced,
      pendingToPlace,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          coins: true,
        },
      }),

      this.prisma.userAlbum.count({
        where: { userId },
      }),

      this.prisma.userSticker.count({
        where: { userId },
      }),

      this.prisma.userSticker.count({
        where: {
          userId,
          quantityDuplicate: {
            gt: 0,
          },
        },
      }),

      this.prisma.userSticker.count({
        where: {
          userId,
          isPlaced: true,
        },
      }),

      this.prisma.userSticker.count({
        where: {
          userId,
          isPlaced: false,
        },
      }),
    ]);

    return this.alertService.success('Dashboard encontrado.', {
      coins: user?.coins ?? 0,
      totalAlbums,
      totalStickers,
      totalDuplicates,
      totalPlaced,
      pendingToPlace,
    });
  }
}