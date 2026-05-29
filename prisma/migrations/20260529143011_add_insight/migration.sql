-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Insight_taskId_key" ON "Insight"("taskId");

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
