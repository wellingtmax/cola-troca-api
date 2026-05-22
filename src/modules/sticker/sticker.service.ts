import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { AlertService } from '../../common/services/alert.service';

import { CreateStickerDto } from './dto/create-sticker.dto';

@Injectable()
export class StickerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
  ) { }

  async create(dto: CreateStickerDto) {
    const album = await this.prisma.album.findUnique({
      where: { id: dto.albumId },
    });

    if (!album) {
      throw new BadRequestException('Álbum não encontrado.');
    }

    const stickerExists = await this.prisma.sticker.findUnique({
      where: {
        albumId_number: {
          albumId: dto.albumId,
          number: dto.number,
        },
      },
    });

    if (stickerExists) {
      throw new BadRequestException('Já existe uma figurinha com esse número neste álbum.');
    }

    const sticker = await this.prisma.sticker.create({
      data: {
        albumId: dto.albumId,
        number: dto.number,
        name: dto.name,
        rarity: dto.rarity,
        imageUrl: dto.imageUrl,
        isSpecial: dto.isSpecial ?? false,
      },
    });

    return this.alertService.success('Figurinha criada com sucesso!', sticker);
  }

  async findByAlbum(albumId: string) {
    const stickers = await this.prisma.sticker.findMany({
      where: { albumId },
      orderBy: { number: 'asc' },
    });

    return this.alertService.success('Figurinhas encontradas.', stickers);
  }

  async findMyStickers(userId: string) {
    const stickers = await this.prisma.userSticker.findMany({
      where: { userId },
      include: {
        sticker: true,
        album: true,
      },
      orderBy: {
        obtainedAt: 'desc',
      },
    });

    const formatted = stickers.map((item) => ({
      id: item.id,
      stickerId: item.stickerId,
      albumId: item.albumId,

      number: item.sticker.number,
      name: item.sticker.name,
      rarity: item.sticker.rarity,
      imageUrl: item.sticker.imageUrl,
      isSpecial: item.sticker.isSpecial,

      albumName: item.album.themeName,
      albumCover: item.album.coverUrl,

      quantityOwned: item.quantityOwned,
      quantityDuplicate: item.quantityDuplicate,

      isPlaced: item.isPlaced,
      favorite: item.favorite,
      obtainedAt: item.obtainedAt,
    }));

    return this.alertService.success('Figurinhas encontradas.', formatted);
  }

  async toggleFavorite(userId: string, userStickerId: string) {
    const userSticker = await this.prisma.userSticker.findFirst({
      where: {
        id: userStickerId,
        userId,
      },
    });

    if (!userSticker) {
      return this.alertService.error('Figurinha não encontrada.');
    }

    const updated = await this.prisma.userSticker.update({
      where: { id: userSticker.id },
      data: {
        favorite: !userSticker.favorite,
      },
    });

    return this.alertService.success('Favorito atualizado.', updated);
  }

  async placeSticker(userId:string, userStickerId: string) {

    const userSticker = 
    await this.prisma.userSticker.findFirst({
      where: {
        id: userStickerId,
        userId,
      },
    });

    if (!userSticker) {
      return this.alertService.error(
        'Figurinha não encontrada.',
      );
    }

    if (userSticker.isPlaced) {
      return this.alertService.warning(
        'Essa figurinha ja foi colada.',
      );
    }

    const updated = 
    await this.prisma.userSticker.update({
      where: {
        id: userSticker.id,
      },

      data: {
        isPlaced: true,
      },
    });

    return this.alertService.success(
      'Figurinha colada com sucesso!',
      updated,
    )
  }
}