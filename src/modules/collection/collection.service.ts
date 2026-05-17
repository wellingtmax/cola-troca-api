import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../database/prisma.service";
import { AlertService } from "../../common/services/alert.service";

@Injectable()
export class CollectionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly alertService: AlertService,
    ) { }

    async findMyStickers(userId: string) {
        const stickers = await this.prisma.userSticker.findMany({
            where: { userId },
            include: {
                sticker: {
                    include: {
                        album: true,
                    },
                },
            },
            orderBy: {
                id: 'desc',
            },
        });

        return this.alertService.success(
            'Coleção encontrada com sucesso.',
            stickers,
        );
    }

    async findAlbumProgress(userId: string, albumId: string) {
        const album = await this.prisma.album.findUnique({
            where: { id: albumId },
            include: {
                stickers: {
                    orderBy: { number: 'asc' },
                },
            },
        });

        const userStickers = await this.prisma.userSticker.findMany({
            where: {
                userId,
                albumId,
            },
        });


        const ownedStickerIds = new Set(
            userStickers.map((item) => item.stickerId),
        );

        const stickers = album?.stickers.map((sticker) => ({
            ...sticker,
            owned: ownedStickerIds.has(sticker.id),
            quantityOwned:
                userStickers.find((item) => item.stickerId === sticker.id)
                    ?.quantityOwned ?? 0,
            quantityDuplicate:
                userStickers.find((item) => item.stickerId === sticker.id)
                    ?.quantityDuplicate ?? 0,
        }));

        const totalStickers = album?.stickers.length ?? 0;
        const ownedTotal = ownedStickerIds.size;

        const progress = totalStickers === 0 ? 0 : Number(((ownedTotal / totalStickers) * 100).toFixed(2));

        return this.alertService.success(
            'Progresso do álbum encontrado.',
            {
                album,
                progress,
                totalStickers,
                ownedTotal,
                missingTotal: totalStickers - ownedTotal,
                stickers,
            },
        );
    }

    async findDuplicates(userId: string) {
        const duplicates = await this.prisma.userSticker.findMany({
            where: {
                userId,
                quantityDuplicate: {
                    gt: 0,
                },
            },
            include: {
                sticker: {
                    include: {
                        album: true,
                    },
                },
            },
            orderBy: {
                quantityDuplicate: 'desc',
            },
        });

        const formattedDuplicates = duplicates.map((item) => ({
            id: item.id,
            stickerId: item.stickerId,
            albumId: item.albumId,
            quantityOwned: item.quantityOwned,
            quantityDuplicate: item.quantityDuplicate,

            sticker: {
                id: item.sticker.id,
                number: item.sticker.number,
                name: item.sticker.name,
                rarity: item.sticker.rarity,
                imageUrl: item.sticker.imageUrl,
                isSpecial: item.sticker.isSpecial,
            },

            album: {
                id: item.sticker.album.id,
                themeName: item.sticker.album.themeName,
                coverUrl: item.sticker.album.coverUrl,
            },
        }));

        return this.alertService.success(
            'Figurinhas repetidas encontradas.',
            formattedDuplicates,
        );
    }
}