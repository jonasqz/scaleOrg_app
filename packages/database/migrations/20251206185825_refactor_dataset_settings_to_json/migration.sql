/*
  Warnings:

  - You are about to drop the column `gtm_departments` on the `dataset_settings` table. All the data in the column will be lost.
  - You are about to drop the column `rd_departments` on the `dataset_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dataset_settings" DROP COLUMN "gtm_departments",
DROP COLUMN "rd_departments",
ADD COLUMN     "department_categories" JSONB;
