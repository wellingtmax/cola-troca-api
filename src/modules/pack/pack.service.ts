import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { StickerRarity } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AlertService } from '../../common/services/alert.service';

import { OpenPackDto, PackType } from './dto/open-pack.dto';

@Injectable()
export class PackService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly alertService: AlertService,
    ) { }

    async openPack(userId: string, dto: OpenPackDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        const packPrice = this.getPackPrice(dto.packType);

        if (!user) {
            throw new NotFoundException(
                'Usuário não encontrado.',
            );
        }

        if (user.coins < packPrice) {
            throw new BadRequestException(
                'Coins insuficientes.',
            );
        }

        const album = await this.prisma.album.findUnique({
            where: {
                id: dto.albumId,
            },
        });

        if (!album) {
            throw new BadRequestException('Álbum não encontrado.');
        }

        let quantity = 5;

        switch (dto.packType) {
            case PackType.SMALL:
                quantity = 5;
                break;

            case PackType.MEDIUM:
                quantity = 15;
                break;

            case PackType.LARGE:
                quantity = 30;
                break;
        }

        const stickers = [];

        for (let i = 0; i < quantity; i++) {
            const rarity = this.generateRarity(dto.packType);

            const possibleStickers = await this.prisma.sticker.findMany({
                where: {
                    albumId: dto.albumId,
                    rarity,
                },
            });

            if (!possibleStickers.length) {
                continue;
            }

            const randomIndex = Math.floor(Math.random() * possibleStickers.length);

            const sticker = possibleStickers[randomIndex];

            stickers.push(sticker);

            const existingUserSticker = await this.prisma.userSticker.findFirst({
                where: {
                    userId,
                    stickerId: sticker.id,
                },
            });

            if (existingUserSticker) {
                await this.prisma.userSticker.update({
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
            } else {
                await this.prisma.userSticker.create({
                    data: {
                        userId,
                        albumId: dto.albumId,
                        stickerId: sticker.id,
                        quantityOwned: 1,
                        quantityDuplicate: 0,
                    },
                });
            }
        }

        const updatedUser = await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                coins: {
                    decrement: packPrice,
                },
            },
            select: {
                id: true,
                coins: true,
            },
        });

        return this.alertService.success('Pacote aberto com sucesso!', {
            total: stickers.length,
            stickers,
            coinsSpent: packPrice,
            coinsRemaining: updatedUser.coins,
        });
    }

    private generateRarity(packType: PackType | 'FREE'): StickerRarity {
        const random = Math.random() * 100;

        if (packType === 'FREE') {
            if (random <= 90) return StickerRarity.COMMON;
            if (random <= 99) return StickerRarity.RARE;
            return StickerRarity.EPIC;
        }

        if (packType === PackType.SMALL) {
            if (random <= 80) return StickerRarity.COMMON;
            if (random <= 95) return StickerRarity.RARE;
            if (random <= 99) return StickerRarity.EPIC;
            return StickerRarity.LEGENDARY;
        }

        if (packType === PackType.MEDIUM) {
            if (random <= 55) return StickerRarity.COMMON;
            if (random <= 85) return StickerRarity.RARE;
            if (random <= 97) return StickerRarity.EPIC;
            return StickerRarity.LEGENDARY;
        }

        if (packType === PackType.LARGE) {
            if (random <= 35) return StickerRarity.COMMON;
            if (random <= 75) return StickerRarity.RARE;
            if (random <= 95) return StickerRarity.EPIC;
            return StickerRarity.LEGENDARY;
        }

        return StickerRarity.COMMON;
    }

    private getPackPrice(packType: PackType): number {
        if (packType === PackType.SMALL) return 50;
        if (packType === PackType.MEDIUM) return 500;
        if (packType === PackType.LARGE) return 1000;

        return 0;
    }
}