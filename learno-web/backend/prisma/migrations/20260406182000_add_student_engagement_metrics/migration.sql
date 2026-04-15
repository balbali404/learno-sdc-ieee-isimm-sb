-- Add engagement metrics to chapter progress
ALTER TABLE "student_chapter_progress"
ADD COLUMN "engagement_score" INTEGER,
ADD COLUMN "concentration_score" INTEGER;

-- Add aggregated engagement metrics to student XP
ALTER TABLE "student_xp"
ADD COLUMN "average_engagement" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "average_concentration" INTEGER NOT NULL DEFAULT 0;
