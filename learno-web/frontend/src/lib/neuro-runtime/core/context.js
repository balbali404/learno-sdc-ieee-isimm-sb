import { DEFAULT_STUDENT_ID } from "./constants.js";

export const mockStudent = {
  id: DEFAULT_STUDENT_ID,
  name: "Amina K.",
  age: 14,
  year_group: "Year 9",
};

export const mockLessonContext = {
  session_context_id: "session-bio-ecosystems-01",
  lesson_id: "lesson-bio-ecosystems-01",
  subject: "Biology",
  subject_localized: {
    en: "Biology",
    fr: "Biologie",
    ar: "علم الأحياء",
  },
  teacher_name: "Ms. Hela Rahal",
  approved_summary:
    "Today\u2019s lesson compared food chains, habitats, and environmental change. Students reviewed cause-and-effect language and short data patterns.",
  approved_summary_localized: {
    en: "Today\u2019s lesson compared food chains, habitats, and environmental change. Students reviewed cause-and-effect language and short data patterns.",
    fr: "La le\u00e7on d\u2019aujourd\u2019hui comparait les cha\u00eenes alimentaires, les habitats et les changements environnementaux. Les \u00e9l\u00e8ves ont revu le langage de cause \u00e0 effet et les patterns de donn\u00e9es courtes.",
    ar: "\u0642\u0627\u0631\u0646\u062a \u062f\u0631\u0633 \u0627\u0644\u064a\u0648\u0645 \u0628\u064a\u0646 \u0633\u0644\u0627\u0633\u0644 \u0627\u0644\u063a\u0630\u0627\u0621 \u0648\u0627\u0644\u0645\u0648\u0627\u0626\u0644 \u0648\u0627\u0644\u062a\u063a\u064a\u0631 \u0627\u0644\u0628\u064a\u0626\u064a. \u0631\u0627\u062c\u0639 \u0627\u0644\u0637\u0644\u0627\u0628 \u0644\u063a\u0629 \u0627\u0644\u0633\u0628\u0628 \u0648\u0627\u0644\u0646\u062a\u064a\u062c\u0629 \u0648\u0623\u0646\u0645\u0627\u0637 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0642\u0635\u064a\u0631\u0629.",
  },
  follow_up_status: "approved",
  classroom_environment: {
    noise_db: 49,
    light_lux: 380,
    co2_ppm: 915,
  },
  classroom_analytics: {
    attention: 46,
    reading: 24,
    math: 22,
    sensory: 58,
    engagement: 41,
  },
  teacher_observation: {
    attention: 28,
    reading: 20,
    math: 18,
    sensory: 24,
    engagement: 35,
  },
  engagement_trend: 44,
  follow_up_completion_rate: 0.78,
};

export function getContextBundle(domain, lessonContext = mockLessonContext) {
  return {
    session_context_id: lessonContext.session_context_id || lessonContext.lesson_id,
    lesson_id: lessonContext.lesson_id,
    subject: lessonContext.subject,
    teacher_name: lessonContext.teacher_name,
    approved_summary: lessonContext.approved_summary,
    classroom_environment: lessonContext.classroom_environment,
    classroomAnalyticsScore: lessonContext.classroom_analytics?.[domain] || 0,
    teacherObservationScore: lessonContext.teacher_observation?.[domain] || 0,
    engagement_trend: lessonContext.engagement_trend || 0,
    follow_up_completion_rate: lessonContext.follow_up_completion_rate || 0,
  };
}
