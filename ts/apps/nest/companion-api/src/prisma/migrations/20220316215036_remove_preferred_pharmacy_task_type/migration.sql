-- AlterEnum
BEGIN;
-- update existing records to use new value
UPDATE "CompanionTask" SET "type" = 'DEFAULT_PHARMACY' WHERE type = 'PREFERRED_PHARMACY';

-- create new enum
CREATE TYPE "CompanionTaskType_new" AS ENUM ('IDENTIFICATION_IMAGE', 'INSURANCE_CARD_IMAGES', 'DEFAULT_PHARMACY', 'PRIMARY_CARE_PROVIDER');

-- update table to use new enum
ALTER TABLE "CompanionTask" ALTER COLUMN "type" TYPE "CompanionTaskType_new" USING ("type"::text::"CompanionTaskType_new");

-- rename old enum
ALTER TYPE "CompanionTaskType" RENAME TO "CompanionTaskType_old";

-- rename new enum
ALTER TYPE "CompanionTaskType_new" RENAME TO "CompanionTaskType";

-- drop old enum
DROP TYPE "CompanionTaskType_old";
COMMIT;
