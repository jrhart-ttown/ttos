-- CreateEnum
CREATE TYPE "Territory" AS ENUM ('SOUTH_TULSA', 'JENKS', 'BROKEN_ARROW', 'BIXBY', 'MIDTOWN_TULSA', 'OWASSO', 'SAND_SPRINGS', 'SAPULPA', 'OTHER');

-- CreateEnum
CREATE TYPE "Segment" AS ENUM ('BASE_HIT', 'WHALE');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('A', 'B', 'C', 'UNSCORED');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('NEW', 'RESEARCHED', 'QUEUED', 'CONTACTED', 'REPLIED', 'WALKTHROUGH_SCHEDULED', 'PROPOSAL_SENT', 'WON', 'LOST', 'NURTURE');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('DECISION_MAKER', 'OFFICE_MANAGER', 'PRACTICE_ADMIN', 'OPERATIONS_MANAGER', 'GENERAL_OFFICE', 'CONTACT_FORM');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('EMAIL', 'CALL', 'MEETING', 'WALKTHROUGH', 'EVENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('PENDING', 'APPROVED', 'PUSHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Milestone" AS ENUM ('INTRODUCTION_SECURED', 'COFFEE_MEETING', 'EVENT_ATTENDANCE', 'SITE_VISIT', 'PROPOSAL_REQUESTED', 'BUDGET_TIMING_IDENTIFIED');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('NEW_OFFICE', 'RELOCATION', 'EXPANSION', 'HIRING_GROWTH', 'LEADERSHIP_CHANGE', 'ADMIN_TURNOVER', 'CONSTRUCTION', 'RENOVATION', 'AWARD', 'SPONSORSHIP', 'ANNOUNCEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "website" TEXT,
    "domain" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT NOT NULL DEFAULT 'OK',
    "zip" TEXT,
    "territory" "Territory" NOT NULL DEFAULT 'OTHER',
    "industry" TEXT,
    "segment" "Segment" NOT NULL DEFAULT 'BASE_HIT',
    "tier" "Tier" NOT NULL DEFAULT 'UNSCORED',
    "stage" "Stage" NOT NULL DEFAULT 'NEW',
    "lostReason" TEXT,
    "reengageDate" TIMESTAMP(3),
    "estMonthlyValue" INTEGER,
    "sqftEstimate" INTEGER,
    "locationsCount" INTEGER NOT NULL DEFAULT 1,
    "whyTheyFit" TEXT,
    "dedupKey" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "nextActionDate" TIMESTAMP(3),
    "nextAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contactType" "ContactType" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "channel" "Channel" NOT NULL,
    "summary" TEXT NOT NULL,
    "painPoints" TEXT,
    "contractTiming" TEXT,
    "referralsDiscussed" TEXT,
    "nextSteps" TEXT,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "personalization" TEXT NOT NULL,
    "emailBody" TEXT NOT NULL,
    "subjectLine" TEXT,
    "status" "DraftStatus" NOT NULL DEFAULT 'PENDING',
    "campaignId" TEXT,
    "pushedAt" TIMESTAMP(3),
    "instantlyResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhaleMilestone" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "milestone" "Milestone" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhaleMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriggerEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "TriggerType" NOT NULL,
    "description" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "eventDate" TIMESTAMP(3),
    "usedInOutreach" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TriggerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstantlySync" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "instantlyLeadEmail" TEXT NOT NULL,
    "pushedAt" TIMESTAMP(3) NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstantlySync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "leadEmail" TEXT,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_dedupKey_key" ON "Company"("dedupKey");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_companyId_email_key" ON "Contact"("companyId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhaleMilestone" ADD CONSTRAINT "WhaleMilestone_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriggerEvent" ADD CONSTRAINT "TriggerEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstantlySync" ADD CONSTRAINT "InstantlySync_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstantlySync" ADD CONSTRAINT "InstantlySync_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
