import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AlertService } from '../../common/services/alert.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
  ) { }

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
      pendingTrades,
      pendingFriendRequests,
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

      this.prisma.trade.count({
        where: {
          receiverId: userId,
          status: {
            in: ['PENDING', 'COUNTERED'],
          },
        },
      }),

      this.prisma.friendRequest.count({
        where: {
          receiverId: userId,
          status: 'PENDING',
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
      pendingTrades,
      pendingFriendRequests,
    });

  }

  async generateTradeCode(userId: string) {

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return this.alertService.error(
        'Usuário não encontrado.',
      );
    }

    if (user.tradeCode) {
      return this.alertService.success(
        'ID já existente.',
        user.tradeCode,
      );
    }

    const totalUsers =
      await this.prisma.user.count();

    const tradeCode =
      `C&T#${String(totalUsers + 1).padStart(4, '0')}`;

    const updatedUser =
      await this.prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          tradeCode,
        },

        select: {
          id: true,
          tradeCode: true,
        },
      });

    return this.alertService.success(
      'ID gerado com sucesso.',
      updatedUser.tradeCode,
    );
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        avatarUrl: true,
        tradeCode: true,
        bio: true,
        createdAt: true,
        lastSeenAt: true,
      },
    });

    if (!user) {
      return this.alertService.error(
        'Colecionador não encontrado.',
      );
    }

    const [
      totalAlbums,
      totalStickers,
      totalDuplicates,
      totalFriendsA,
      totalFriendsB,
      featuredStickers,
    ] = await Promise.all([
      this.prisma.userAlbum.count({
        where: {
          userId,
        },
      }),

      this.prisma.userSticker.count({
        where: {
          userId,
        },
      }),

      this.prisma.userSticker.count({
        where: {
          userId,
          quantityDuplicate: {
            gt: 0,
          },
        },
      }),

      this.prisma.friendship.count({
        where: {
          userAId: userId,
        },
      }),

      this.prisma.friendship.count({
        where: {
          userBId: userId,
        },
      }),

      this.prisma.userFeaturedSticker.findMany({
        where: {
          userId,
        },
        include: {
          userSticker: {
            include: {
              sticker: true,
              album: true,
            },
          },
        },
        orderBy: {
          position: 'asc',
        },
        take: 5,
      }),
    ]);

    return this.alertService.success(
      'Perfil público encontrado.',
      {
        ...user,

        stats: {
          totalAlbums,
          totalStickers,
          totalDuplicates,
          totalFriends: totalFriendsA + totalFriendsB,
        },

        featuredStickers: featuredStickers.map((item) => ({
          id: item.id,
          position: item.position,

          sticker: {
            id: item.userSticker.sticker.id,
            name: item.userSticker.sticker.name,
            number: item.userSticker.sticker.number,
            rarity: item.userSticker.sticker.rarity,
            imageUrl: item.userSticker.sticker.imageUrl,
            albumName: item.userSticker.album.themeName,
          },
        })),
      },
    );
  }

  async findMyFeaturedStickers(userId: string) {
    const featured =
      await this.prisma.userFeaturedSticker.findMany({
        where: {
          userId,
        },
        include: {
          userSticker: {
            include: {
              sticker: true,
              album: true,
            },
          },
        },
        orderBy: {
          position: 'asc',
        },
      });

    const formatted = featured.map((item) => ({
      id: item.id,
      position: item.position,
      userStickerId: item.userStickerId,

      sticker: {
        id: item.userSticker.sticker.id,
        name: item.userSticker.sticker.name,
        number: item.userSticker.sticker.number,
        rarity: item.userSticker.sticker.rarity,
        imageUrl: item.userSticker.sticker.imageUrl,
        albumName: item.userSticker.album.themeName,
      },
    }));

    return this.alertService.success(
      'Figurinhas em destaque encontradas.',
      formatted,
    );
  }

  async updateFeaturedStickers(
    userId: string,
    userStickerIds: string[],
  ) {
    if (!Array.isArray(userStickerIds)) {
      throw new BadRequestException(
        'Lista de figurinhas inválida.',
      );
    }

    if (userStickerIds.length > 5) {
      throw new BadRequestException(
        'Você pode destacar no máximo 5 figurinhas.',
      );
    }

    const uniqueIds = [...new Set(userStickerIds)];

    if (uniqueIds.length !== userStickerIds.length) {
      throw new BadRequestException(
        'Não é permitido repetir a mesma figurinha.',
      );
    }

    const userStickers =
      await this.prisma.userSticker.findMany({
        where: {
          id: {
            in: userStickerIds,
          },
          userId,
        },
      });

    if (userStickers.length !== userStickerIds.length) {
      throw new BadRequestException(
        'Uma ou mais figurinhas não pertencem ao usuário.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userFeaturedSticker.deleteMany({
        where: {
          userId,
        },
      });

      for (let index = 0; index < userStickerIds.length; index++) {
        await tx.userFeaturedSticker.create({
          data: {
            userId,
            userStickerId: userStickerIds[index],
            position: index + 1,
          },
        });
      }
    });

    return this.alertService.success(
      'Figurinhas em destaque atualizadas.',
      {
        total: userStickerIds.length,
      },
    );
  }

  async updateLastSeen(userId: string) {
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        lastSeenAt: new Date(),
      },

      select: {
        id: true,
        lastSeenAt: true,
      },
    });

    return this.alertService.success(
      'Presença atualizada.',
      user,
    );
  }
}