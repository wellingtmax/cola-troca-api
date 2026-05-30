import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../database/prisma.service";
import { AlertService } from "../../common/services/alert.service";
import { StickerRarity } from "@prisma/client";
import { UserLevelService } from "../user-level/user-level.service";

@Injectable()
export class CollectionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly alertService: AlertService,
        private readonly userLevelService: UserLevelService,
    ) { }

    async buyAlbum(
        userId: string,
        albumId: string,
    ) {
        const album = await this.prisma.album.findUnique({
            where: {
                id: albumId,
            },
        });

        if (!album) {
            throw new NotFoundException(
                'Álbum não encontrado.',
            );
        }

        const alreadyOwned = await this.prisma.userAlbum.findFirst({
            where: {
                userId,
                albumId,
            },
        });

        if (alreadyOwned) {
            throw new BadRequestException(
                'Você já possui este álbum.',
            );
        }

        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                coins: true,
            },
        });

        if (!user) {
            throw new NotFoundException(
                'Usuário não encontrado.',
            );
        }

        if (user.coins < album.price) {
            throw new BadRequestException(
                'Coins insuficientes para comprar este álbum.',
            );
        }

        const result = await this.prisma.$transaction(async (tx) => {
            const userAlbum = await tx.userAlbum.create({
                data: {
                    userId,
                    albumId,
                },
                include: {
                    album: true,
                },
            });

            const updatedUser = await tx.user.update({
                where: {
                    id: userId,
                },
                data: {
                    coins: {
                        decrement: album.price,
                    },
                },
                select: {
                    id: true,
                    coins: true,
                },
            });

            return {
                userAlbum,
                updatedUser,
            };
        });

        const xpReward = 80;

        const xpResult = await this.userLevelService.addXp(
            userId,
            xpReward,
            'ALBUM_PURCHASED',
        );

        return this.alertService.success(
            'Álbum adquirido com sucesso.',
            {
                album: result.userAlbum,
                coinsSpent: album.price,
                coinsRemaining: result.updatedUser.coins,
                xpEarned: xpReward,
                levelInfo: xpResult?.levelInfo || null,
            },
        );
    }


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

    private getStickerXpReward(rarity: StickerRarity): number {
        const rewards: Record<StickerRarity, number> = {
            COMMON: 3,
            RARE: 8,
            EPIC: 20,
            LEGENDARY: 40,
        };

        return rewards[rarity] || 3;
    }

    private async checkAndRewardCompletedAlbum(
        userId: string,
        albumId: string,
    ) {
        const totalStickers = await this.prisma.sticker.count({
            where: {
                albumId,
            },
        });

        if (totalStickers === 0) {
            return null;
        }

        const placedStickers = await this.prisma.userSticker.count({
            where: {
                userId,
                albumId,
                isPlaced: true,
            },
        });

        if (placedStickers < totalStickers) {
            return null;
        }

        const alreadyRewarded =
            await this.prisma.userAlbumReward.findFirst({
                where: {
                    userId,
                    albumId,
                    rewardType: 'ALBUM_COMPLETED',
                    reference: 'FULL_ALBUM',
                },
            });

        if (alreadyRewarded) {
            return null;
        }

        const xpReward = 1500;

        await this.prisma.userAlbumReward.create({
            data: {
                userId,
                albumId,
                rewardType: 'ALBUM_COMPLETED',
                reference: 'FULL_ALBUM',
                xpEarned: xpReward,
            },
        });

        const xpResult = await this.userLevelService.addXp(
            userId,
            xpReward,
            'ALBUM_COMPLETED',
        );

        return {
            xpEarned: xpReward,
            levelInfo: xpResult?.levelInfo || null,
        };
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
            include: {
                sticker: true,
            }
        });

        if (!userSticker) {
            throw new BadRequestException(
                'Você ainda não possui essa figurinha.',
            );
        }

        if (userSticker.isPlaced) {
            throw new BadRequestException(
                'Essa figurinha já foi colada.',
            );
        }

        const updatedSticker = await this.prisma.userSticker.update({
            where: {
                id: userSticker.id,
            },
            data: {
                isPlaced: true,
            },

            include: {
                sticker: true,
                album: true,
            }
        });

        const xpReward = this.getStickerXpReward(
            userSticker.sticker.rarity,
        );

        const xpResult = await this.userLevelService.addXp(
            userId,
            xpReward,
            `PLACE_${userSticker.sticker.rarity}_STICKER`,
        );

        const albumCompletionReward =
            await this.checkAndRewardCompletedAlbum(
                userId,
                albumId,
            );

        const totalXpEarned =
            xpReward + (albumCompletionReward?.xpEarned || 0);

        return this.alertService.success(
            'Figurinha colada com sucesso.',
            {
                sticker: updatedSticker,

                xpEarned: totalXpEarned,

                stickerXpEarned: xpReward,

                albumCompletionReward,

                levelInfo:
                    albumCompletionReward?.levelInfo ||
                    xpResult?.levelInfo ||
                    null,
            },
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

    async placeAllStickersFromAlbum(
        userId: string,
        albumId: string,
    ) {
        const album = await this.prisma.album.findUnique({
            where: {
                id: albumId,
            },
        });

        if (!album) {
            throw new NotFoundException(
                'Álbum não encontrado.',
            );
        }

        const stickersToPlace = await this.prisma.userSticker.findMany({
            where: {
                userId,
                albumId,
                isPlaced: false,
                quantityOwned: {
                    gt: 0,
                },
            },
            include: {
                sticker: true,
                album: true,
            },
        });

        if (stickersToPlace.length === 0) {
            throw new BadRequestException(
                'Não há figurinhas disponíveis para colar neste álbum.',
            );
        }

        const stickerIds = stickersToPlace.map((item) => item.id);

        await this.prisma.userSticker.updateMany({
            where: {
                id: {
                    in: stickerIds,
                },
            },
            data: {
                isPlaced: true,
            },
        });

        const xpEarned = stickersToPlace.reduce(
            (total, item) =>
                total + this.getStickerXpReward(item.sticker.rarity),
            0,
        );

        const xpResult = await this.userLevelService.addXp(
            userId,
            xpEarned,
            'PLACE_ALL_STICKERS_FROM_ALBUM',
        );

        const albumCompletionReward =
            await this.checkAndRewardCompletedAlbum(
                userId,
                albumId,
            );

        const totalXpEarned =
            xpEarned + (albumCompletionReward?.xpEarned || 0);

        const placedStickers = await this.prisma.userSticker.findMany({
            where: {
                id: {
                    in: stickerIds,
                },
            },
            include: {
                sticker: true,
                album: true,
            },
        });

        return this.alertService.success(
            'Figurinhas coladas com sucesso.',
            {
                albumId,
                totalPlaced: placedStickers.length,
                stickers: placedStickers,
                xpEarned: totalXpEarned,
                stickerXpEarned: xpEarned,
                albumCompletionReward,
                levelInfo:
                    albumCompletionReward?.levelInfo ||
                    xpResult?.levelInfo ||
                    null,
            },
        );
    }

    async placeAllMyStickers(userId: string) {
        const stickersToPlace = await this.prisma.userSticker.findMany({
            where: {
                userId,
                isPlaced: false,
                quantityOwned: {
                    gt: 0,
                },
            },
            include: {
                sticker: true,
                album: true,
            },
        });

        if (stickersToPlace.length === 0) {
            throw new BadRequestException(
                'Não há figurinhas disponíveis para colar.',
            );
        }

        const userStickerIds = stickersToPlace.map(
            (item) => item.id,
        );

        await this.prisma.userSticker.updateMany({
            where: {
                id: {
                    in: userStickerIds,
                },
            },
            data: {
                isPlaced: true,
            },
        });

        const xpEarned = stickersToPlace.reduce(
            (total, item) =>
                total + this.getStickerXpReward(item.sticker.rarity),
            0,
        );

        const xpResult = await this.userLevelService.addXp(
            userId,
            xpEarned,
            'PLACE_ALL_MY_STICKERS',
        );

        const affectedAlbumIds = [
            ...new Set(
                stickersToPlace.map((item) => item.albumId),
            ),
        ];

        const albumCompletionRewards = [];

        for (const affectedAlbumId of affectedAlbumIds) {
            const reward =
                await this.checkAndRewardCompletedAlbum(
                    userId,
                    affectedAlbumId,
                );

            if (reward) {
                albumCompletionRewards.push({
                    albumId: affectedAlbumId,
                    ...reward,
                });
            }
        }

        const albumCompletionXpEarned =
            albumCompletionRewards.reduce(
                (total, reward) => total + reward.xpEarned,
                0,
            );

        const totalXpEarned =
            xpEarned + albumCompletionXpEarned;

        const placedStickers = await this.prisma.userSticker.findMany({
            where: {
                id: {
                    in: userStickerIds,
                },
            },
            include: {
                sticker: true,
                album: true,
            },
        });

        const lastAlbumCompletionReward =
            albumCompletionRewards.length > 0
                ? albumCompletionRewards[albumCompletionRewards.length - 1]
                : null;

        return this.alertService.success(
            'Todas as figurinhas disponíveis foram coladas.',
            {
                totalPlaced: placedStickers.length,
                stickers: placedStickers,
                xpEarned: totalXpEarned,
                stickerXpEarned: xpEarned,
                albumCompletionRewards,
                levelInfo:
                    lastAlbumCompletionReward?.levelInfo ||
                    xpResult?.levelInfo ||
                    null,
            },
        );
    }
}