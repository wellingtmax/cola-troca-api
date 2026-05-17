import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma.service";
import { CreateAlbumDto } from "./dto/create-album.dto";
import { AlertService } from "../../common/services/alert.service";

@Injectable()
export class AlbumService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly alertService: AlertService,
    ) {}

    async create(dto: CreateAlbumDto) {

        const album = await this.prisma.album.create({
            data: {
                themeName: dto.themeName,
                coverUrl: dto.coverUrl,
                price: dto.price,
                releaseDate: new Date(),
            },
        });

        return this.alertService.success(
            'Álbum criado com sucesso!',
            album,
        );
    }

    async findAll() {
        const album = await this.prisma.album.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        return this.alertService.success(
            'Albuns encontrados.',
            album,
        );
    }
}