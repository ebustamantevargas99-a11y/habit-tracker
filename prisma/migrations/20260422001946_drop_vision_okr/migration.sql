-- DropForeignKey
ALTER TABLE "OKRKeyResult" DROP CONSTRAINT "OKRKeyResult_objectiveId_fkey";
-- DropForeignKey
ALTER TABLE "OKRObjective" DROP CONSTRAINT "OKRObjective_userId_fkey";
-- DropForeignKey
ALTER TABLE "ProjectionConfig" DROP CONSTRAINT "ProjectionConfig_userId_fkey";
-- DropForeignKey
ALTER TABLE "ProjectionMilestone" DROP CONSTRAINT "ProjectionMilestone_projectionConfigId_fkey";
-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "visionBoard";
-- DropTable
DROP TABLE "OKRKeyResult";
-- DropTable
DROP TABLE "OKRObjective";
-- DropTable
DROP TABLE "ProjectionConfig";
-- DropTable
DROP TABLE "ProjectionMilestone";
