/*
  Warnings:

  - You are about to drop the column `cid` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "cid";

-- CreateTable
CREATE TABLE "patient_cids" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_cids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_cids_patientId_idx" ON "patient_cids"("patientId");

-- CreateIndex
CREATE INDEX "patient_cids_professionalId_idx" ON "patient_cids"("professionalId");

-- CreateIndex
CREATE INDEX "patient_cids_organizationId_idx" ON "patient_cids"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_cids_patientId_professionalId_organizationId_key" ON "patient_cids"("patientId", "professionalId", "organizationId");

-- AddForeignKey
ALTER TABLE "patient_cids" ADD CONSTRAINT "patient_cids_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_cids" ADD CONSTRAINT "patient_cids_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_cids" ADD CONSTRAINT "patient_cids_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
