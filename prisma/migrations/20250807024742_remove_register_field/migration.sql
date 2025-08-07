/*
  Warnings:

  - You are about to drop the column `register` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "register";

-- DropEnum
DROP TYPE "Register";
