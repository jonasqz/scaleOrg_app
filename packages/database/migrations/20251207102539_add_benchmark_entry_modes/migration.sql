-- CreateEnum
CREATE TYPE "BenchmarkEntryMode" AS ENUM ('DETAILED', 'FALLBACK');

-- AlterTable: Add entryMode column with default FALLBACK
ALTER TABLE "organizational_benchmarks" ADD COLUMN "entry_mode" "BenchmarkEntryMode" NOT NULL DEFAULT 'FALLBACK';

-- AlterTable: Add departmentHeadcount and revenueData JSON columns
ALTER TABLE "organizational_benchmarks" ADD COLUMN "department_headcount" JSONB;
ALTER TABLE "organizational_benchmarks" ADD COLUMN "revenue_data" JSONB;

-- AlterTable: Make benchmarkType and metricName nullable (they're optional in DETAILED mode)
ALTER TABLE "organizational_benchmarks" ALTER COLUMN "benchmark_type" DROP NOT NULL;
ALTER TABLE "organizational_benchmarks" ALTER COLUMN "metric_name" DROP NOT NULL;

-- DropIndex: Remove old unique constraint
DROP INDEX IF EXISTS "organizational_benchmarks_industry_region_company_size_benchm_key";

-- CreateIndex: Add new unique constraint that includes entry_mode
CREATE UNIQUE INDEX "organizational_benchmarks_industry_region_company_size_entr_key" ON "organizational_benchmarks"("industry", "region", "company_size", "entry_mode", "benchmark_type", "metric_name", "effective_date");

-- CreateIndex: Add index on entry_mode for faster filtering
CREATE INDEX "organizational_benchmarks_entry_mode_idx" ON "organizational_benchmarks"("entry_mode");
