/*
  Warnings:

  - You are about to drop the column `userStickerId` on the `chatinteractiondismissed` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `chatinteractiondismissed` DROP FOREIGN KEY `ChatInteractionDismissed_userStickerId_fkey`;

-- DropIndex
DROP INDEX `ChatInteractionDismissed_userStickerId_fkey` ON `chatinteractiondismissed`;

-- AlterTable
ALTER TABLE `chatinteractiondismissed` DROP COLUMN `userStickerId`;
