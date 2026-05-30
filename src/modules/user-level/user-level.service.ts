import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

interface LevelDefinition {
    level: number;
    title: string;
    minXp: number;
}

@Injectable()
export class UserLevelService {
    private readonly levels: LevelDefinition[] = [
        { level: 1, title: 'Colecionador Iniciante 1', minXp: 0 },
        { level: 2, title: 'Colecionador Iniciante 2', minXp: 200 },
        { level: 3, title: 'Colecionador Iniciante 3', minXp: 500 },
        { level: 4, title: 'Colecionador Iniciante 4', minXp: 900 },
        { level: 5, title: 'Colecionador Iniciante 5', minXp: 1400 },

        { level: 6, title: 'Caçador de Figurinhas 1', minXp: 2000 },
        { level: 7, title: 'Caçador de Figurinhas 2', minXp: 3000 },
        { level: 8, title: 'Caçador de Figurinhas 3', minXp: 4300 },
        { level: 9, title: 'Caçador de Figurinhas 4', minXp: 5900 },
        { level: 10, title: 'Caçador de Figurinhas 5', minXp: 7800 },

        { level: 11, title: 'Colecionador Bronze 1', minXp: 10000 },
        { level: 12, title: 'Colecionador Bronze 2', minXp: 12500 },
        { level: 13, title: 'Colecionador Bronze 3', minXp: 15500 },
        { level: 14, title: 'Colecionador Bronze 4', minXp: 19000 },
        { level: 15, title: 'Colecionador Bronze 5', minXp: 23000 },

        { level: 16, title: 'Colecionador Prata 1', minXp: 28000 },
        { level: 17, title: 'Colecionador Prata 2', minXp: 34000 },
        { level: 18, title: 'Colecionador Prata 3', minXp: 41000 },
        { level: 19, title: 'Colecionador Prata 4', minXp: 49000 },
        { level: 20, title: 'Colecionador Prata 5', minXp: 58000 },

        { level: 21, title: 'Colecionador Ouro 1', minXp: 70000 },
        { level: 22, title: 'Colecionador Ouro 2', minXp: 83000 },
        { level: 23, title: 'Colecionador Ouro 3', minXp: 97000 },
        { level: 24, title: 'Colecionador Ouro 4', minXp: 112000 },
        { level: 25, title: 'Colecionador Ouro 5', minXp: 128000 },

        { level: 26, title: 'Mestre dos Packs 1', minXp: 146000 },
        { level: 27, title: 'Mestre dos Packs 2', minXp: 166000 },
        { level: 28, title: 'Mestre dos Packs 3', minXp: 188000 },
        { level: 29, title: 'Mestre dos Packs 4', minXp: 212000 },
        { level: 30, title: 'Mestre dos Packs 5', minXp: 238000 },

        { level: 31, title: 'Lenda do Álbum 1', minXp: 266000 },
        { level: 32, title: 'Lenda do Álbum 2', minXp: 296000 },
        { level: 33, title: 'Lenda do Álbum 3', minXp: 329000 },
        { level: 34, title: 'Lenda do Álbum 4', minXp: 365000 },
        { level: 35, title: 'Lenda do Álbum 5', minXp: 404000 },

        { level: 36, title: 'Elite Cola&Troca 1', minXp: 446000 },
        { level: 37, title: 'Elite Cola&Troca 2', minXp: 491000 },
        { level: 38, title: 'Elite Cola&Troca 3', minXp: 539000 },
        { level: 39, title: 'Elite Cola&Troca 4', minXp: 590000 },
        { level: 40, title: 'Elite Cola&Troca 5', minXp: 644000 },

        { level: 41, title: 'Campeão Colecionador 1', minXp: 702000 },
        { level: 42, title: 'Campeão Colecionador 2', minXp: 764000 },
        { level: 43, title: 'Campeão Colecionador 3', minXp: 830000 },
        { level: 44, title: 'Campeão Colecionador 4', minXp: 900000 },
        { level: 45, title: 'Campeão Colecionador 5', minXp: 975000 },

        { level: 46, title: 'Lendário Cola&Troca 1', minXp: 1055000 },
        { level: 47, title: 'Lendário Cola&Troca 2', minXp: 1140000 },
        { level: 48, title: 'Lendário Cola&Troca 3', minXp: 1230000 },
        { level: 49, title: 'Lendário Cola&Troca 4', minXp: 1325000 },
        { level: 50, title: 'Lendário Cola&Troca 5', minXp: 1425000 },
    ];

    constructor(
        private readonly prisma: PrismaService,
    ) { }

    getLevelInfo(xp: number) {
        const currentLevel =
            [...this.levels]
                .reverse()
                .find((level) => xp >= level.minXp) ||
            this.levels[0];

        const nextLevel =
            this.levels.find(
                (level) => level.level === currentLevel.level + 1,
            ) || null;

        const currentXp = currentLevel.minXp;
        const nextXp = nextLevel?.minXp || currentLevel.minXp;

        const xpInsideLevel = xp - currentXp;
        const xpNeededForNext = nextLevel ? nextXp - currentXp : 0;

        const progressPercent = nextLevel
            ? Math.min(
                100,
                Math.floor((xpInsideLevel / xpNeededForNext) * 100),
            )
            : 100;

        return {
            xp,
            level: currentLevel.level,
            levelTitle: currentLevel.title,

            currentLevelXp: currentXp,
            nextLevelXp: nextLevel?.minXp || null,

            xpToNextLevel: nextLevel
                ? nextLevel.minXp - xp
                : 0,

            progressPercent,

            isMaxLevel: !nextLevel,
        };
    }

    getLevelTable() {
        return this.levels.map((level, index) => {
            const nextLevel = this.levels[index + 1] || null;

            return {
                level: level.level,
                title: level.title,
                minXp: level.minXp,
                nextLevelXp: nextLevel?.minXp || null,
                xpRequiredToNext: nextLevel
                    ? nextLevel.minXp - level.minXp
                    : 0,
                isMaxLevel: !nextLevel,
            };
        });
    }

    async getMyLevel(userId: string) {
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
                coins: true,

                xp: true,
                level: true,
                levelTitle: true,
            },
        });

        if (!user) {
            throw new NotFoundException(
                'Usuário não encontrado.',
            );
        }

        const levelInfo = this.getLevelInfo(user.xp);

        return {
            user,
            levelInfo,
        };
    }

    async addXp(
        userId: string,
        points: number,
        reason: string,
    ) {
        if (points <= 0) {
            return null;
        }

        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    xp: true,
                },
            });

            if (!user) {
                return null;
            }

            const newXp = user.xp + points;
            const levelInfo = this.getLevelInfo(newXp);

            const updatedUser = await tx.user.update({
                where: {
                    id: userId,
                },
                data: {
                    xp: newXp,
                    level: levelInfo.level,
                    levelTitle: levelInfo.levelTitle,
                },
                select: {
                    id: true,
                    xp: true,
                    level: true,
                    levelTitle: true,
                },
            });

            await tx.userExperienceLog.create({
                data: {
                    userId,
                    points,
                    reason,
                },
            });

            return {
                user: updatedUser,
                levelInfo,
                pointsAdded: points,
                reason,
            };
        });
    }
}