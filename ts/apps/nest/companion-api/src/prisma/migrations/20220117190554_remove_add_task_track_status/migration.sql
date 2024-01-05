/*
  Warnings:

  - You are about to drop the `CompanionTask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CompanionTaskStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CompanionTask" DROP CONSTRAINT "CompanionTask_activeStatusId_fkey";

-- DropForeignKey
ALTER TABLE "CompanionTask" DROP CONSTRAINT "CompanionTask_companionLinkId_fkey";

-- DropForeignKey
ALTER TABLE "CompanionTaskStatus" DROP CONSTRAINT "CompanionTaskStatus_companionTaskId_fkey";

-- DropTable
DROP TABLE "CompanionTask";

-- DropTable
DROP TABLE "CompanionTaskStatus";

-- DropEnum
DROP TYPE "CompanionTaskStatusName";

-- DropEnum
DROP TYPE "CompanionTaskType";
