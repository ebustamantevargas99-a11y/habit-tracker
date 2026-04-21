-- CreateTable
CREATE TABLE "LifeScoreSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LifeScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LifeScoreSnapshot_userId_date_idx" ON "LifeScoreSnapshot"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "LifeScoreSnapshot_userId_date_key" ON "LifeScoreSnapshot"("userId", "date");

-- AddForeignKey
ALTER TABLE "LifeScoreSnapshot" ADD CONSTRAINT "LifeScoreSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
