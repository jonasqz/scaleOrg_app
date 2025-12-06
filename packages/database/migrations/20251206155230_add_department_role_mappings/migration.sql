-- CreateTable
CREATE TABLE "department_mappings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "original_name" TEXT NOT NULL,
    "standardized_name" TEXT NOT NULL,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_mappings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "original_title" TEXT NOT NULL,
    "standardized_title" TEXT NOT NULL,
    "seniority_level" TEXT,
    "role_family" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "confidence_score" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "department_mappings_standardized_name_idx" ON "department_mappings"("standardized_name");

-- CreateIndex
CREATE INDEX "department_mappings_category_idx" ON "department_mappings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "department_mappings_user_id_original_name_key" ON "department_mappings"("user_id", "original_name");

-- CreateIndex
CREATE INDEX "role_mappings_standardized_title_seniority_level_idx" ON "role_mappings"("standardized_title", "seniority_level");

-- CreateIndex
CREATE INDEX "role_mappings_role_family_idx" ON "role_mappings"("role_family");

-- CreateIndex
CREATE UNIQUE INDEX "role_mappings_user_id_original_title_key" ON "role_mappings"("user_id", "original_title");
