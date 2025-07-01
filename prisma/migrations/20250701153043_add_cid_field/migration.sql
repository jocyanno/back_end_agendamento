/*
  Warnings:

  - You are about to drop the column `googleMeetLink` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `reminderSent` on the `appointments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "googleMeetLink",
DROP COLUMN "reminderSent";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "cid" TEXT;
