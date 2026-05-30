/*
  Warnings:

  - A unique constraint covering the columns `[themeName]` on the table `Album` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Album_themeName_key" ON "Album"("themeName");
