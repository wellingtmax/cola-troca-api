-- CreateTable
CREATE TABLE `ChatInteractionDismissed` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userStickerId` VARCHAR(191) NULL,

    UNIQUE INDEX `ChatInteractionDismissed_userId_messageId_key`(`userId`, `messageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChatInteractionDismissed` ADD CONSTRAINT `ChatInteractionDismissed_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatInteractionDismissed` ADD CONSTRAINT `ChatInteractionDismissed_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ChatMessage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChatInteractionDismissed` ADD CONSTRAINT `ChatInteractionDismissed_userStickerId_fkey` FOREIGN KEY (`userStickerId`) REFERENCES `UserSticker`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
