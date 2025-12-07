-- CreateEnum
CREATE TYPE "CostDataSource" AS ENUM ('MANUAL', 'CSV_IMPORT', 'API_IMPORT', 'CALCULATED');

-- CreateTable
CREATE TABLE "monthly_employer_costs" (
    "id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "period_label" TEXT NOT NULL,
    "employee_id" TEXT,
    "department" TEXT,
    "gross_salary" DECIMAL(12,2) NOT NULL,
    "gross_bonus" DECIMAL(12,2),
    "gross_equity" DECIMAL(12,2),
    "gross_total" DECIMAL(12,2) NOT NULL,
    "employer_taxes" DECIMAL(12,2),
    "social_contributions" DECIMAL(12,2),
    "health_insurance" DECIMAL(12,2),
    "benefits" DECIMAL(12,2),
    "other_employer_costs" DECIMAL(12,2),
    "total_employer_cost" DECIMAL(12,2) NOT NULL,
    "employer_cost_ratio" DECIMAL(5,2),
    "source" "CostDataSource" NOT NULL DEFAULT 'MANUAL',
    "imported_from" TEXT,
    "notes" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_employer_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monthly_employer_costs_dataset_id_period_idx" ON "monthly_employer_costs"("dataset_id", "period");

-- CreateIndex
CREATE INDEX "monthly_employer_costs_dataset_id_period_department_idx" ON "monthly_employer_costs"("dataset_id", "period", "department");

-- CreateIndex
CREATE INDEX "monthly_employer_costs_employee_id_idx" ON "monthly_employer_costs"("employee_id");

-- CreateIndex
CREATE INDEX "monthly_employer_costs_source_idx" ON "monthly_employer_costs"("source");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_employer_costs_dataset_id_period_employee_id_key" ON "monthly_employer_costs"("dataset_id", "period", "employee_id");

-- AddForeignKey
ALTER TABLE "monthly_employer_costs" ADD CONSTRAINT "monthly_employer_costs_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_employer_costs" ADD CONSTRAINT "monthly_employer_costs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
