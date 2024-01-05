-- CreateEnum
CREATE TYPE "CompanionTaskType" AS ENUM ('IDENTIFICATION_IMAGE', 'INSURANCE_CARD_IMAGES');

-- CreateEnum
CREATE TYPE "CompanionTaskStatusName" AS ENUM ('NOT_STARTED', 'STARTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "CompanionTask" (
    "id" SERIAL NOT NULL,
    "type" "CompanionTaskType" NOT NULL,
    "companionLinkId" TEXT NOT NULL,
    "metadata" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanionTaskStatus" (
    "id" SERIAL NOT NULL,
    "companionTaskId" INTEGER NOT NULL,
    "name" "CompanionTaskStatusName" NOT NULL DEFAULT E'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanionTaskStatus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CompanionTask" ADD CONSTRAINT "CompanionTask_companionLinkId_fkey" FOREIGN KEY ("companionLinkId") REFERENCES "CompanionLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanionTaskStatus" ADD CONSTRAINT "CompanionTaskStatus_companionTaskId_fkey" FOREIGN KEY ("companionTaskId") REFERENCES "CompanionTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
