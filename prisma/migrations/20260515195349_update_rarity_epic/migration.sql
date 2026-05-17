/*
  Warnings:

  - The values [VERY_RARE] on the enum `Sticker_rarity` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `sticker` MODIFY `rarity` ENUM('COMMON', 'RARE', 'EPIC', 'LEGENDARY') NOT NULL;
