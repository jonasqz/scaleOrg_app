-- CreateTable
CREATE TABLE "dataset_settings" (
    "id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "rd_departments" TEXT[] DEFAULT ARRAY['Engineering', 'Product', 'Design']::TEXT[],
    "gtm_departments" TEXT[] DEFAULT ARRAY['Sales', 'Marketing', 'Customer Success']::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dataset_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dataset_settings_dataset_id_key" ON "dataset_settings"("dataset_id");

-- CreateIndex
CREATE INDEX "dataset_settings_dataset_id_idx" ON "dataset_settings"("dataset_id");

-- AddForeignKey
ALTER TABLE "dataset_settings" ADD CONSTRAINT "dataset_settings_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
