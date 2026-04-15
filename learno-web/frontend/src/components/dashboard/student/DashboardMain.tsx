"use client";

import { AchievementsCard } from "./AchievementsCard";
import { DailyChallenge } from "./DailyChallenge";
import { FocusModeCard } from "./FocusModeCard";
import { HeroSection } from "./HeroSection";
import { LearningPath } from "./LearningPath";
import { LessonSummaries } from "./LessonSummaries";
import { MoodCheckIn } from "./MoodCheckIn";
import { NeuroAssignmentsCard } from "./NeuroAssignmentsCard";
import { SmartAttentionCard } from "./SmartAttentionCard";
import { StatsSection } from "./StatsSection";
import { XPLevelCard } from "./XPLevelCard";

export function DashboardMain() {
  return (
    <div className="relative z-10 flex flex-col gap-6 pb-24">
      <HeroSection />
      <MoodCheckIn />
      <StatsSection />
      <XPLevelCard />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <NeuroAssignmentsCard />
        <LessonSummaries />
        <DailyChallenge />
        <AchievementsCard />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SmartAttentionCard />
        <LearningPath />
      </div>

      <FocusModeCard />
    </div>
  );
}
