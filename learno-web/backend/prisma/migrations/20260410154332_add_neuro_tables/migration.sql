-- CreateEnum
CREATE TYPE "NeuroConditionCode" AS ENUM ('ADHD', 'ASD', 'DYSLEXIA', 'DYSCALCULIA', 'ANXIETY', 'DEPRESSION', 'DEFAULT');

-- CreateEnum
CREATE TYPE "NeuroTestLifecycle" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NeuroAssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED', 'CANCELLED');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "language" TEXT;

-- CreateTable
CREATE TABLE "neuro_conditions" (
    "id" TEXT NOT NULL,
    "code" "NeuroConditionCode" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "neuro_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neuro_tests" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instruction_text" TEXT,
    "target_condition" "NeuroConditionCode" NOT NULL,
    "lifecycle" "NeuroTestLifecycle" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "config_json" JSONB,
    "question_set_json" JSONB,
    "scoring_json" JSONB,
    "estimated_min" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "neuro_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neuro_test_assignments" (
    "id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "assigned_by_teacher_id" TEXT NOT NULL,
    "class_id" TEXT,
    "status" "NeuroAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "visible_to_student" BOOLEAN NOT NULL DEFAULT true,
    "due_at" TIMESTAMP(3),
    "notes" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "neuro_test_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neuro_test_attempts" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration_sec" INTEGER,
    "answers_json" JSONB,
    "score" DOUBLE PRECISION,
    "analysis_json" JSONB,
    "inferred_condition" "NeuroConditionCode",
    "confidence" DOUBLE PRECISION,
    "reviewed_by_teacher_id" TEXT,
    "reviewer_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "neuro_test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_neuro_profiles" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "active_condition" "NeuroConditionCode" NOT NULL DEFAULT 'DEFAULT',
    "confidence" DOUBLE PRECISION,
    "source_assignment_id" TEXT,
    "source_attempt_id" TEXT,
    "source_notes" TEXT,
    "updated_by_teacher_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_neuro_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_neuro_condition_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "condition" "NeuroConditionCode" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "source_assignment_id" TEXT,
    "source_attempt_id" TEXT,
    "source_type" TEXT,
    "notes" TEXT,
    "diagnosed_by_teacher_id" TEXT,
    "diagnosed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_neuro_condition_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "neuro_conditions_code_key" ON "neuro_conditions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "neuro_tests_key_key" ON "neuro_tests"("key");

-- CreateIndex
CREATE INDEX "neuro_tests_target_condition_idx" ON "neuro_tests"("target_condition");

-- CreateIndex
CREATE INDEX "neuro_tests_lifecycle_idx" ON "neuro_tests"("lifecycle");

-- CreateIndex
CREATE INDEX "neuro_test_assignments_student_id_status_idx" ON "neuro_test_assignments"("student_id", "status");

-- CreateIndex
CREATE INDEX "neuro_test_assignments_assigned_by_teacher_id_idx" ON "neuro_test_assignments"("assigned_by_teacher_id");

-- CreateIndex
CREATE INDEX "neuro_test_assignments_class_id_idx" ON "neuro_test_assignments"("class_id");

-- CreateIndex
CREATE INDEX "neuro_test_attempts_assignment_id_idx" ON "neuro_test_attempts"("assignment_id");

-- CreateIndex
CREATE INDEX "neuro_test_attempts_student_id_created_at_idx" ON "neuro_test_attempts"("student_id", "created_at");

-- CreateIndex
CREATE INDEX "neuro_test_attempts_inferred_condition_idx" ON "neuro_test_attempts"("inferred_condition");

-- CreateIndex
CREATE UNIQUE INDEX "student_neuro_profiles_student_id_key" ON "student_neuro_profiles"("student_id");

-- CreateIndex
CREATE INDEX "student_neuro_profiles_active_condition_idx" ON "student_neuro_profiles"("active_condition");

-- CreateIndex
CREATE INDEX "student_neuro_condition_records_student_id_diagnosed_at_idx" ON "student_neuro_condition_records"("student_id", "diagnosed_at");

-- CreateIndex
CREATE INDEX "student_neuro_condition_records_condition_idx" ON "student_neuro_condition_records"("condition");

-- AddForeignKey
ALTER TABLE "neuro_tests" ADD CONSTRAINT "neuro_tests_target_condition_fkey" FOREIGN KEY ("target_condition") REFERENCES "neuro_conditions"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neuro_test_assignments" ADD CONSTRAINT "neuro_test_assignments_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "neuro_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neuro_test_assignments" ADD CONSTRAINT "neuro_test_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neuro_test_assignments" ADD CONSTRAINT "neuro_test_assignments_assigned_by_teacher_id_fkey" FOREIGN KEY ("assigned_by_teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neuro_test_assignments" ADD CONSTRAINT "neuro_test_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neuro_test_attempts" ADD CONSTRAINT "neuro_test_attempts_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "neuro_test_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neuro_test_attempts" ADD CONSTRAINT "neuro_test_attempts_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "neuro_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neuro_test_attempts" ADD CONSTRAINT "neuro_test_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "neuro_test_attempts" ADD CONSTRAINT "neuro_test_attempts_reviewed_by_teacher_id_fkey" FOREIGN KEY ("reviewed_by_teacher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_neuro_profiles" ADD CONSTRAINT "student_neuro_profiles_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_neuro_profiles" ADD CONSTRAINT "student_neuro_profiles_active_condition_fkey" FOREIGN KEY ("active_condition") REFERENCES "neuro_conditions"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_neuro_profiles" ADD CONSTRAINT "student_neuro_profiles_source_assignment_id_fkey" FOREIGN KEY ("source_assignment_id") REFERENCES "neuro_test_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_neuro_profiles" ADD CONSTRAINT "student_neuro_profiles_source_attempt_id_fkey" FOREIGN KEY ("source_attempt_id") REFERENCES "neuro_test_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_neuro_condition_records" ADD CONSTRAINT "student_neuro_condition_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_neuro_condition_records" ADD CONSTRAINT "student_neuro_condition_records_condition_fkey" FOREIGN KEY ("condition") REFERENCES "neuro_conditions"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_neuro_condition_records" ADD CONSTRAINT "student_neuro_condition_records_source_assignment_id_fkey" FOREIGN KEY ("source_assignment_id") REFERENCES "neuro_test_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_neuro_condition_records" ADD CONSTRAINT "student_neuro_condition_records_source_attempt_id_fkey" FOREIGN KEY ("source_attempt_id") REFERENCES "neuro_test_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_neuro_condition_records" ADD CONSTRAINT "student_neuro_condition_records_diagnosed_by_teacher_id_fkey" FOREIGN KEY ("diagnosed_by_teacher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
