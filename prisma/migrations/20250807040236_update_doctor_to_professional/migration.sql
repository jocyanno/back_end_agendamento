/*
  Warnings:

  - The values [doctor] on the enum `OrganizationRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `doctorId` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `doctorId` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `doctorId` on the `availabilities` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[professionalId,organizationId,dayOfWeek,startTime]` on the table `availabilities` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `professionalId` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `professionalId` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `professionalId` to the `availabilities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrganizationRole_new" AS ENUM ('owner', 'admin', 'member', 'professional', 'patient', 'attendant');
ALTER TABLE "user_organizations" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user_organizations" ALTER COLUMN "role" TYPE "OrganizationRole_new" USING ("role"::text::"OrganizationRole_new");
ALTER TYPE "OrganizationRole" RENAME TO "OrganizationRole_old";
ALTER TYPE "OrganizationRole_new" RENAME TO "OrganizationRole";
DROP TYPE "OrganizationRole_old";
ALTER TABLE "user_organizations" ALTER COLUMN "role" SET DEFAULT 'member';
COMMIT;

-- Add new columns first
ALTER TABLE "appointments" ADD COLUMN "professionalId" TEXT;
ALTER TABLE "attendances" ADD COLUMN "professionalId" TEXT;
ALTER TABLE "availabilities" ADD COLUMN "professionalId" TEXT;

-- Copy data from old columns to new columns
UPDATE "appointments" SET "professionalId" = "doctorId";
UPDATE "attendances" SET "professionalId" = "doctorId";
UPDATE "availabilities" SET "professionalId" = "doctorId";

-- Make new columns NOT NULL
ALTER TABLE "appointments" ALTER COLUMN "professionalId" SET NOT NULL;
ALTER TABLE "attendances" ALTER COLUMN "professionalId" SET NOT NULL;
ALTER TABLE "availabilities" ALTER COLUMN "professionalId" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "availabilities" DROP CONSTRAINT "availabilities_doctorId_fkey";

-- DropIndex
DROP INDEX "appointments_doctorId_idx";

-- DropIndex
DROP INDEX "attendances_doctorId_idx";

-- DropIndex
DROP INDEX "availabilities_doctorId_idx";

-- DropIndex
DROP INDEX "availabilities_doctorId_organizationId_dayOfWeek_startTime_key";

-- Drop old columns
ALTER TABLE "appointments" DROP COLUMN "doctorId";
ALTER TABLE "attendances" DROP COLUMN "doctorId";
ALTER TABLE "availabilities" DROP COLUMN "doctorId";

-- Add additional columns
ALTER TABLE "appointments" ADD COLUMN "usersId" TEXT;
ALTER TABLE "attendances" ADD COLUMN "usersId" TEXT;

-- CreateIndex
CREATE INDEX "appointments_professionalId_idx" ON "appointments"("professionalId");

-- CreateIndex
CREATE INDEX "attendances_professionalId_idx" ON "attendances"("professionalId");

-- CreateIndex
CREATE INDEX "availabilities_professionalId_idx" ON "availabilities"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "availabilities_professionalId_organizationId_dayOfWeek_startTime_key" ON "availabilities"("professionalId", "organizationId", "dayOfWeek", "startTime");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
