-- AlterTable
ALTER TABLE "users" ADD COLUMN "onboarding_completed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "datasets" ADD COLUMN "industry" TEXT,
ADD COLUMN "stage" TEXT,
ADD COLUMN "is_demo" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "FundingStage" AS ENUM ('PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'SERIES_D_PLUS', 'GROWTH', 'PUBLIC');

-- AlterTable (update stage column to use enum)
ALTER TABLE "datasets" ALTER COLUMN "stage" TYPE "FundingStage" USING ("stage"::"FundingStage");
