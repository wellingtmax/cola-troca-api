-- CreateTable
CREATE TABLE `UserAlbumReward` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `albumId` VARCHAR(191) NOT NULL,
    `rewardType` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `xpEarned` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserAlbumReward_userId_idx`(`userId`),
    INDEX `UserAlbumReward_albumId_idx`(`albumId`),
    UNIQUE INDEX `UserAlbumReward_userId_albumId_rewardType_reference_key`(`userId`, `albumId`, `rewardType`, `reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserAlbumReward` ADD CONSTRAINT `UserAlbumReward_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAlbumReward` ADD CONSTRAINT `UserAlbumReward_albumId_fkey` FOREIGN KEY (`albumId`) REFERENCES `Album`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
