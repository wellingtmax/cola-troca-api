/*
  Warnings:

  - A unique constraint covering the columns `[tradeCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `tradeCode` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_tradeCode_key` ON `User`(`tradeCode`);
