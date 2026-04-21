-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "estimatedMinutes" INTEGER,
ADD COLUMN     "graceDaysAvailable" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "graceWeekStart" TEXT,
ADD COLUMN     "lastCompletedDate" TEXT,
ADD COLUMN     "phase" TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN     "rootedAt" TIMESTAMP(3),
ADD COLUMN     "rootedStreak" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProjectSubtask" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectSubtask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectSubtask_taskId_idx" ON "ProjectSubtask"("taskId");

-- AddForeignKey
ALTER TABLE "ProjectSubtask" ADD CONSTRAINT "ProjectSubtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ProjectTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
