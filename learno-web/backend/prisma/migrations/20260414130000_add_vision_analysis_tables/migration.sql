-- CreateTable
CREATE TABLE "session_vision_analyses" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "vision_json_path" TEXT,
    "annotated_video_path" TEXT,
    "smart_option" TEXT,
    "class_engagement_avg" DOUBLE PRECISION,
    "class_engagement_min" DOUBLE PRECISION,
    "class_engagement_max" DOUBLE PRECISION,
    "class_student_count" INTEGER,
    "low_engagement_count" INTEGER,
    "total_frames_analyzed" INTEGER,
    "summary" JSONB,
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_vision_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_vision_students" (
    "id" TEXT NOT NULL,
    "vision_analysis_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "student_id" TEXT,
    "seat_number" INTEGER,
    "detected_student_id" TEXT,
    "mean_caes" DOUBLE PRECISION,
    "min_caes" DOUBLE PRECISION,
    "max_caes" DOUBLE PRECISION,
    "frames_analyzed" INTEGER,
    "trend" TEXT,
    "low_engagement" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_vision_students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_vision_analyses_session_id_key" ON "session_vision_analyses"("session_id");

-- CreateIndex
CREATE INDEX "session_vision_analyses_created_at_idx" ON "session_vision_analyses"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "session_vision_students_vision_analysis_id_detected_student_id_key" ON "session_vision_students"("vision_analysis_id", "detected_student_id");

-- CreateIndex
CREATE INDEX "session_vision_students_session_id_idx" ON "session_vision_students"("session_id");

-- CreateIndex
CREATE INDEX "session_vision_students_student_id_idx" ON "session_vision_students"("student_id");

-- CreateIndex
CREATE INDEX "session_vision_students_seat_number_idx" ON "session_vision_students"("seat_number");

-- AddForeignKey
ALTER TABLE "session_vision_analyses" ADD CONSTRAINT "session_vision_analyses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_vision_students" ADD CONSTRAINT "session_vision_students_vision_analysis_id_fkey" FOREIGN KEY ("vision_analysis_id") REFERENCES "session_vision_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_vision_students" ADD CONSTRAINT "session_vision_students_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_vision_students" ADD CONSTRAINT "session_vision_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
