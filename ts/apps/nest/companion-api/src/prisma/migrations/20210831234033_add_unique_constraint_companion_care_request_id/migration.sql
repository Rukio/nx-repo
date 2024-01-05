/*
  Warnings:

  - A unique constraint covering the columns `[careRequestId]` on the table `CompanionLink` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CompanionLink.careRequestId_unique" ON "CompanionLink"("careRequestId");
