import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { AlertService } from '../../common/services/alert.service';

import { CreateStickerDto } from './dto/create-sticker.dto';

@Injectable()
export class StickerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
  ) {}

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
}