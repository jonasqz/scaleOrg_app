-- CreateTable
CREATE TABLE "role_title_library" (
    "id" TEXT NOT NULL,
    "original_title" TEXT NOT NULL,
    "standardized_title" TEXT NOT NULL,
    "seniority_level" TEXT,
    "role_family" TEXT,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "first_seen_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_date" TIMESTAMP(3) NOT NULL,
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "companySizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verified_by_users" INTEGER NOT NULL DEFAULT 0,
    "reported_issues" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_title_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compensation_benchmarks" (
    "id" TEXT NOT NULL,
    "role_family" TEXT NOT NULL,
    "standardized_title" TEXT NOT NULL,
    "seniority_level" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "company_size" TEXT NOT NULL,
    "p10_total_comp" DECIMAL(12,2),
    "p25_total_comp" DECIMAL(12,2),
    "p50_total_comp" DECIMAL(12,2),
    "p75_total_comp" DECIMAL(12,2),
    "p90_total_comp" DECIMAL(12,2),
    "p10_base_salary" DECIMAL(12,2),
    "p25_base_salary" DECIMAL(12,2),
    "p50_base_salary" DECIMAL(12,2),
    "p75_base_salary" DECIMAL(12,2),
    "p90_base_salary" DECIMAL(12,2),
    "sampleSize" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "data_source" TEXT NOT NULL DEFAULT 'customer_crowdsourced',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compensation_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_taxonomy" (
    "id" TEXT NOT NULL,
    "role_family" TEXT NOT NULL,
    "role_title" TEXT NOT NULL,
    "seniority_level" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_taxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_title_library_original_title_key" ON "role_title_library"("original_title");

-- CreateIndex
CREATE INDEX "role_title_library_standardized_title_seniority_level_idx" ON "role_title_library"("standardized_title", "seniority_level");

-- CreateIndex
CREATE INDEX "role_title_library_role_family_idx" ON "role_title_library"("role_family");

-- CreateIndex
CREATE INDEX "role_title_library_frequency_idx" ON "role_title_library"("frequency" DESC);

-- CreateIndex
CREATE INDEX "compensation_benchmarks_role_family_seniority_level_idx" ON "compensation_benchmarks"("role_family", "seniority_level");

-- CreateIndex
CREATE INDEX "compensation_benchmarks_industry_region_idx" ON "compensation_benchmarks"("industry", "region");

-- CreateIndex
CREATE UNIQUE INDEX "compensation_benchmarks_role_family_standardized_title_seni_key" ON "compensation_benchmarks"("role_family", "standardized_title", "seniority_level", "industry", "region", "company_size");

-- CreateIndex
CREATE INDEX "role_taxonomy_role_family_idx" ON "role_taxonomy"("role_family");

-- CreateIndex
CREATE UNIQUE INDEX "role_taxonomy_role_family_role_title_seniority_level_key" ON "role_taxonomy"("role_family", "role_title", "seniority_level");
