-- CreateEnum
CREATE TYPE "DatasetStatus" AS ENUM ('PROCESSING', 'MAPPING_REQUIRED', 'CALCULATING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "EmployeeLevel" AS ENUM ('IC', 'MANAGER', 'DIRECTOR', 'VP', 'C_LEVEL');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FTE', 'CONTRACTOR', 'PART_TIME', 'INTERN');

-- CreateEnum
CREATE TYPE "RoleStatus" AS ENUM ('OPEN', 'OFFER_EXTENDED', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScenarioType" AS ENUM ('HIRING_FREEZE', 'COST_REDUCTION', 'GROWTH', 'TARGET_RATIO', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ScenarioStatus" AS ENUM ('DRAFT', 'CALCULATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InsightCategory" AS ENUM ('COST', 'STRUCTURE', 'EFFICIENCY', 'RISK');

-- CreateEnum
CREATE TYPE "InsightSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company_name" TEXT,
    "industry" TEXT,
    "company_size" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datasets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "DatasetStatus" NOT NULL DEFAULT 'PROCESSING',
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size_bytes" INTEGER,
    "file_type" TEXT NOT NULL,
    "column_mapping" JSONB,
    "company_name" TEXT,
    "total_revenue" DECIMAL(15,2),
    "fiscal_year_start" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "employee_name" TEXT,
    "email" TEXT,
    "department" TEXT NOT NULL,
    "role" TEXT,
    "level" "EmployeeLevel",
    "manager_id" TEXT,
    "cost_center" TEXT,
    "employment_type" "EmploymentType" NOT NULL DEFAULT 'FTE',
    "fte_factor" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "location" TEXT,
    "annual_salary" DECIMAL(12,2),
    "bonus" DECIMAL(12,2),
    "equity_value" DECIMAL(12,2),
    "total_compensation" DECIMAL(12,2) NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_roles" (
    "id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "level" "EmployeeLevel",
    "planned_salary_min" DECIMAL(12,2),
    "planned_salary_max" DECIMAL(12,2),
    "planned_total_comp" DECIMAL(12,2),
    "planned_start_date" TIMESTAMP(3),
    "planned_end_date" TIMESTAMP(3),
    "status" "RoleStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "open_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ScenarioType" NOT NULL,
    "parameters" JSONB NOT NULL,
    "operations" JSONB NOT NULL,
    "affected_employees" JSONB,
    "monthly_burn_rate" JSONB,
    "runway" JSONB,
    "year_end_projection" JSONB,
    "current_cash" DECIMAL(15,2),
    "status" "ScenarioStatus" NOT NULL DEFAULT 'DRAFT',
    "calculated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenario_results" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "delta" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenario_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "scenario_id" TEXT,
    "rule_id" TEXT,
    "category" "InsightCategory" NOT NULL,
    "severity" "InsightSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metrics" JSONB,
    "suggested_actions" JSONB,
    "generated_by" TEXT NOT NULL DEFAULT 'rule',
    "confidence_score" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmarks" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "company_size" TEXT NOT NULL,
    "growth_stage" TEXT,
    "region" TEXT,
    "metrics" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "sample_size" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE INDEX "users_clerk_id_idx" ON "users"("clerk_id");

-- CreateIndex
CREATE INDEX "datasets_user_id_idx" ON "datasets"("user_id");

-- CreateIndex
CREATE INDEX "datasets_status_idx" ON "datasets"("status");

-- CreateIndex
CREATE INDEX "datasets_created_at_idx" ON "datasets"("created_at" DESC);

-- CreateIndex
CREATE INDEX "employees_dataset_id_idx" ON "employees"("dataset_id");

-- CreateIndex
CREATE INDEX "employees_dataset_id_department_idx" ON "employees"("dataset_id", "department");

-- CreateIndex
CREATE INDEX "employees_manager_id_idx" ON "employees"("manager_id");

-- CreateIndex
CREATE INDEX "employees_employment_type_idx" ON "employees"("employment_type");

-- CreateIndex
CREATE INDEX "open_roles_dataset_id_idx" ON "open_roles"("dataset_id");

-- CreateIndex
CREATE INDEX "open_roles_dataset_id_department_idx" ON "open_roles"("dataset_id", "department");

-- CreateIndex
CREATE INDEX "open_roles_status_idx" ON "open_roles"("status");

-- CreateIndex
CREATE INDEX "scenarios_dataset_id_idx" ON "scenarios"("dataset_id");

-- CreateIndex
CREATE INDEX "scenarios_type_idx" ON "scenarios"("type");

-- CreateIndex
CREATE INDEX "scenarios_created_at_idx" ON "scenarios"("created_at" DESC);

-- CreateIndex
CREATE INDEX "scenario_results_scenario_id_idx" ON "scenario_results"("scenario_id");

-- CreateIndex
CREATE INDEX "insights_dataset_id_idx" ON "insights"("dataset_id");

-- CreateIndex
CREATE INDEX "insights_scenario_id_idx" ON "insights"("scenario_id");

-- CreateIndex
CREATE INDEX "insights_severity_idx" ON "insights"("severity");

-- CreateIndex
CREATE INDEX "insights_category_idx" ON "insights"("category");

-- CreateIndex
CREATE INDEX "benchmarks_industry_company_size_idx" ON "benchmarks"("industry", "company_size");

-- CreateIndex
CREATE INDEX "benchmarks_active_idx" ON "benchmarks"("active");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_roles" ADD CONSTRAINT "open_roles_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenario_results" ADD CONSTRAINT "scenario_results_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
