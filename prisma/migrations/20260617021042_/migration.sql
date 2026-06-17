-- CreateTable
CREATE TABLE "ResearchHistory" (
    "id" TEXT NOT NULL,
    "industryKey" TEXT NOT NULL,
    "territoryKey" TEXT NOT NULL,
    "researchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResearchHistory_industryKey_idx" ON "ResearchHistory"("industryKey");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchHistory_industryKey_territoryKey_key" ON "ResearchHistory"("industryKey", "territoryKey");
