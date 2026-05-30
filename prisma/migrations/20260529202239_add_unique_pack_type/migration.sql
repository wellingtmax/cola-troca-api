/*
  Warnings:

  - A unique constraint covering the columns `[type]` on the table `Pack` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Pack_type_key" ON "Pack"("type");
