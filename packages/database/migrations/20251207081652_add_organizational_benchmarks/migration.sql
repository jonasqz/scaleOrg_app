-- CreateEnum
CREATE TYPE "BenchmarkType" AS ENUM ('STRUCTURE', 'EFFICIENCY', 'TENURE');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('THIRD_PARTY', 'MANUAL', 'CROWDSOURCED');

-- CreateTable
CREATE TABLE "organizational_benchmarks" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "company_size" TEXT NOT NULL,
    "growth_stage" TEXT,
    "benchmark_type" "BenchmarkType" NOT NULL,
    "metric_name" TEXT NOT NULL,
    "p10_value" DECIMAL(12,2),
    "p25_value" DECIMAL(12,2),
    "p50_value" DECIMAL(12,2),
    "p75_value" DECIMAL(12,2),
    "p90_value" DECIMAL(12,2),
    "department_data" JSONB,
    "sampleSize" INTEGER NOT NULL,
    "currency" TEXT,
    "unit" TEXT,
    "source_id" TEXT,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "expiration_date" TIMESTAMP(3),
    "last_verified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "methodology" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizational_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "website" TEXT,
    "contact_email" TEXT,
    "description" TEXT,
    "license_type" TEXT,
    "access_notes" TEXT,
    "last_contacted" TIMESTAMP(3),
    "reliability" TEXT,
    "update_frequency" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benchmark_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_audit_logs" (
    "id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT,
    "source_id" TEXT,
    "previous_data" JSONB,
    "new_data" JSONB,
    "change_reason" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "benchmark_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizational_benchmarks_industry_region_company_size_idx" ON "organizational_benchmarks"("industry", "region", "company_size");

-- CreateIndex
CREATE INDEX "organizational_benchmarks_benchmark_type_metric_name_idx" ON "organizational_benchmarks"("benchmark_type", "metric_name");

-- CreateIndex
CREATE INDEX "organizational_benchmarks_effective_date_expiration_date_idx" ON "organizational_benchmarks"("effective_date", "expiration_date");

-- CreateIndex
CREATE INDEX "organizational_benchmarks_source_id_idx" ON "organizational_benchmarks"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizational_benchmarks_industry_region_company_size_benc_key" ON "organizational_benchmarks"("industry", "region", "company_size", "benchmark_type", "metric_name", "effective_date");

-- CreateIndex
CREATE UNIQUE INDEX "benchmark_sources_name_key" ON "benchmark_sources"("name");

-- CreateIndex
CREATE INDEX "benchmark_sources_type_idx" ON "benchmark_sources"("type");

-- CreateIndex
CREATE INDEX "benchmark_sources_is_active_idx" ON "benchmark_sources"("is_active");

-- CreateIndex
CREATE INDEX "benchmark_audit_logs_resource_type_resource_id_idx" ON "benchmark_audit_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "benchmark_audit_logs_user_id_idx" ON "benchmark_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "benchmark_audit_logs_source_id_idx" ON "benchmark_audit_logs"("source_id");

-- CreateIndex
CREATE INDEX "benchmark_audit_logs_action_idx" ON "benchmark_audit_logs"("action");

-- CreateIndex
CREATE INDEX "benchmark_audit_logs_created_at_idx" ON "benchmark_audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "organizational_benchmarks" ADD CONSTRAINT "organizational_benchmarks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "benchmark_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmark_audit_logs" ADD CONSTRAINT "benchmark_audit_logs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "benchmark_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
