-- AlterTable
ALTER TABLE "dataset_settings" ADD COLUMN "selected_kpis" TEXT[] DEFAULT ARRAY[]::TEXT[];
