-- CreateEnum
CREATE TYPE "CompensationScenarioStatus" AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');

-- CreateTable: CompensationScenario
CREATE TABLE "compensation_scenarios" (
    "id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_baseline" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" "CompensationScenarioStatus" NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compensation_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EmployeeCompensationTarget
CREATE TABLE "employee_compensation_targets" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "scenario_id" TEXT,
    "target_annual_comp" DECIMAL(12,2) NOT NULL,
    "calculation_method" TEXT NOT NULL,
    "benchmark_source" TEXT,
    "is_manual_override" BOOLEAN NOT NULL DEFAULT false,
    "override_reason" TEXT,
    "explanation" JSONB,
    "target_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_compensation_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compensation_scenarios_dataset_id_idx" ON "compensation_scenarios"("dataset_id");
CREATE INDEX "compensation_scenarios_is_baseline_idx" ON "compensation_scenarios"("is_baseline");
CREATE INDEX "compensation_scenarios_status_idx" ON "compensation_scenarios"("status");

-- CreateIndex
CREATE INDEX "employee_compensation_targets_employee_id_idx" ON "employee_compensation_targets"("employee_id");
CREATE INDEX "employee_compensation_targets_scenario_id_idx" ON "employee_compensation_targets"("scenario_id");
CREATE INDEX "employee_compensation_targets_calculation_method_idx" ON "employee_compensation_targets"("calculation_method");

-- CreateIndex: Unique constraint for employee-scenario combination
CREATE UNIQUE INDEX "employee_compensation_targets_employee_id_scenario_id_key" ON "employee_compensation_targets"("employee_id", "scenario_id");

-- AddForeignKey
ALTER TABLE "compensation_scenarios" ADD CONSTRAINT "compensation_scenarios_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_compensation_targets" ADD CONSTRAINT "employee_compensation_targets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_compensation_targets" ADD CONSTRAINT "employee_compensation_targets_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "compensation_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
