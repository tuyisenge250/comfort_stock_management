/*
  Warnings:

  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Product_name_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "name";
