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
        
        const stickers = album?.stickers.map((sticker) => {
            const userSticker = userStickers.find(
                (item) => item.stickerId === sticker.id,
            );

            return {
                ...sticker,

                owned: !!userSticker,

                isPlaced: userSticker?.isPlaced ?? false,

                canPlace: !!userSticker && !userSticker.isPlaced,

                quantityOwned: userSticker?.quantityOwned ?? 0,

                quantityDuplicate: userSticker?.quantityDuplicate ?? 0,
            };
        });

        const totalStickers = album?.stickers.length ?? 0;

        const placedTotal = userStickers.filter(
            (item) => item.isPlaced,
        ).length;

        const progress =
            totalStickers === 0
                ? 0
                : Number(((placedTotal / totalStickers) * 100).toFixed(2));

        return this.alertService.success(
            'Progresso do álbum encontrado.',
            {
                album,
                progress,
                totalStickers,
                ownedTotal: placedTotal,
                missingTotal: totalStickers - placedTotal,
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

    async placeSticker(
        userId: string,
        albumId: string,
        stickerId: string,
    ) {
        const userSticker = await this.prisma.userSticker.findFirst({
            where: {
                userId,
                albumId,
                stickerId,
            },
        });

        if (!userSticker) {
            return this.alertService.error(
                'Você ainda não possui essa figurinha.',
                null,
            );
        }

        if (userSticker.isPlaced) {
            return this.alertService.error(
                'Essa figurinha já foi colada.',
                null,
            );
        }

        const updatedSticker = await this.prisma.userSticker.update({
            where: {
                id: userSticker.id,
            },
            data: {
                isPlaced: true,
            },
        });

        return this.alertService.success(
            'Figurinha colada com sucesso.',
            updatedSticker,
        );
    }

    async contPendingAlbums(userId: string) {
        const pending = await this.prisma.userSticker.groupBy({
            by: ['albumId'],
            where: {
                userId,
                isPlaced: false,
            },
        });

        return this.alertService.success(
            'Álbuns com figurinhas pendentes encontrados.',
            pending.length,
        )
    }
}