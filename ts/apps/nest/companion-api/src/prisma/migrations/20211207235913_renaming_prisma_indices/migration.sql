-- RenameIndex
ALTER INDEX "CompanionLink.careRequestId_unique" RENAME TO "CompanionLink_careRequestId_key";

-- RenameIndex
ALTER INDEX "DashboardAuth.accessToken_unique" RENAME TO "DashboardAuth_accessToken_key";

-- RenameIndex
ALTER INDEX "Session.sid_unique" RENAME TO "Session_sid_key";

-- RenameIndex
ALTER INDEX "User.email_unique" RENAME TO "User_email_key";
