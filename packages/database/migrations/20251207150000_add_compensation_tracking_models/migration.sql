-- AlterTable: Add currentCashBalance to datasets
ALTER TABLE "datasets" ADD COLUMN "current_cash_balance" DECIMAL(15,2);

-- CreateTable: Monthly Planned Compensation
CREATE TABLE "monthly_planned_compensation" (
    "id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "period_label" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "planned_gross_salary" DECIMAL(12,2) NOT NULL,
    "planned_gross_bonus" DECIMAL(12,2),
    "planned_gross_equity" DECIMAL(12,2),
    "planned_gross_total" DECIMAL(12,2) NOT NULL,
    "planned_employer_taxes" DECIMAL(12,2),
    "planned_social_contributions" DECIMAL(12,2),
    "planned_health_insurance" DECIMAL(12,2),
    "planned_benefits" DECIMAL(12,2),
    "planned_other_employer_costs" DECIMAL(12,2),
    "planned_total_employer_cost" DECIMAL(12,2) NOT NULL,
    "is_manual_override" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_planned_compensation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Monthly Revenue
CREATE TABLE "monthly_revenue" (
    "id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "period_label" TEXT NOT NULL,
    "revenue" DECIMAL(15,2) NOT NULL,
    "source" "CostDataSource" NOT NULL DEFAULT 'MANUAL',
    "imported_from" TEXT,
    "notes" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_revenue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monthly_planned_compensation_dataset_id_period_idx" ON "monthly_planned_compensation"("dataset_id", "period");

-- CreateIndex
CREATE INDEX "monthly_planned_compensation_employee_id_idx" ON "monthly_planned_compensation"("employee_id");

-- CreateIndex
CREATE INDEX "monthly_planned_compensation_is_manual_override_idx" ON "monthly_planned_compensation"("is_manual_override");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_planned_compensation_dataset_id_period_employee_id_key" ON "monthly_planned_compensation"("dataset_id", "period", "employee_id");

-- CreateIndex
CREATE INDEX "monthly_revenue_dataset_id_period_idx" ON "monthly_revenue"("dataset_id", "period");

-- CreateIndex
CREATE INDEX "monthly_revenue_source_idx" ON "monthly_revenue"("source");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_revenue_dataset_id_period_key" ON "monthly_revenue"("dataset_id", "period");

-- AddForeignKey
ALTER TABLE "monthly_planned_compensation" ADD CONSTRAINT "monthly_planned_compensation_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_planned_compensation" ADD CONSTRAINT "monthly_planned_compensation_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_revenue" ADD CONSTRAINT "monthly_revenue_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
