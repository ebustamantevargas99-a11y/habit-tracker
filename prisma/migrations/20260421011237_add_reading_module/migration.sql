-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "totalPages" INTEGER,
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'reading',
    "rating" INTEGER,
    "coverUrl" TEXT,
    "genre" TEXT,
    "notes" TEXT,
    "startedAt" TEXT,
    "finishedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "pagesRead" INTEGER NOT NULL DEFAULT 0,
    "minutes" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Book_userId_status_idx" ON "Book"("userId", "status");

-- CreateIndex
CREATE INDEX "ReadingSession_userId_date_idx" ON "ReadingSession"("userId", "date");

-- CreateIndex
CREATE INDEX "ReadingSession_bookId_date_idx" ON "ReadingSession"("bookId", "date");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
