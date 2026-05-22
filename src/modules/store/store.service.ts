import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { AlertService } from '../../common/services/alert.service';

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: AlertService,
  ) { }

  async buyAlbum(userId: string, albumId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('Álbum não encontrado.');
    }

    const alreadyBought = await this.prisma.userAlbum.findFirst({
      where: {
        userId,
        albumId,
      },
    });

    if (alreadyBought) {
      throw new BadRequestException('Você já possui este álbum.');
    }

    const userAlbum = await this.prisma.userAlbum.create({
      data: {
        userId,
        albumId,
      },
      include: {
        album: true,
      },
    });

    return this.alertService.success(
      'Álbum comprado com sucesso!',
      userAlbum,
    );
  }

  async myAlbums(userId: string) {

    const albums = await this.prisma.userAlbum.findMany({
      where: {
        userId,
      },

      include: {
        album: true,
      },

      orderBy: {
        id: 'desc',
      },
    });

    const formattedAlbums = albums.map((item) => ({
      id: item.album.id,
      themeName: item.album.themeName,
      coverUrl: item.album.coverUrl,
      price: item.album.price,
      releaseDate: item.album.releaseDate,

      company: item.album.company,
      category: item.album.category,
      collection: item.album.collection,
      isFeatured: item.album.isFeatured,
      isExclusive: item.album.isExclusive,
    }));

    return this.alertService.success(
      'Biblioteca encontrada com sucesso.',
      formattedAlbums,
    );
  }
}