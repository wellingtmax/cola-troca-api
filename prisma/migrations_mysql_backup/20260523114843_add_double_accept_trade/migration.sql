-- AlterTable
ALTER TABLE `trade` ADD COLUMN `receiverAccepted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `senderAccepted` BOOLEAN NOT NULL DEFAULT false;
