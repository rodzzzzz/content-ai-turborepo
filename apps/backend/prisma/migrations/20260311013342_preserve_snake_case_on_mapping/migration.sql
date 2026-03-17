-- AlterTable
ALTER TABLE "user" ADD COLUMN     "password" TEXT,
ADD COLUMN     "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "two_factor" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "secret" TEXT,
    "backup_codes" TEXT,

    CONSTRAINT "two_factor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_user_id_key" ON "two_factor"("user_id");

-- AddForeignKey
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
