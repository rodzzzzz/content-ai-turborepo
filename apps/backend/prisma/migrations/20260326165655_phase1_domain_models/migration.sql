-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'PROCESSING', 'FAILED', 'SUCCESS');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('TWITTER', 'LINKEDIN', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "integration" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "account_name" TEXT,
    "account_type" TEXT,
    "page_id" TEXT,
    "page_name" TEXT,
    "page_access_token" TEXT,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "profile_picture" TEXT,
    "username" TEXT,

    CONSTRAINT "integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "upload_status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "folder_id" TEXT,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "platform" "Platform" NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "media_url" TEXT[],
    "integration_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "post_id" TEXT,

    CONSTRAINT "schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "vector_ids" TEXT[],
    "table_data" JSONB,
    "table_schema" JSONB,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facebook_analytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "follower_count" INTEGER NOT NULL,
    "follower_growth" INTEGER NOT NULL,
    "reactions" JSONB,
    "total_engagements" INTEGER NOT NULL,
    "engagement_rate" DOUBLE PRECISION NOT NULL,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "integration_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "facebook_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twitter_analytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "follower_count" INTEGER NOT NULL,
    "follower_growth" INTEGER NOT NULL,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "retweets" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "total_engagements" INTEGER NOT NULL,
    "engagement_rate" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "integration_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "twitter_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linkedin_analytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "follower_count" INTEGER NOT NULL,
    "follower_growth" INTEGER NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "total_engagements" INTEGER NOT NULL,
    "engagement_rate" DOUBLE PRECISION NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "integration_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "linkedin_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "platforms" "Platform"[],
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "initial_message" JSONB,
    "campaign" JSONB,
    "diff_registry" JSONB[],

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_message" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "parts" JSONB,
    "attachments" JSONB,
    "campaign_id" TEXT NOT NULL,

    CONSTRAINT "campaign_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_chat" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "image_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_chat_message" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "parts" JSONB,
    "attachments" JSONB,
    "image_chat_id" TEXT NOT NULL,

    CONSTRAINT "image_chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personality" (
    "id" TEXT NOT NULL,
    "vector_ids" TEXT[],
    "faq_vector_ids" TEXT[],
    "personality" TEXT,
    "writing_style" TEXT,
    "additional_instructions" TEXT,
    "interests" JSONB,
    "emoji" BOOLEAN NOT NULL DEFAULT false,
    "temperature" INTEGER NOT NULL DEFAULT 30,
    "twitter" TEXT,
    "linkedin" TEXT,
    "facebook" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "personality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_usage" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "subscription_id" TEXT NOT NULL,
    "cost_in_dollars" INTEGER NOT NULL,

    CONSTRAINT "subscription_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_pricing" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "model" TEXT,
    "usageType" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unitAmount" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_kit" (
    "id" TEXT NOT NULL,
    "primary_color" TEXT,
    "additional_colors" JSONB,
    "font" TEXT,
    "logo" TEXT,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "brand_kit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_provider_provider_account_id_key" ON "integration"("provider", "provider_account_id");

-- CreateIndex
CREATE INDEX "file_user_id_idx" ON "file"("user_id");

-- CreateIndex
CREATE INDEX "folder_user_id_idx" ON "folder"("user_id");

-- CreateIndex
CREATE INDEX "schedule_integration_id_user_id_idx" ON "schedule"("integration_id", "user_id");

-- CreateIndex
CREATE INDEX "knowledge_base_user_id_idx" ON "knowledge_base"("user_id");

-- CreateIndex
CREATE INDEX "facebook_analytics_integration_id_user_id_date_idx" ON "facebook_analytics"("integration_id", "user_id", "date");

-- CreateIndex
CREATE INDEX "facebook_analytics_date_idx" ON "facebook_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "facebook_analytics_date_integration_id_key" ON "facebook_analytics"("date", "integration_id");

-- CreateIndex
CREATE INDEX "twitter_analytics_integration_id_user_id_date_idx" ON "twitter_analytics"("integration_id", "user_id", "date");

-- CreateIndex
CREATE INDEX "twitter_analytics_date_idx" ON "twitter_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "twitter_analytics_date_integration_id_key" ON "twitter_analytics"("date", "integration_id");

-- CreateIndex
CREATE INDEX "linkedin_analytics_integration_id_user_id_date_idx" ON "linkedin_analytics"("integration_id", "user_id", "date");

-- CreateIndex
CREATE INDEX "linkedin_analytics_date_idx" ON "linkedin_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "linkedin_analytics_date_integration_id_key" ON "linkedin_analytics"("date", "integration_id");

-- CreateIndex
CREATE INDEX "campaign_user_id_idx" ON "campaign"("user_id");

-- CreateIndex
CREATE INDEX "campaign_message_campaign_id_idx" ON "campaign_message"("campaign_id");

-- CreateIndex
CREATE INDEX "image_chat_user_id_idx" ON "image_chat"("user_id");

-- CreateIndex
CREATE INDEX "image_chat_message_image_chat_id_idx" ON "image_chat_message"("image_chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "personality_user_id_key" ON "personality"("user_id");

-- CreateIndex
CREATE INDEX "subscription_usage_subscription_id_feature_idx" ON "subscription_usage"("subscription_id", "feature");

-- CreateIndex
CREATE INDEX "subscription_usage_timestamp_idx" ON "subscription_usage"("timestamp");

-- CreateIndex
CREATE INDEX "ai_pricing_feature_usageType_model_idx" ON "ai_pricing"("feature", "usageType", "model");

-- CreateIndex
CREATE UNIQUE INDEX "ai_pricing_feature_usageType_model_unit_key" ON "ai_pricing"("feature", "usageType", "model", "unit");

-- CreateIndex
CREATE UNIQUE INDEX "brand_kit_organization_id_key" ON "brand_kit"("organization_id");

-- CreateIndex
CREATE INDEX "brand_kit_organization_id_idx" ON "brand_kit"("organization_id");

-- AddForeignKey
ALTER TABLE "integration" ADD CONSTRAINT "integration_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration" ADD CONSTRAINT "integration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facebook_analytics" ADD CONSTRAINT "facebook_analytics_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facebook_analytics" ADD CONSTRAINT "facebook_analytics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facebook_analytics" ADD CONSTRAINT "facebook_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twitter_analytics" ADD CONSTRAINT "twitter_analytics_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twitter_analytics" ADD CONSTRAINT "twitter_analytics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twitter_analytics" ADD CONSTRAINT "twitter_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_analytics" ADD CONSTRAINT "linkedin_analytics_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_analytics" ADD CONSTRAINT "linkedin_analytics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_analytics" ADD CONSTRAINT "linkedin_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_message" ADD CONSTRAINT "campaign_message_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_chat" ADD CONSTRAINT "image_chat_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_chat" ADD CONSTRAINT "image_chat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_chat_message" ADD CONSTRAINT "image_chat_message_image_chat_id_fkey" FOREIGN KEY ("image_chat_id") REFERENCES "image_chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personality" ADD CONSTRAINT "personality_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personality" ADD CONSTRAINT "personality_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_usage" ADD CONSTRAINT "subscription_usage_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_kit" ADD CONSTRAINT "brand_kit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_kit" ADD CONSTRAINT "brand_kit_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
