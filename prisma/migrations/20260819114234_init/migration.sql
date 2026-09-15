-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "contacts_db";

-- CreateEnum
CREATE TYPE "contacts_db"."ContactStatus" AS ENUM ('NEW', 'READ', 'IN_PROGRESS', 'RESOLVED', 'SPAM');

-- CreateTable
CREATE TABLE "contacts_db"."ContactMessage" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "contacts_db"."ContactStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactMessage_applicationId_idx" ON "contacts_db"."ContactMessage"("applicationId");

-- CreateIndex
CREATE INDEX "ContactMessage_applicationId_status_idx" ON "contacts_db"."ContactMessage"("applicationId", "status");

-- CreateIndex
CREATE INDEX "ContactMessage_email_idx" ON "contacts_db"."ContactMessage"("email");

-- CreateIndex
CREATE INDEX "ContactMessage_createdAt_idx" ON "contacts_db"."ContactMessage"("createdAt");
