-- CreateTable
CREATE TABLE "DashboardAuth" (
    "accessToken" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardAuth.accessToken_unique" ON "DashboardAuth"("accessToken");
