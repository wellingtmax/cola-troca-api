-- AlterTable
ALTER TABLE `user` ADD COLUMN `level` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `levelTitle` VARCHAR(191) NOT NULL DEFAULT 'Colecionador Iniciante 1',
    ADD COLUMN `xp` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `UserExperienceLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `points` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserExperienceLog_userId_idx`(`userId`),
    INDEX `UserExperienceLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserExperienceLog` ADD CONSTRAINT `UserExperienceLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
