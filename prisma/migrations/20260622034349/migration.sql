/*
  Warnings:

  - You are about to drop the column `closedAt` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `entry` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `exit` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Trade` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "closedAt",
DROP COLUMN "entry",
DROP COLUMN "exit",
DROP COLUMN "notes",
DROP COLUMN "quantity";
