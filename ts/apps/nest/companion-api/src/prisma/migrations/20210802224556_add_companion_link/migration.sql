-- CreateTable
CREATE TABLE "CompanionLink" (
    "id" TEXT NOT NULL,
    "careRequestId" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);
