-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "groupId" TEXT;

-- CreateTable
CREATE TABLE "CalendarGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#b8860b',
    "icon" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarGroup_userId_idx" ON "CalendarGroup"("userId");

-- CreateIndex
CREATE INDEX "CalendarEvent_groupId_idx" ON "CalendarEvent"("groupId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CalendarGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarGroup" ADD CONSTRAINT "CalendarGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
