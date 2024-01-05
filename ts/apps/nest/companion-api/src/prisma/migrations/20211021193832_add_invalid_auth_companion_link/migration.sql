-- AlterTable
ALTER TABLE "CompanionLink" ADD COLUMN     "invalidAuthCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastInvalidAuth" TIMESTAMP(3);
