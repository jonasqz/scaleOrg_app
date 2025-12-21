-- AlterTable
ALTER TABLE "datasets" ADD COLUMN "organization_id" TEXT;

-- CreateIndex
CREATE INDEX "datasets_organization_id_idx" ON "datasets"("organization_id");
