/*
  Warnings:

  - You are about to drop the column `registeredBy` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[doctorId,organizationId,dayOfWeek,startTime]` on the table `availabilities` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `availabilities` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('owner', 'admin', 'member', 'doctor', 'patient', 'attendant');

-- DropIndex
DROP INDEX "availabilities_doctorId_dayOfWeek_startTime_key";

-- DropIndex
DROP INDEX "users_phone_key";

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "availabilities" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "registeredBy";

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cnpj" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_organizations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'member',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_cnpj_key" ON "organizations"("cnpj");

-- CreateIndex
CREATE INDEX "user_organizations_userId_idx" ON "user_organizations"("userId");

-- CreateIndex
CREATE INDEX "user_organizations_organizationId_idx" ON "user_organizations"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "user_organizations_userId_organizationId_key" ON "user_organizations"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "appointments_organizationId_idx" ON "appointments"("organizationId");

-- CreateIndex
CREATE INDEX "attendances_organizationId_idx" ON "attendances"("organizationId");

-- CreateIndex
CREATE INDEX "availabilities_organizationId_idx" ON "availabilities"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "availabilities_doctorId_organizationId_dayOfWeek_startTime_key" ON "availabilities"("doctorId", "organizationId", "dayOfWeek", "startTime");

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
