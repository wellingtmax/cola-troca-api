import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { StickerRarity } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AlertService } from '../../common/services/alert.service';

import { OpenPackDto } from './dto/open-pack.dto';
import { UserLevelService } from '../user-level/user-level.service';

@Injectable()
export class PackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
    private readonly userLevelService: UserLevelService,
  ) { }

  async findAll() {
    const packs = await this.prisma.pack.findMany({
      orderBy: {
        price: 'asc',
      },
    });

    return this.alertService.success('Packs encontrados.', packs);
  }

  async openPack(userId: string, dto: OpenPackDto) {
    const pack = await this.prisma.pack.findFirst({
      where: {
        type: dto.packType,
      },
    });

    if (!pack) {
      throw new NotFoundException('Pack não encontrado.');
    }

    if (pack.dailyLimit) {
      throw new BadRequestException(
        'Este pack deve ser aberto pela rota de pack grátis.',
      );
    }

    return this.openPackByRules(userId, dto.albumId, pack);
  }

  async openFreePack(userId: string, albumId: string) {
    const pack = await this.prisma.pack.findFirst({
      where: {
        type: 'FREE',
      },
    });

    if (!pack) {
      throw new NotFoundException('Pack grátis não encontrado.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyOpened = await this.prisma.purchase.findFirst({
      where: {
        userId,
        packId: pack.id,
        createdAt: {
          gte: today,
        },
      },
    });

    if (alreadyOpened) {
      throw new BadRequestException(
        'Você já abriu seu pack grátis hoje.',
      );
    }

    return this.openPackByRules(userId, albumId, pack);
  }

  private async openPackByRules(
    userId: string,
    albumId: string,
    pack: any,
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.coins < pack.price) {
      throw new BadRequestException('Coins insuficientes.');
    }

    const album = await this.prisma.album.findFirst({
      where: {
        id: albumId,
      },
    });

    if (!album) {
      throw new BadRequestException('Álbum não encontrado.');
    }

    const rarities = this.generatePackRarities(pack);

    const drawnStickers = [];

    for (const rarity of rarities) {
      const sticker = await this.drawStickerByRarity(
        albumId,
        rarity,
      );

      if (!sticker) {
        continue;
      }

      drawnStickers.push(sticker);

      await this.addStickerToUser(
        userId,
        albumId,
        sticker.id,
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        coins: {
          decrement: pack.price,
        },
      },
      select: {
        id: true,
        coins: true,
      },
    });

    await this.prisma.purchase.create({
      data: {
        userId,
        packId: pack.id,
        totalValue: pack.price,
      },
    });

    const xpReward = this.getPackXpReward(pack.type);

    const xpResult = await this.userLevelService.addXp(
      userId,
      xpReward,
      `OPEN_${pack.type}_PACK`,
    );

    return this.alertService.success('Pacote aberto com sucesso!', {
      pack,
      total: drawnStickers.length,
      stickers: drawnStickers,
      coinsSpent: pack.price,
      coinsRemaining: updatedUser.coins,

      xpEarned: xpReward,
      levelInfo: xpResult?.levelInfo || null,
    });
  }

  private generatePackRarities(pack: any): StickerRarity[] {
    const rarities: StickerRarity[] = [];

    if (pack.guaranteedLegendary) {
      rarities.push(StickerRarity.LEGENDARY);
    }

    while (rarities.length < pack.stickerQuantity) {
      rarities.push(this.drawRarity(pack));
    }

    return rarities;
  }

  private drawRarity(pack: any): StickerRarity {
    const random = Math.random() * 100;

    if (random < pack.legendaryChance) {
      return StickerRarity.LEGENDARY;
    }

    if (random < pack.legendaryChance + pack.epicChance) {
      return StickerRarity.EPIC;
    }

    if (
      random <
      pack.legendaryChance + pack.epicChance + pack.rareChance
    ) {
      return StickerRarity.RARE;
    }

    return StickerRarity.COMMON;
  }

  private async drawStickerByRarity(
    albumId: string,
    rarity: StickerRarity,
  ) {
    const stickers = await this.prisma.sticker.findMany({
      where: {
        albumId,
        rarity,
      },
    });

    if (!stickers.length) {
      return null;
    }

    const randomIndex = Math.floor(
      Math.random() * stickers.length,
    );

    return stickers[randomIndex];
  }

  private async addStickerToUser(
    userId: string,
    albumId: string,
    stickerId: string,
  ) {
    const existingUserSticker =
      await this.prisma.userSticker.findFirst({
        where: {
          userId,
          stickerId,
        },
      });

    if (existingUserSticker) {
      return this.prisma.userSticker.update({
        where: {
          id: existingUserSticker.id,
        },
        data: {
          quantityOwned: {
            increment: 1,
          },
          quantityDuplicate: {
            increment: 1,
          },
        },
      });
    }

    return this.prisma.userSticker.create({
      data: {
        userId,
        albumId,
        stickerId,
        quantityOwned: 1,
        quantityDuplicate: 0,
        isPlaced: false,
      },
    });
  }

  private getPackXpReward(packType: string): number {
    const rewards: Record<string, number> = {
      FREE: 5,
      SMALL: 15,
      PREMIUM: 60,
      ELITE: 120,
    };

    return rewards[packType] || 10;
  }
}