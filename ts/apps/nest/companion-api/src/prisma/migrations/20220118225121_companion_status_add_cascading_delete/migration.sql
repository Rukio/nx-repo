-- DropForeignKey
ALTER TABLE "CompanionTask" DROP CONSTRAINT "CompanionTask_companionLinkId_fkey";

-- DropForeignKey
ALTER TABLE "CompanionTaskStatus" DROP CONSTRAINT "CompanionTaskStatus_companionTaskId_fkey";

-- AddForeignKey
ALTER TABLE "CompanionTask" ADD CONSTRAINT "CompanionTask_companionLinkId_fkey" FOREIGN KEY ("companionLinkId") REFERENCES "CompanionLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanionTaskStatus" ADD CONSTRAINT "CompanionTaskStatus_companionTaskId_fkey" FOREIGN KEY ("companionTaskId") REFERENCES "CompanionTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
