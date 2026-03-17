-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- AlterTable
ALTER TABLE "account" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "session" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "is_onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "setup_steps" JSONB,
ADD COLUMN     "time_zone" TEXT NOT NULL DEFAULT 'America/New_York',
ADD COLUMN     "trial_end_date" TIMESTAMP(3),
ADD COLUMN     "trial_start_date" TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "verification_token" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_token" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_token" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "two_factor_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_confirmation" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "two_factor_confirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding" (
    "id" TEXT NOT NULL,
    "organization_name" TEXT NOT NULL,
    "organization_size" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "discovery_channel" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_product_id" TEXT,
    "stripe_subscription_id" TEXT,
    "plan_name" TEXT,
    "amount" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "next_usage_reset" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,
    "credit_balance" INTEGER NOT NULL DEFAULT 0,
    "purchased_credits" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "stripe_subscription_schedule_id" TEXT,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_token_key" ON "verification_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_email_token_key" ON "verification_token"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_token_key" ON "password_reset_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_email_token_key" ON "password_reset_token"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_token_token_key" ON "two_factor_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_token_email_token_key" ON "two_factor_token"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_confirmation_user_id_key" ON "two_factor_confirmation"("user_id");

-- CreateIndex
CREATE INDEX "organization_owner_id_idx" ON "organization"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_user_id_key" ON "onboarding"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripe_customer_id_key" ON "subscription"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_user_id_key" ON "subscription"("user_id");

-- AddForeignKey
ALTER TABLE "two_factor_confirmation" ADD CONSTRAINT "two_factor_confirmation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization" ADD CONSTRAINT "organization_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
