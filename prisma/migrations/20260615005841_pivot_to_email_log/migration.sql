/*
  Warnings:

  - You are about to drop the column `draftId` on the `InstantlySync` table. All the data in the column will be lost.
  - You are about to drop the `Draft` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SequenceStatus" AS ENUM ('NEW', 'ACTIVE', 'PAUSED', 'NURTURE_PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EmailResult" AS ENUM ('PENDING', 'NO_RESPONSE', 'REPLIED', 'MEETING_SCHEDULED', 'UNSUBSCRIBED');

-- DropForeignKey
ALTER TABLE "Draft" DROP CONSTRAINT "Draft_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Draft" DROP CONSTRAINT "Draft_contactId_fkey";

-- DropForeignKey
ALTER TABLE "InstantlySync" DROP CONSTRAINT "InstantlySync_draftId_fkey";

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "currentTouchNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastEmailDate" TIMESTAMP(3),
ADD COLUMN     "nextFollowUpDate" TIMESTAMP(3),
ADD COLUMN     "sequenceStatus" "SequenceStatus" NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "InstantlySync" DROP COLUMN "draftId";

-- DropTable
DROP TABLE "Draft";

-- DropEnum
DROP TYPE "DraftStatus";

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "touchNumber" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "emailContent" TEXT NOT NULL,
    "result" "EmailResult" NOT NULL DEFAULT 'PENDING',
    "sentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactStrategy" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "recommendedApproach" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContactStrategy_contactId_key" ON "ContactStrategy"("contactId");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactStrategy" ADD CONSTRAINT "ContactStrategy_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
