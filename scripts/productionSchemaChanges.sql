-- AlterEnum
ALTER TYPE "CandidateStatus" ADD VALUE 'UNRESOLVED';

-- AlterTable
ALTER TABLE "vocabulary_candidate" ADD COLUMN     "leaseExpiresAt" TIMESTAMP(3),
ADD COLUMN     "leaseToken" TEXT,
ADD COLUMN     "refineAttempts" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "study_review" ADD COLUMN     "clientAnswerId" TEXT;

-- AlterTable
ALTER TABLE "vocab_card_video" ADD COLUMN     "pollErrorCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "study_review_clientAnswerId_key" ON "study_review"("clientAnswerId");
