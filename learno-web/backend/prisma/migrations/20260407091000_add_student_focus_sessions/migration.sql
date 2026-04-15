CREATE TABLE "student_focus_sessions" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "challenge_key" TEXT NOT NULL,
  "source" TEXT DEFAULT 'FOCUS_MODE',
  "subject" TEXT,
  "xp_earned" INTEGER NOT NULL DEFAULT 0,
  "duration_sec" INTEGER NOT NULL DEFAULT 0,
  "engagement_score" INTEGER NOT NULL DEFAULT 0,
  "concentration_score" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "student_focus_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_focus_sessions_student_id_challenge_key_key"
ON "student_focus_sessions"("student_id", "challenge_key");

CREATE INDEX "student_focus_sessions_student_id_idx"
ON "student_focus_sessions"("student_id");

ALTER TABLE "student_focus_sessions"
ADD CONSTRAINT "student_focus_sessions_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
