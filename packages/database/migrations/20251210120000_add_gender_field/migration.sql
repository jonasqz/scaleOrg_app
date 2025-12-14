-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'DIVERSE', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN "gender" "Gender";
