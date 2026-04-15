/**
 * i18n.js
 *
 * UI label translations for all screener interfaces.
 * Supported languages: "en" (English), "fr" (French), "ar" (Arabic)
 *
 * Usage:
 *   import { getLabels } from './i18n.js';
 *   const t = getLabels("fr");
 *   t.next  // → "Suivant"
 */

const LABELS = {
  en: {
    // Navigation
    next: "Next",
    back: "Back",
    finish: "Finish",
    continue: "Continue",
    skip: "Skip",
    reset: "Start Over",

    // Progress
    taskOf: (current, total) => `Task ${current} of ${total}`,
    taskLabel: "Task",
    partOf: (current, total) => `Part ${current} of ${total}`,

    // Session controls
    pause: "Pause",
    resume: "Resume",
    pauseNotice: "Session paused. Take your time.",
    resumeNotice: "Ready to continue?",

    // Errors and notices
    errorGeneric: "Something went wrong. Please try again.",
    sessionExpired: "Your session has expired. Please restart.",
    noResponseRequired: "No response needed — just do your best.",
    notSure: "Not sure",

    // Feedback (student-safe, non-diagnostic)
    feedbackComplete: "You've finished! Your teacher will review your results.",
    feedbackThankYou: "Thank you for completing this activity.",

    // Scale labels
    scaleNever: "Never",
    scaleRarely: "Rarely",
    scaleSometimes: "Sometimes",
    scaleOften: "Often",
    scaleAlways: "Always",

    scaleNotAtAll: "Not at all",
    scaleAlittleBit: "A little bit",
    scaleModerately: "Moderately",
    scaleQuite: "Quite a bit",
    scaleVeryMuch: "Very much",

    scaleTooLow: "Too low",
    scaleJustRight: "Just right",
    scaleTooHigh: "Too high",

    // Reflection engagement scale
    scaleVeryLow: "Very low",
    scaleLow: "Low",
    scaleMixed: "Mixed",
    scaleGood: "Good",
    scaleVeryGood: "Very good",

    // Reflection difficulty scale
    scaleNotDifficult: "Not difficult",
    scaleAlittleDifficult: "A little difficult",
    scaleModeratelyDifficult: "Moderately difficult",
    scaleQuiteDifficult: "Quite difficult",
    scaleVeryDifficult: "Very difficult",

    // Reflection support options
    supportExtraExplanation: "Extra explanation",
    supportExtraPractice: "Extra practice",
    supportSimplerVersion: "A simpler version",
    supportStepByStep: "A step-by-step format",

    // Comfort screener labels
    comfortTitle: "How are you feeling about your environment?",
    comfortInstruction: "For each question, choose the answer that feels most true for you right now.",
    supportPrefTitle: "What would help you most?",
    supportPrefInstruction: "Select any that apply.",
    nothingNeeded: "Nothing — I'm comfortable as is",
    quieterSpace: "A quieter space",
    betterLighting: "Better lighting",
    freshAir: "More fresh air or better temperature",
    fewerDistractions: "Fewer distractions around me",
    noiseBlockingHeadphones: "Noise-blocking headphones",
    naturalLight: "More natural light",
    windowOrFan: "A window or fan nearby",
    separateWorkspace: "A separate workspace",

    // Reflection screener labels
    reflectionTitle: "Reflecting on your learning",
    reflectionInstruction: "Answer honestly — there are no right or wrong answers.",

    // Focus screener
    focusTitle: "Focus Check",
    focusSelectiveInstruction: "Select related words.",
    focusGoNoGoInstruction: "Press for the target.",
    focusMemoryInstruction: "Read the steps, then complete the task from memory.",
    focusMultistepInstruction: "Read and answer.",

    // Reading screener
    readingTitle: "Reading Check",
    readingWordInstruction: "Choose the match.",
    readingPassageInstruction: "Read and answer.",
    readingReconstructionInstruction: "Build the sentence.",
    readingModalityInstruction: "Read or listen, then answer.",

    // Math screener
    mathTitle: "Math Check",
    mathValueInstruction: "Choose the larger value.",
    mathRepresentationInstruction: "Match the value.",
    mathSequenceInstruction: "Complete the pattern.",
    mathFluencyInstruction: "Answer quickly. Skip if needed.",

    // App chrome
    suiteEyebrow: "Learno",
    suiteTitle: "Challenges",
    suiteSubtitle: "",
    suiteStepLabel: "Suite overview",
    suiteProgressText: "Choose a screener to begin",
    resultEyebrow: "Completed support signal",
    resultStepLabel: "Complete",
    resultProgressText: "Signal stored for longitudinal profile",
    finalSupportIndicatorLabel: "Support indicator",
    resultSubtitle: "Role-based outputs are generated from the same normalized support signal model.",
    screenerEyebrow: "Learno support screener",
    ageLabel: "Age",
    schoolCycleLabel: "School cycle",
    autoOption: "Auto",
    cyclePrimary: "Primary",
    cycleCollege: "College",
    cycleLycee: "Lycee",
    elapsed: "Elapsed",

    // Home/result view
    signalPreviewLabel: "Role-based preview",
    latestSignalHeading: "Latest support signal",
    noSignalYet: "No support signal yet",
    sharedSignalNote: "Student, teacher, and support-staff views are generated from one shared SupportSignal model.",
    noSignalEmptyState: "Complete any screener to preview student-safe, teacher, and support-team outputs.",
    resetDemoProfile: "Reset demo profile",
    roleBasedOutput: "Role-based output",
    signalAvailableNote: "This signal is now available for repeated-pattern tracking and longitudinal review.",
    backToSuite: "Back to suite",
    runAgain: "Run this screener again",

    // Screen-reader announce messages
    announceStarted: (name) => `${name} started.`,
    announcePaused: "Paused. Continue when ready.",
    announceResumed: "Session resumed.",
    announceComplete: (name) => `${name} complete.`,
    announceProfileReset: "Demo profile reset.",

    // Screener card
    noRunYet: "No run yet",
    noActiveFlags: "No repeated support flags are active right now.",
    activeFlagsLabel: "Active support flags",
    noSignalsYet: "No screeners have been completed yet.",
    latestBand: "Latest band",
    launch: "Launch",
    launchChallenge: "Launch",
    challengeLibraryEyebrow: "Learno",
    challengeLibraryHeading: "Challenge-based assessments",
    challengeLibraryDescription: "",
    challengeCardLabel: "Challenge",
    challengeStepCountLabel: "Included steps",
    challengeFlowEyebrow: "Learno",
    challengeResultEyebrow: "Challenge result",
    challengeDomainsLabel: "Included screeners",
    challengeBlueprintLabel: "Challenge blueprint",
    challengeAttentionRegulation: "Attention Regulation",
    challengeAttentionRegulationDescription: "Focus attention control with reflective check-ins for attention regulation and learning readiness.",
    challengeExecutiveFunction: "Executive Function",
    challengeExecutiveFunctionDescription: "Working memory, multi-step follow-through, and reflective support prompts in one guided flow.",
    challengeReadingAccess: "Reading Access",
    challengeReadingAccessDescription: "Reading access tasks combined with a memory checkpoint for a coherent reading support flow.",
    challengeMathProcessing: "Math Processing",
    challengeMathProcessingDescription: "Math processing tasks with a multi-step focus checkpoint for structured readiness review.",
    challengeSensorySupport: "Sensory Support",
    challengeSensorySupportDescription: "Comfort screening with attention and support-preference prompts for classroom sensory support planning.",
    challengeAnxiety: "Anxiety and Learning Support",
    challengeAnxietyDescription: "Reflection-led challenge with comfort prompts to understand learning strain and classroom support needs.",
    challengeDepression: "Mood and Learning Check-In",
    challengeDepressionDescription: "A reflection-only challenge flow focused on confidence, effort, difficulty, and support preferences.",

    // Common screener
    taskBasis: "Task basis",
    supportiveNote: "Supportive note",
    saveAndContinue: "Continue",
    taskSaved: "The task has been saved.",
    tryOnceMore: "You can try once more before moving on.",
    selectBestAnswer: "Choose one.",
    skipsAllowed: "Skip if needed.",

    // Reading screener strings
    placeBlockHere: "Place a block here",
    yourSentence: "Your sentence",
    availableBlocks: "Available blocks",
    continueToQuestions: "Continue",
    finishReadingCheck: "Finish",
    textOnlyLabel: "Text-only",
    audioSupportedLabel: "Audio-supported",
    playAudio: "Play support reading",

    // Math screener strings
    finishMathCheck: "Finish Math Reasoning Check",

    // Focus screener strings
    placeStepHere: "Place a step here",
    yourOrder: "Your order",
    availableSteps: "Available steps",
    startSequence: "Start",
    showSequence: "Show sequence",
    respondButton: "Respond",
    respondOnly: (target) => `Respond only to ${target}`,
    resetOrder: "Reset order",
    resetStepOrder: "Reset step order",
    finishFocusCheck: "Finish",
    focusCardsLabel: "Cards",
    focusOmissionsLabel: "Omissions",
    focusCommissionsLabel: "Commissions",
    focusVariabilityLabel: "Variability",
    focusAccuracyLabel: "Accuracy",
    focusRetriesLabel: "Retries",
    focusTaskLabel: (n) => `Task ${n} – `,
    focusTask1Label: "Task 1 – Selective attention",
    focusTask2Label: "Task 2 – Go / No-Go inhibition",
    focusTask3Label: "Task 3 – Working-memory sequence",
    focusTask4Label: "Task 4 – Multi-step instruction",
    lockedLabel: "Locked",

    // Math render task eyebrows / titles / helpers
    mathComparisonEyebrow: "Value comparison",
    mathComparisonTitle: "Compare the symbolic values.",
    mathComparisonHelper: "This task preserves symbolic magnitude comparison and number-sense logic.",
    mathRepresentationEyebrow: "Representation matching",
    mathRepresentationTitle: "Match the representation to the correct value.",
    mathRepresentationHelper: "This task preserves symbol-to-quantity and representation mapping logic.",
    mathSequenceEyebrow: "Sequence logic",
    mathSequenceTitle: "Find the next value or rule.",
    mathSequenceHelper: "This task preserves sequence and pattern reasoning rather than simple fact recall.",

    // Support level labels (for trend/result panels)
    supportLevelLabels: {
      no_strong_concern:             "No strong concern",
      monitor:                       "Monitor",
      repeated_difficulty_indicator: "Repeated difficulty indicator",
      support_review_recommended:    "Support review recommended",
    },

    // Domain labels
    domainLabels: {
      attention:  "Attention and executive function",
      reading:    "Reading access",
      math:       "Math reasoning",
      sensory:    "Sensory and classroom comfort",
      engagement: "Learning engagement",
    },

    // Screener card metadata
    focusScreenerName: "Focus Check",
    focusScreenerDescription: "CPT-style sustained attention, Go/No-Go inhibition, working-memory sequencing, and multi-step academic follow-through.",
    focusScreenerDuration: "3-5 min",
    focusParadigm1: "CPT-style sustained attention",
    focusParadigm2: "Go/No-Go inhibition",
    focusParadigm3: "Working-memory sequencing",
    focusParadigm4: "Multi-step instruction handling",

    readingScreenerName: "Reading Support Check",
    readingScreenerDescription: "Decoding, word recognition, comprehension, sentence reconstruction, and text-only versus audio-supported comparison.",
    readingScreenerDuration: "3-5 min",
    readingParadigm1: "Decoding and word recognition",
    readingParadigm2: "Reading comprehension",
    readingParadigm3: "Sentence reconstruction",
    readingParadigm4: "Text-only versus audio-supported comparison",

    mathScreenerName: "Math Reasoning Check",
    mathScreenerDescription: "Symbolic comparison, number sense, representation matching, sequence logic, and arithmetic fluency.",
    mathScreenerDuration: "3-5 min",
    mathParadigm1: "Symbolic magnitude comparison",
    mathParadigm2: "Number sense",
    mathParadigm3: "Symbol-quantity mapping",
    mathParadigm4: "Arithmetic fluency",
    mathParadigm5: "Sequence reasoning",

    comfortScreenerName: "Comfort Check",
    comfortScreenerDescription: "Private sensory self-report with classroom context matching for noise, light, air, and concentration comfort.",
    comfortScreenerDuration: "1-2 min",
    comfortParadigm1: "Sensory self-report",
    comfortParadigm2: "Context-aware environmental screening",
    comfortParadigm3: "Classroom comfort indicators",

    reflectionScreenerName: "Learning Reflection",
    reflectionScreenerDescription: "School engagement self-report with focus, confidence, difficulty, help-seeking, and mental effort prompts.",
    reflectionScreenerDuration: "2-3 min",
    reflectionParadigm1: "School engagement self-report",
    reflectionParadigm2: "Academic distress and help-seeking",
    reflectionParadigm3: "Staged school-based support screening",

    // getTaskMeta labels — reading
    readingTask1Label: "Task 1 – Word discrimination in context",
    readingTask2Label: "Task 2 – Short passage comprehension",
    readingTask3Label: "Task 3 – Sentence reconstruction",
    readingTask4Label: "Task 4 – Modality comparison",

    // getTaskMeta labels — math
    mathTask1Label: "Task 1 – Value comparison",
    mathTask2Label: "Task 2 – Representation matching",
    mathTask3Label: "Task 3 – Sequence logic",
    mathTask4Label: "Task 4 – Mental calculation fluency",

    // getTaskMeta labels — comfort
    comfortTask1Label: "Screen 1 – Noise comfort",
    comfortTask2Label: "Screen 2 – Light comfort",
    comfortTask3Label: "Screen 3 – Air and environment comfort",
    comfortTask4Label: "Screen 4 – Concentration ease and support preference",

    // getTaskMeta labels — reflection
    reflectionTask1Label: "Prompt 1 – Focus",
    reflectionTask2Label: "Prompt 2 – Confidence",
    reflectionTask3Label: "Prompt 3 – Difficulty or feeling lost",
    reflectionTask4Label: "Prompt 4 – Support preference",
    reflectionTask5Label: "Prompt 5 – Mental effort",

    // Indicator pill display labels (keyed by stored English indicator string)
    indicatorLabels: {
      "repeated attention difficulty indicators":                   "Repeated attention difficulty indicators",
      "difficulty sustaining performance across structured tasks":  "Difficulty sustaining performance across structured tasks",
      "difficulty handling multi-step academic instructions":       "Difficulty handling multi-step academic instructions",
      "possible reading-access difficulty":                        "Possible reading-access difficulty",
      "repeated decoding or word-discrimination difficulty":        "Repeated decoding or word-discrimination difficulty",
      "possible math-processing difficulty":                       "Possible math-processing difficulty",
      "repeated difficulty with symbolic numerical tasks":          "Repeated difficulty with symbolic numerical tasks",
      "repeated sensory discomfort indicators":                    "Repeated sensory discomfort indicators",
      "possible classroom overstimulation":                        "Possible classroom overstimulation",
      "repeated disengagement indicators":                         "Repeated disengagement indicators",
      "repeated emotional strain indicators":                      "Repeated emotional strain indicators",
      "reading support may be beneficial":                         "Reading support may be beneficial",
      "guided math support may help":                              "Guided math support may help",
      "environmental adjustment may help":                         "Environmental adjustment may help",
      "learner may benefit from additional support":               "Learner may benefit from additional support",
    },

    // Suggested support action keys → display strings
    supportActionLabels: {
      "attention.chunk_instructions":    "Offer chunked instructions and a visible step-by-step version for follow-up work.",
      "attention.support_review":        "Consider support-staff review of sustained attention and classroom follow-through patterns.",
      "attention.short_chunks":          "Use shorter task chunks and a visible sequence of next steps during follow-up.",
      "reading.guided_decoding":         "Offer audio-supported reading, guided decoding prompts, and shorter reading blocks.",
      "reading.monitor_comprehension":   "Monitor comprehension and provide optional read-aloud support on denser texts.",
      "math.worked_examples":            "Use worked examples, symbolic-to-visual scaffolds, and short fluency refresh tasks.",
      "math.monitor_symbolic":           "Monitor symbolic reasoning load and add a brief guided example before independent work.",
      "sensory.review_environment":      "Review seating, noise, lighting, and simplified follow-up options for the next session.",
      "sensory.monitor_comfort":         "Monitor classroom comfort and offer a quieter follow-up pathway when needed.",
      "engagement.guided_followup":      "Offer shorter guided follow-up, extra explanation, and a clear next-step plan.",
      "engagement.monitor_confidence":   "Monitor confidence and lesson difficulty patterns across the next few sessions.",
    },

    // Teacher metrics_summary key display labels
    metricsLabels: {
      omission_count:                     "Omissions",
      commission_count:                   "Commissions",
      response_time_variability_ms:       "Response time variability (ms)",
      performance_drop_percent:           "Performance drop (%)",
      multistep_score:                    "Multi-step score",
      word_accuracy_percent:              "Word accuracy (%)",
      comprehension_accuracy_percent:     "Comprehension accuracy (%)",
      modality_gap:                       "Modality gap",
      skipped_items:                      "Skipped items",
      symbolic_accuracy_percent:          "Symbolic accuracy (%)",
      visual_symbolic_gap:                "Visual-symbolic gap",
      sequence_accuracy_percent:          "Sequence accuracy (%)",
      self_report_average:                "Self-report average",
      environment_match_score:            "Environment match score",
      support_preference:                 "Support preference",
      focus_rating:                       "Focus rating",
      confidence_rating:                  "Confidence rating",
      difficulty_rating:                  "Difficulty rating",
      preferred_support:                  "Preferred support",
    },

    // Recommendation keys → display strings
    recommendationLabels: {
      "recommendation.support_review":          "Support review recommended.",
      "recommendation.high_score_monitor":      "High current score noted. Continue monitoring until repeated evidence is established.",
      "recommendation.monitor_repeated_patterns": "Monitor repeated patterns and consider classroom support adjustments.",
      "recommendation.routine_monitoring":      "No urgent escalation. Continue routine monitoring where relevant.",
    },

    // English paradigm strings → localized display strings (for <pre> block)
    paradigmLabels: {
      "CPT-style sustained attention":                  "CPT-style sustained attention",
      "Go/No-Go inhibition":                            "Go/No-Go inhibition",
      "Working-memory sequencing":                      "Working-memory sequencing",
      "Multi-step instruction handling":                "Multi-step instruction handling",
      "Decoding and word recognition":                  "Decoding and word recognition",
      "Reading comprehension":                          "Reading comprehension",
      "Sentence reconstruction":                        "Sentence reconstruction",
      "Text-only versus audio-supported comparison":    "Text-only versus audio-supported comparison",
      "Symbolic magnitude comparison":                  "Symbolic magnitude comparison",
      "Number sense":                                   "Number sense",
      "Symbol-quantity mapping":                        "Symbol-quantity mapping",
      "Arithmetic fluency":                             "Arithmetic fluency",
      "Sequence reasoning":                             "Sequence reasoning",
      "Sensory self-report":                            "Sensory self-report",
      "Context-aware environmental screening":          "Context-aware environmental screening",
      "Classroom comfort indicators":                   "Classroom comfort indicators",
      "School engagement self-report":                  "School engagement self-report",
      "Academic distress and help-seeking":             "Academic distress and help-seeking",
      "Staged school-based support screening":          "Staged school-based support screening",
    },

    // Generic student-safe feedback (per domain, non-diagnostic)
    genericStudentFeedback: {
      attention: [
        "Thanks. This helps personalize your support.",
        "Focus Mode is available for your next activity.",
        "A step-by-step version can be offered next time.",
      ],
      reading: [
        "Thanks. This helps personalize your support.",
        "Audio-supported reading can be offered next time.",
        "Extra guided reading practice is available.",
      ],
      math: [
        "Thanks. This helps personalize your support.",
        "Extra guided practice is available.",
        "Worked examples can be offered next time.",
      ],
      sensory: [
        "Thanks. This helps personalize your support.",
        "A quieter or simpler follow-up can be offered next time.",
        "Comfort settings can be adjusted when needed.",
      ],
      engagement: [
        "Thanks. This helps personalize your support.",
        "A step-by-step version can be offered next time.",
        "Extra explanation can be prepared for the next lesson.",
      ],
    },

    // Screener-specific conditional student feedback strings
    studentFeedbackThanks: "Thanks. This helps personalize your support.",
    studentFeedbackStepByStep: "A step-by-step version can be offered next time.",
    studentFeedbackFocusMode: "Focus Mode is available for your next activity.",
    studentFeedbackExtraExplanation: "Extra explanation or guided practice can be prepared for the next lesson.",
  },

  fr: {
    // Navigation
    next: "Suivant",
    back: "Retour",
    finish: "Terminer",
    continue: "Continuer",
    skip: "Passer",
    reset: "Recommencer",

    // Progress
    taskOf: (current, total) => `Tâche ${current} sur ${total}`,
    taskLabel: "Tâche",
    partOf: (current, total) => `Partie ${current} sur ${total}`,

    // Session controls
    pause: "Pause",
    resume: "Reprendre",
    pauseNotice: "Session en pause. Prenez votre temps.",
    resumeNotice: "Prêt à continuer ?",

    // Errors and notices
    errorGeneric: "Une erreur s'est produite. Veuillez réessayer.",
    sessionExpired: "Votre session a expiré. Veuillez recommencer.",
    noResponseRequired: "Aucune réponse requise — faites de votre mieux.",
    notSure: "Je ne suis pas sûr(e)",

    // Feedback
    feedbackComplete: "Vous avez terminé ! Votre enseignant(e) examinera vos résultats.",
    feedbackThankYou: "Merci d'avoir complété cette activité.",

    // Scale labels
    scaleNever: "Jamais",
    scaleRarely: "Rarement",
    scaleSometimes: "Parfois",
    scaleOften: "Souvent",
    scaleAlways: "Toujours",

    scaleNotAtAll: "Pas du tout",
    scaleAlittleBit: "Un peu",
    scaleModerately: "Modérément",
    scaleQuite: "Assez",
    scaleVeryMuch: "Beaucoup",

    scaleTooLow: "Trop bas",
    scaleJustRight: "Juste bien",
    scaleTooHigh: "Trop élevé",

    // Comfort screener labels
    comfortTitle: "Comment vous sentez-vous dans votre environnement ?",
    comfortInstruction: "Pour chaque question, choisissez la réponse qui vous convient le mieux en ce moment.",
    supportPrefTitle: "Qu'est-ce qui vous aiderait le plus ?",
    supportPrefInstruction: "Sélectionnez tout ce qui s'applique.",
    nothingNeeded: "Rien — je suis à l'aise comme ça",
    quieterSpace: "Un espace plus calme",
    betterLighting: "Un meilleur éclairage",
    freshAir: "Plus d'air frais ou une meilleure température",
    fewerDistractions: "Moins de distractions autour de moi",
    noiseBlockingHeadphones: "Des écouteurs anti-bruit",
    naturalLight: "Plus de lumière naturelle",
    windowOrFan: "Une fenêtre ou un ventilateur à proximité",
    separateWorkspace: "Un espace de travail séparé",

    // Reflection screener labels
    reflectionTitle: "Réflexion sur votre apprentissage",
    reflectionInstruction: "Répondez honnêtement — il n'y a pas de bonnes ou mauvaises réponses.",

    // Focus screener
    focusTitle: "Vérification de la concentration",
    focusSelectiveInstruction: "Sélectionnez tous les mots qui appartiennent au même sujet.",
    focusGoNoGoInstruction: "Appuyez sur le bouton uniquement lorsque vous voyez le symbole cible.",
    focusMemoryInstruction: "Lisez les étapes, puis effectuez la tâche de mémoire.",
    focusMultistepInstruction: "Lisez le passage, puis répondez aux questions.",

    // Reading screener
    readingTitle: "Vérification de la lecture",
    readingWordInstruction: "Choisissez le mot qui correspond à la description.",
    readingPassageInstruction: "Lisez le passage, puis répondez aux questions.",
    readingReconstructionInstruction: "Mettez les mots dans le bon ordre pour former une phrase.",
    readingModalityInstruction: "Lisez ou écoutez, puis répondez à la question.",

    // Math screener
    mathTitle: "Vérification mathématique",
    mathValueInstruction: "Comparez les valeurs et choisissez la bonne réponse.",
    mathRepresentationInstruction: "Associez le nombre à sa représentation.",
    mathSequenceInstruction: "Complétez le modèle.",
    mathFluencyInstruction: "Répondez au plus grand nombre possible. Passez si nécessaire.",

    // Reflection engagement scale
    scaleVeryLow: "Très faible",
    scaleLow: "Faible",
    scaleMixed: "Mitigé",
    scaleGood: "Bien",
    scaleVeryGood: "Très bien",

    // Reflection difficulty scale
    scaleNotDifficult: "Pas difficile",
    scaleAlittleDifficult: "Un peu difficile",
    scaleModeratelyDifficult: "Modérément difficile",
    scaleQuiteDifficult: "Assez difficile",
    scaleVeryDifficult: "Très difficile",

    // Reflection support options
    supportExtraExplanation: "Explication supplémentaire",
    supportExtraPractice: "Pratique supplémentaire",
    supportSimplerVersion: "Une version plus simple",
    supportStepByStep: "Un format étape par étape",

    // App chrome
    suiteEyebrow: "Moteur de soutien longitudinal Learno",
    suiteTitle: "Suite de dépistage adaptatif",
    suiteSubtitle: "Micro-dépisteurs basés sur des paradigmes avec des sorties bienveillantes et non diagnostiques.",
    suiteStepLabel: "Aperçu de la suite",
    suiteProgressText: "Choisissez un dépisteur pour commencer",
    resultEyebrow: "Signal de soutien complété",
    resultStepLabel: "Terminé",
    resultProgressText: "Signal enregistré dans le profil longitudinal",
    finalSupportIndicatorLabel: "Indicateur de soutien",
    resultSubtitle: "Les sorties basées sur les rôles sont générées à partir du même modèle de signal de soutien normalisé.",
    screenerEyebrow: "Dépisteur de soutien Learno",
    ageLabel: "Âge",
    schoolCycleLabel: "Cycle scolaire",
    autoOption: "Auto",
    cyclePrimary: "Primaire",
    cycleCollege: "Collège",
    cycleLycee: "Lycée",
    elapsed: "Écoulé",

    // Home/result view
    signalPreviewLabel: "Aperçu basé sur le rôle",
    latestSignalHeading: "Dernier signal de soutien",
    noSignalYet: "Aucun signal de soutien encore",
    sharedSignalNote: "Les vues élève, enseignant et équipe de soutien sont générées à partir d'un seul modèle SupportSignal partagé.",
    noSignalEmptyState: "Complétez n'importe quel dépisteur pour prévisualiser les sorties élève, enseignant et équipe de soutien.",
    resetDemoProfile: "Réinitialiser le profil de démonstration",
    roleBasedOutput: "Sortie basée sur le rôle",
    signalAvailableNote: "Ce signal est maintenant disponible pour le suivi des motifs répétés et la révision longitudinale.",
    backToSuite: "Retour à la suite",
    runAgain: "Relancer ce dépisteur",

    // Screen-reader announce messages
    announceStarted: (name) => `${name} démarré.`,
    announcePaused: "Mis en pause. Continuez quand vous êtes prêt.",
    announceResumed: "Session reprise.",
    announceComplete: (name) => `${name} terminé.`,
    announceProfileReset: "Profil de démonstration réinitialisé.",

    // Screener card
    noRunYet: "Aucune exécution encore",
    noActiveFlags: "Aucun indicateur de soutien répété n'est actif en ce moment.",
    activeFlagsLabel: "Indicateurs de soutien actifs",
    noSignalsYet: "Aucun dépisteur n'a encore été complété.",
    latestBand: "Dernière bande",
    launch: "Lancer",
    launchChallenge: "Lancer le challenge",
    challengeLibraryEyebrow: "Parcours guidés",
    challengeLibraryHeading: "Évaluations basées sur des challenges",
    challengeLibraryDescription: "Des parcours structurés combinent plusieurs étapes de dépistage dans une seule évaluation guidée.",
    challengeCardLabel: "Challenge",
    challengeStepCountLabel: "Étapes incluses",
    challengeFlowEyebrow: "Challenge guidé Learno",
    challengeResultEyebrow: "Résultat du challenge",
    challengeDomainsLabel: "Dépisteurs inclus",
    challengeBlueprintLabel: "Blueprint du challenge",
    challengeAttentionRegulation: "Régulation de l'attention",
    challengeAttentionRegulationDescription: "Contrôle attentionnel et points de réflexion pour une lecture structurée de la régulation attentionnelle.",
    challengeExecutiveFunction: "Fonction exécutive",
    challengeExecutiveFunctionDescription: "Mémoire de travail, suivi d'instructions et appuis réflexifs dans un même parcours guidé.",
    challengeReadingAccess: "Accès à la lecture",
    challengeReadingAccessDescription: "Tâches de lecture combinées à un point de mémoire pour un parcours cohérent de soutien en lecture.",
    challengeMathProcessing: "Traitement mathématique",
    challengeMathProcessingDescription: "Tâches mathématiques avec un point d'attention multi-étapes pour une revue structurée.",
    challengeSensorySupport: "Soutien sensoriel",
    challengeSensorySupportDescription: "Confort en classe, attention et préférences de soutien réunis dans un parcours sensoriel guidé.",
    challengeAnxiety: "Soutien anxiété et apprentissage",
    challengeAnxietyDescription: "Parcours centré sur la réflexion avec des questions de confort pour comprendre la tension liée aux apprentissages.",
    challengeDepression: "Repère humeur et apprentissage",
    challengeDepressionDescription: "Parcours de réflexion centré sur la confiance, l'effort, la difficulté et les préférences de soutien.",

    // Common screener
    taskBasis: "Base de la tâche",
    supportiveNote: "Note bienveillante",
    saveAndContinue: "Enregistrer et continuer",
    taskSaved: "La tâche a été enregistrée.",
    tryOnceMore: "Vous pouvez réessayer une fois avant de continuer.",
    selectBestAnswer: "Sélectionnez la meilleure réponse. Vous pouvez passer si nécessaire.",
    skipsAllowed: "Vous pouvez passer si vous voulez continuer.",

    // Reading screener strings
    placeBlockHere: "Placer un bloc ici",
    yourSentence: "Votre phrase",
    availableBlocks: "Blocs disponibles",
    continueToQuestions: "Continuer vers les questions",
    finishReadingCheck: "Terminer la vérification de lecture",
    textOnlyLabel: "Texte seulement",
    audioSupportedLabel: "Avec support audio",
    playAudio: "Écouter le passage",

    // Math screener strings
    finishMathCheck: "Terminer la vérification mathématique",

    // Focus screener strings
    placeStepHere: "Placer une étape ici",
    yourOrder: "Votre ordre",
    availableSteps: "Étapes disponibles",
    startSequence: "Démarrer la séquence",
    showSequence: "Afficher la séquence",
    respondButton: "Répondre",
    respondOnly: (target) => `Répondre uniquement à ${target}`,
    resetOrder: "Réinitialiser l'ordre",
    resetStepOrder: "Réinitialiser l'ordre des étapes",
    finishFocusCheck: "Terminer la vérification de concentration",
    focusCardsLabel: "Cartes",
    focusOmissionsLabel: "Omissions",
    focusCommissionsLabel: "Commissions",
    focusVariabilityLabel: "Variabilité",
    focusAccuracyLabel: "Précision",
    focusRetriesLabel: "Tentatives",
    focusTaskLabel: (n) => `Tâche ${n} – `,
    focusTask1Label: "Tâche 1 – Attention sélective",
    focusTask2Label: "Tâche 2 – Inhibition Go / No-Go",
    focusTask3Label: "Tâche 3 – Séquence de mémoire de travail",
    focusTask4Label: "Tâche 4 – Instruction multi-étapes",
    lockedLabel: "Verrouillé",

    // Math render task eyebrows / titles / helpers
    mathComparisonEyebrow: "Comparaison de valeurs",
    mathComparisonTitle: "Comparez les valeurs symboliques.",
    mathComparisonHelper: "Cette tâche préserve la comparaison de grandeurs symboliques et la logique du sens du nombre.",
    mathRepresentationEyebrow: "Appariement de représentations",
    mathRepresentationTitle: "Associez la représentation à la bonne valeur.",
    mathRepresentationHelper: "Cette tâche préserve la correspondance symbole-quantité et la logique de représentation.",
    mathSequenceEyebrow: "Logique de séquence",
    mathSequenceTitle: "Trouvez la prochaine valeur ou règle.",
    mathSequenceHelper: "Cette tâche préserve le raisonnement séquentiel et par motifs plutôt que le simple rappel de faits.",

    // Support level labels (for trend/result panels)
    supportLevelLabels: {
      no_strong_concern:             "Pas de préoccupation majeure",
      monitor:                       "À surveiller",
      repeated_difficulty_indicator: "Indicateur de difficulté répétée",
      support_review_recommended:    "Révision de soutien recommandée",
    },

    // Domain labels
    domainLabels: {
      attention:  "Attention et fonctions exécutives",
      reading:    "Accès à la lecture",
      math:       "Raisonnement mathématique",
      sensory:    "Confort sensoriel et en classe",
      engagement: "Engagement dans l'apprentissage",
    },

    // Screener card metadata
    focusScreenerName: "Vérification de la concentration",
    focusScreenerDescription: "Attention soutenue de type CPT, inhibition Go/No-Go, séquençage de la mémoire de travail et suivi académique multi-étapes.",
    focusScreenerDuration: "3-5 min",
    focusParadigm1: "Attention soutenue de type CPT",
    focusParadigm2: "Inhibition Go/No-Go",
    focusParadigm3: "Séquençage de la mémoire de travail",
    focusParadigm4: "Traitement des instructions multi-étapes",

    readingScreenerName: "Vérification de la lecture",
    readingScreenerDescription: "Décodage, reconnaissance de mots, compréhension, reconstruction de phrases, et comparaison texte-seulement versus avec support audio.",
    readingScreenerDuration: "3-5 min",
    readingParadigm1: "Décodage et reconnaissance de mots",
    readingParadigm2: "Compréhension en lecture",
    readingParadigm3: "Reconstruction de phrases",
    readingParadigm4: "Comparaison texte-seulement versus avec support audio",

    mathScreenerName: "Vérification mathématique",
    mathScreenerDescription: "Comparaison symbolique, sens du nombre, appariement de représentations, logique de séquence et fluidité arithmétique.",
    mathScreenerDuration: "3-5 min",
    mathParadigm1: "Comparaison de grandeurs symboliques",
    mathParadigm2: "Sens du nombre",
    mathParadigm3: "Correspondance symbole-quantité",
    mathParadigm4: "Fluidité arithmétique",
    mathParadigm5: "Raisonnement séquentiel",

    comfortScreenerName: "Vérification du confort",
    comfortScreenerDescription: "Auto-évaluation sensorielle privée avec correspondance au contexte de la classe pour le bruit, la lumière, l'air et le confort de concentration.",
    comfortScreenerDuration: "1-2 min",
    comfortParadigm1: "Auto-évaluation sensorielle",
    comfortParadigm2: "Dépistage environnemental contextuel",
    comfortParadigm3: "Indicateurs de confort en classe",

    reflectionScreenerName: "Réflexion sur l'apprentissage",
    reflectionScreenerDescription: "Auto-évaluation de l'engagement scolaire avec des questions sur la concentration, la confiance, les difficultés, la recherche d'aide et l'effort mental.",
    reflectionScreenerDuration: "2-3 min",
    reflectionParadigm1: "Auto-évaluation de l'engagement scolaire",
    reflectionParadigm2: "Détresse académique et recherche d'aide",
    reflectionParadigm3: "Dépistage de soutien scolaire par étapes",

    // getTaskMeta labels — reading
    readingTask1Label: "Tâche 1 – Discrimination de mots en contexte",
    readingTask2Label: "Tâche 2 – Compréhension de court passage",
    readingTask3Label: "Tâche 3 – Reconstruction de phrases",
    readingTask4Label: "Tâche 4 – Comparaison de modalités",

    // getTaskMeta labels — math
    mathTask1Label: "Tâche 1 – Comparaison de valeurs",
    mathTask2Label: "Tâche 2 – Appariement de représentations",
    mathTask3Label: "Tâche 3 – Logique de séquence",
    mathTask4Label: "Tâche 4 – Fluidité de calcul mental",

    // getTaskMeta labels — comfort
    comfortTask1Label: "Écran 1 – Confort sonore",
    comfortTask2Label: "Écran 2 – Confort lumineux",
    comfortTask3Label: "Écran 3 – Confort de l'air et de l'environnement",
    comfortTask4Label: "Écran 4 – Facilité de concentration et préférence de soutien",

    // getTaskMeta labels — reflection
    reflectionTask1Label: "Invite 1 – Concentration",
    reflectionTask2Label: "Invite 2 – Confiance",
    reflectionTask3Label: "Invite 3 – Difficulté ou sentiment de perdition",
    reflectionTask4Label: "Invite 4 – Préférence de soutien",
    reflectionTask5Label: "Invite 5 – Effort mental",

    // Indicator pill display labels (keyed by stored English indicator string)
    indicatorLabels: {
      "repeated attention difficulty indicators":                   "Indicateurs répétés de difficultés d'attention",
      "difficulty sustaining performance across structured tasks":  "Difficulté à maintenir les performances sur des tâches structurées",
      "difficulty handling multi-step academic instructions":       "Difficulté à suivre des instructions académiques en plusieurs étapes",
      "possible reading-access difficulty":                        "Possible difficulté d'accès à la lecture",
      "repeated decoding or word-discrimination difficulty":        "Difficulté répétée de décodage ou de discrimination des mots",
      "possible math-processing difficulty":                       "Possible difficulté de traitement mathématique",
      "repeated difficulty with symbolic numerical tasks":          "Difficulté répétée avec les tâches numériques symboliques",
      "repeated sensory discomfort indicators":                    "Indicateurs répétés d'inconfort sensoriel",
      "possible classroom overstimulation":                        "Possible surstimulation en classe",
      "repeated disengagement indicators":                         "Indicateurs répétés de désengagement",
      "repeated emotional strain indicators":                      "Indicateurs répétés de tension émotionnelle",
      "reading support may be beneficial":                         "Un soutien en lecture peut être bénéfique",
      "guided math support may help":                              "Un soutien guidé en mathématiques peut aider",
      "environmental adjustment may help":                         "Un ajustement de l'environnement peut aider",
      "learner may benefit from additional support":               "L'élève peut bénéficier d'un soutien supplémentaire",
    },

    // Suggested support action keys → display strings
    supportActionLabels: {
      "attention.chunk_instructions":    "Proposer des instructions découpées et une version étape par étape visible pour le suivi.",
      "attention.support_review":        "Envisager une révision par le personnel de soutien des schémas d'attention soutenue et de suivi en classe.",
      "attention.short_chunks":          "Utiliser des tâches plus courtes et une séquence visible d'étapes suivantes lors du suivi.",
      "reading.guided_decoding":         "Proposer une lecture audio, des invites de décodage guidé et des blocs de lecture plus courts.",
      "reading.monitor_comprehension":   "Surveiller la compréhension et offrir un soutien optionnel de lecture à voix haute sur les textes plus denses.",
      "math.worked_examples":            "Utiliser des exemples résolus, des échafaudages symboliques-visuels et de courtes tâches de rafraîchissement de la fluidité.",
      "math.monitor_symbolic":           "Surveiller la charge de raisonnement symbolique et ajouter un bref exemple guidé avant le travail autonome.",
      "sensory.review_environment":      "Vérifier les sièges, le bruit, l'éclairage et proposer des options de suivi simplifiées pour la prochaine séance.",
      "sensory.monitor_comfort":         "Surveiller le confort en classe et proposer un chemin de suivi plus calme si nécessaire.",
      "engagement.guided_followup":      "Proposer un suivi guidé plus court, des explications supplémentaires et un plan d'étapes suivantes clair.",
      "engagement.monitor_confidence":   "Surveiller les schémas de confiance et de difficulté des leçons sur les prochaines séances.",
    },

    // Teacher metrics_summary key display labels
    metricsLabels: {
      omission_count:                     "Omissions",
      commission_count:                   "Commissions",
      response_time_variability_ms:       "Variabilité du temps de réponse (ms)",
      performance_drop_percent:           "Baisse de performance (%)",
      multistep_score:                    "Score multi-étapes",
      word_accuracy_percent:              "Précision des mots (%)",
      comprehension_accuracy_percent:     "Précision de compréhension (%)",
      modality_gap:                       "Écart de modalité",
      skipped_items:                      "Éléments ignorés",
      symbolic_accuracy_percent:          "Précision symbolique (%)",
      visual_symbolic_gap:                "Écart visuel-symbolique",
      sequence_accuracy_percent:          "Précision de la séquence (%)",
      self_report_average:                "Moyenne d'auto-évaluation",
      environment_match_score:            "Score de correspondance environnementale",
      support_preference:                 "Préférence de soutien",
      focus_rating:                       "Note de concentration",
      confidence_rating:                  "Note de confiance",
      difficulty_rating:                  "Note de difficulté",
      preferred_support:                  "Soutien préféré",
    },

    // Recommendation keys → display strings
    recommendationLabels: {
      "recommendation.support_review":            "Révision par l'équipe de soutien recommandée.",
      "recommendation.high_score_monitor":        "Score actuel élevé noté. Continuer le suivi jusqu'à ce que des preuves répétées soient établies.",
      "recommendation.monitor_repeated_patterns": "Surveiller les schémas répétés et envisager des ajustements du soutien en classe.",
      "recommendation.routine_monitoring":        "Pas d'escalade urgente. Continuer le suivi de routine si pertinent.",
    },

    // English paradigm strings → localized display strings (for <pre> block)
    paradigmLabels: {
      "CPT-style sustained attention":                  "Attention soutenue de type CPT",
      "Go/No-Go inhibition":                            "Inhibition Go/No-Go",
      "Working-memory sequencing":                      "Séquençage de la mémoire de travail",
      "Multi-step instruction handling":                "Traitement des instructions multi-étapes",
      "Decoding and word recognition":                  "Décodage et reconnaissance de mots",
      "Reading comprehension":                          "Compréhension en lecture",
      "Sentence reconstruction":                        "Reconstruction de phrases",
      "Text-only versus audio-supported comparison":    "Comparaison texte-seulement versus avec support audio",
      "Symbolic magnitude comparison":                  "Comparaison de grandeurs symboliques",
      "Number sense":                                   "Sens du nombre",
      "Symbol-quantity mapping":                        "Correspondance symbole-quantité",
      "Arithmetic fluency":                             "Fluidité arithmétique",
      "Sequence reasoning":                             "Raisonnement séquentiel",
      "Sensory self-report":                            "Auto-évaluation sensorielle",
      "Context-aware environmental screening":          "Dépistage environnemental contextuel",
      "Classroom comfort indicators":                   "Indicateurs de confort en classe",
      "School engagement self-report":                  "Auto-évaluation de l'engagement scolaire",
      "Academic distress and help-seeking":             "Détresse académique et recherche d'aide",
      "Staged school-based support screening":          "Dépistage de soutien scolaire par étapes",
    },

    // Generic student-safe feedback (per domain, non-diagnostic)
    genericStudentFeedback: {
      attention: [
        "Merci. Cela aide à personnaliser votre soutien.",
        "Le mode Focus est disponible pour votre prochaine activité.",
        "Une version étape par étape peut être proposée la prochaine fois.",
      ],
      reading: [
        "Merci. Cela aide à personnaliser votre soutien.",
        "La lecture avec support audio peut être proposée la prochaine fois.",
        "De la pratique guidée supplémentaire en lecture est disponible.",
      ],
      math: [
        "Merci. Cela aide à personnaliser votre soutien.",
        "De la pratique guidée supplémentaire est disponible.",
        "Des exemples résolus peuvent être proposés la prochaine fois.",
      ],
      sensory: [
        "Merci. Cela aide à personnaliser votre soutien.",
        "Un suivi plus calme ou simplifié peut être proposé la prochaine fois.",
        "Les paramètres de confort peuvent être ajustés si nécessaire.",
      ],
      engagement: [
        "Merci. Cela aide à personnaliser votre soutien.",
        "Une version étape par étape peut être proposée la prochaine fois.",
        "Des explications supplémentaires peuvent être préparées pour la prochaine leçon.",
      ],
    },

    // Screener-specific conditional student feedback strings
    studentFeedbackThanks: "Merci. Cela aide à personnaliser votre soutien.",
    studentFeedbackStepByStep: "Une version étape par étape peut être proposée la prochaine fois.",
    studentFeedbackFocusMode: "Le mode Focus est disponible pour votre prochaine activité.",
    studentFeedbackExtraExplanation: "Des explications supplémentaires ou une pratique guidée peuvent être préparées pour la prochaine leçon.",
  },

  ar: {
    // Navigation
    next: "التالي",
    back: "رجوع",
    finish: "إنهاء",
    continue: "متابعة",
    skip: "تخطي",
    reset: "البدء من جديد",

    // Progress
    taskOf: (current, total) => `المهمة ${current} من ${total}`,
    taskLabel: "مهمة",
    partOf: (current, total) => `الجزء ${current} من ${total}`,

    // Session controls
    pause: "إيقاف مؤقت",
    resume: "استئناف",
    pauseNotice: "الجلسة متوقفة مؤقتاً. خذ وقتك.",
    resumeNotice: "هل أنت مستعد للمتابعة؟",

    // Errors and notices
    errorGeneric: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    sessionExpired: "انتهت صلاحية جلستك. يرجى البدء من جديد.",
    noResponseRequired: "لا حاجة للإجابة — فقط افعل ما تستطيع.",
    notSure: "لست متأكداً",

    // Feedback
    feedbackComplete: "لقد انتهيت! سيراجع معلمك نتائجك.",
    feedbackThankYou: "شكراً لإتمام هذا النشاط.",

    // Scale labels
    scaleNever: "أبداً",
    scaleRarely: "نادراً",
    scaleSometimes: "أحياناً",
    scaleOften: "كثيراً",
    scaleAlways: "دائماً",

    scaleNotAtAll: "إطلاقاً",
    scaleAlittleBit: "قليلاً",
    scaleModerately: "بشكل معتدل",
    scaleQuite: "كثيراً",
    scaleVeryMuch: "جداً",

    scaleTooLow: "منخفض جداً",
    scaleJustRight: "مناسب تماماً",
    scaleTooHigh: "مرتفع جداً",

    // Comfort screener labels
    comfortTitle: "كيف تشعر حيال بيئتك؟",
    comfortInstruction: "لكل سؤال، اختر الإجابة التي تعبّر عن حالك الآن.",
    supportPrefTitle: "ما الذي سيساعدك أكثر؟",
    supportPrefInstruction: "اختر كل ما ينطبق عليك.",
    nothingNeeded: "لا شيء — أنا مرتاح كما أنا",
    quieterSpace: "مكان أكثر هدوءاً",
    betterLighting: "إضاءة أفضل",
    freshAir: "هواء أنقى أو درجة حرارة أفضل",
    fewerDistractions: "تشتيت أقل من حولي",
    noiseBlockingHeadphones: "سماعات عازلة للصوت",
    naturalLight: "ضوء طبيعي أكثر",
    windowOrFan: "نافذة أو مروحة قريبة",
    separateWorkspace: "مساحة عمل منفصلة",

    // Reflection screener labels
    reflectionTitle: "التأمل في تعلّمك",
    reflectionInstruction: "أجب بصدق — لا توجد إجابات صحيحة أو خاطئة.",

    // Focus screener
    focusTitle: "فحص التركيز",
    focusSelectiveInstruction: "اختر جميع الكلمات التي تنتمي إلى نفس الموضوع.",
    focusGoNoGoInstruction: "اضغط الزر فقط عندما ترى الرمز المستهدف.",
    focusMemoryInstruction: "اقرأ الخطوات، ثم أنجز المهمة من الذاكرة.",
    focusMultistepInstruction: "اقرأ المقطع، ثم أجب على الأسئلة.",

    // Reading screener
    readingTitle: "فحص القراءة",
    readingWordInstruction: "اختر الكلمة التي تناسب الوصف.",
    readingPassageInstruction: "اقرأ المقطع، ثم أجب على الأسئلة.",
    readingReconstructionInstruction: "رتّب الكلمات بالترتيب الصحيح لتكوين جملة.",
    readingModalityInstruction: "اقرأ أو استمع، ثم أجب على السؤال.",

    // Math screener
    mathTitle: "فحص الرياضيات",
    mathValueInstruction: "قارن القيم واختر الإجابة الصحيحة.",
    mathRepresentationInstruction: "طابق الرقم مع تمثيله.",
    mathSequenceInstruction: "أكمل النمط.",
    mathFluencyInstruction: "أجب على أكبر عدد ممكن. تخطَّ إذا احتجت.",

    // Reflection engagement scale
    scaleVeryLow: "منخفض جداً",
    scaleLow: "منخفض",
    scaleMixed: "متباين",
    scaleGood: "جيد",
    scaleVeryGood: "جيد جداً",

    // Reflection difficulty scale
    scaleNotDifficult: "غير صعب",
    scaleAlittleDifficult: "صعب قليلاً",
    scaleModeratelyDifficult: "صعب بشكل معتدل",
    scaleQuiteDifficult: "صعب جداً",
    scaleVeryDifficult: "صعب للغاية",

    // Reflection support options
    supportExtraExplanation: "شرح إضافي",
    supportExtraPractice: "تدريب إضافي",
    supportSimplerVersion: "نسخة أبسط",
    supportStepByStep: "تنسيق خطوة بخطوة",

    // App chrome
    suiteEyebrow: "محرك الدعم الطولي Learno",
    suiteTitle: "مجموعة الفحص التكيّفي للدعم",
    suiteSubtitle: "فاحصات دقيقة قائمة على النماذج مع مخرجات داعمة وغير تشخيصية.",
    suiteStepLabel: "نظرة عامة على المجموعة",
    suiteProgressText: "اختر فاحصاً للبدء",
    resultEyebrow: "إشارة الدعم المكتملة",
    resultStepLabel: "مكتمل",
    resultProgressText: "تم حفظ الإشارة في الملف الطولي",
    finalSupportIndicatorLabel: "مؤشر الدعم",
    resultSubtitle: "يتم إنشاء المخرجات القائمة على الأدوار من نفس نموذج إشارة الدعم الموحّد.",
    screenerEyebrow: "فاحص دعم Learno",
    ageLabel: "العمر",
    schoolCycleLabel: "المرحلة الدراسية",
    autoOption: "تلقائي",
    cyclePrimary: "ابتدائي",
    cycleCollege: "إعدادي",
    cycleLycee: "ثانوي",
    elapsed: "الوقت المنقضي",

    // Home/result view
    signalPreviewLabel: "معاينة قائمة على الدور",
    latestSignalHeading: "أحدث إشارة دعم",
    noSignalYet: "لا توجد إشارة دعم بعد",
    sharedSignalNote: "يتم إنشاء طرق عرض الطالب والمعلم وفريق الدعم من نموذج SupportSignal المشترك الواحد.",
    noSignalEmptyState: "أكمل أي فاحص لمعاينة مخرجات الطالب والمعلم وفريق الدعم.",
    resetDemoProfile: "إعادة تعيين ملف العرض التجريبي",
    roleBasedOutput: "مخرجات قائمة على الدور",
    signalAvailableNote: "هذه الإشارة متاحة الآن لتتبع الأنماط المتكررة والمراجعة الطولية.",
    backToSuite: "العودة إلى المجموعة",
    runAgain: "تشغيل هذا الفاحص مرة أخرى",

    // Screen-reader announce messages
    announceStarted: (name) => `${name} بدأ.`,
    announcePaused: "متوقف مؤقتاً. تابع عندما تكون مستعداً.",
    announceResumed: "تمت استعادة الجلسة.",
    announceComplete: (name) => `${name} اكتمل.`,
    announceProfileReset: "تمت إعادة تعيين ملف العرض التجريبي.",

    // Screener card
    noRunYet: "لا يوجد تشغيل بعد",
    noActiveFlags: "لا توجد علامات دعم متكررة نشطة الآن.",
    activeFlagsLabel: "علامات الدعم النشطة",
    noSignalsYet: "لم يتم إكمال أي فاحص بعد.",
    latestBand: "أحدث نطاق",
    launch: "إطلاق",
    launchChallenge: "ابدأ",
    challengeLibraryEyebrow: "Learno",
    challengeLibraryHeading: "تقييمات قائمة على التحديات",
    challengeLibraryDescription: "",
    challengeCardLabel: "تحدي",
    challengeStepCountLabel: "الخطوات المضمنة",
    challengeFlowEyebrow: "تحدي Learno الموجّه",
    challengeResultEyebrow: "نتيجة التحدي",
    challengeDomainsLabel: "الفاحصات المضمنة",
    challengeBlueprintLabel: "مخطط التحدي",
    challengeAttentionRegulation: "تنظيم الانتباه",
    challengeAttentionRegulationDescription: "مهام تركيز مع وقفات انعكاسية لدعم تنظيم الانتباه والاستعداد للتعلم.",
    challengeExecutiveFunction: "الوظائف التنفيذية",
    challengeExecutiveFunctionDescription: "ذاكرة عاملة ومتابعة متعددة الخطوات مع أسئلة دعم انعكاسية ضمن مسار واحد.",
    challengeReadingAccess: "الوصول إلى القراءة",
    challengeReadingAccessDescription: "مهام القراءة مع نقطة فحص للذاكرة ضمن مسار متماسك لدعم الوصول إلى القراءة.",
    challengeMathProcessing: "المعالجة الرياضية",
    challengeMathProcessingDescription: "مهام رياضية مع نقطة تركيز متعددة الخطوات ضمن مراجعة منظمة للاستعداد.",
    challengeSensorySupport: "الدعم الحسي",
    challengeSensorySupportDescription: "فحص الراحة مع الانتباه وتفضيلات الدعم ضمن مسار موجّه للدعم الحسي داخل الصف.",
    challengeAnxiety: "دعم القلق والتعلم",
    challengeAnxietyDescription: "مسار قائم على الانعكاس مع أسئلة الراحة لفهم الضغط المرتبط بالتعلم واحتياجات الدعم الصفي.",
    challengeDepression: "متابعة المزاج والتعلم",
    challengeDepressionDescription: "مسار انعكاسي يركز على الثقة والجهد والصعوبة وتفضيلات الدعم.",

    // Common screener
    taskBasis: "أساس المهمة",
    supportiveNote: "ملاحظة داعمة",
    saveAndContinue: "تابع",
    taskSaved: "تم حفظ المهمة.",
    tryOnceMore: "يمكنك المحاولة مرة أخرى قبل المتابعة.",
    selectBestAnswer: "اختر.",
    skipsAllowed: "تخط إذا لزم.",

    // Reading screener strings
    placeBlockHere: "ضع كتلة هنا",
    yourSentence: "جملتك",
    availableBlocks: "الكتل المتاحة",
    continueToQuestions: "تابع",
    finishReadingCheck: "إنهاء",
    textOnlyLabel: "نص فقط",
    audioSupportedLabel: "مدعوم بالصوت",
    playAudio: "تشغيل قراءة الدعم",

    // Math screener strings
    finishMathCheck: "إنهاء فحص الرياضيات",

    // Focus screener strings
    placeStepHere: "ضع خطوة هنا",
    yourOrder: "ترتيبك",
    availableSteps: "الخطوات المتاحة",
    startSequence: "ابدأ",
    showSequence: "عرض التسلسل",
    respondButton: "استجب",
    respondOnly: (target) => `استجب فقط لـ ${target}`,
    resetOrder: "إعادة تعيين الترتيب",
    resetStepOrder: "إعادة تعيين ترتيب الخطوات",
    finishFocusCheck: "إنهاء",
    focusCardsLabel: "البطاقات",
    focusOmissionsLabel: "الإغفالات",
    focusCommissionsLabel: "الاستجابات الخاطئة",
    focusVariabilityLabel: "التباين",
    focusAccuracyLabel: "الدقة",
    focusRetriesLabel: "المحاولات",
    focusTaskLabel: (n) => `المهمة ${n} – `,
    focusTask1Label: "المهمة 1 – الانتباه الانتقائي",
    focusTask2Label: "المهمة 2 – تثبيط Go / No-Go",
    focusTask3Label: "المهمة 3 – تسلسل الذاكرة العاملة",
    focusTask4Label: "المهمة 4 – التعليمات متعددة الخطوات",
    lockedLabel: "مقفل",

    // Math render task eyebrows / titles / helpers
    mathComparisonEyebrow: "مقارنة القيم",
    mathComparisonTitle: "قارن القيم الرمزية.",
    mathComparisonHelper: "تحافظ هذه المهمة على مقارنة الأحجام الرمزية ومنطق الحس العددي.",
    mathRepresentationEyebrow: "مطابقة التمثيلات",
    mathRepresentationTitle: "طابق التمثيل مع القيمة الصحيحة.",
    mathRepresentationHelper: "تحافظ هذه المهمة على منطق تطابق الرمز مع الكمية والتمثيل.",
    mathSequenceEyebrow: "منطق التسلسل",
    mathSequenceTitle: "اعثر على القيمة أو القاعدة التالية.",
    mathSequenceHelper: "تحافظ هذه المهمة على التفكير التسلسلي والنمطي بدلاً من الاسترجاع البسيط للحقائق.",

    // Support level labels (for trend/result panels)
    supportLevelLabels: {
      no_strong_concern:             "لا قلق بالغ",
      monitor:                       "متابعة",
      repeated_difficulty_indicator: "مؤشر صعوبة متكرر",
      support_review_recommended:    "يُنصح بمراجعة الدعم",
    },

    // Domain labels
    domainLabels: {
      attention:  "الانتباه والوظائف التنفيذية",
      reading:    "الوصول إلى القراءة",
      math:       "التفكير الرياضي",
      sensory:    "الراحة الحسية والصفية",
      engagement: "الانخراط في التعلم",
    },

    // Screener card metadata
    focusScreenerName: "فحص التركيز",
    focusScreenerDescription: "انتباه مستدام من نوع CPT، وتثبيط Go/No-Go، وتسلسل الذاكرة العاملة، ومتابعة التعليمات الأكاديمية متعددة الخطوات.",
    focusScreenerDuration: "٣-٥ دقائق",
    focusParadigm1: "انتباه مستدام من نوع CPT",
    focusParadigm2: "تثبيط Go/No-Go",
    focusParadigm3: "تسلسل الذاكرة العاملة",
    focusParadigm4: "معالجة التعليمات متعددة الخطوات",

    readingScreenerName: "فحص دعم القراءة",
    readingScreenerDescription: "فك الشفرة، والتعرف على الكلمات، والفهم، وإعادة بناء الجمل، ومقارنة النص فقط مقابل الدعم الصوتي.",
    readingScreenerDuration: "٣-٥ دقائق",
    readingParadigm1: "فك الشفرة والتعرف على الكلمات",
    readingParadigm2: "فهم القراءة",
    readingParadigm3: "إعادة بناء الجمل",
    readingParadigm4: "مقارنة النص فقط مقابل الدعم الصوتي",

    mathScreenerName: "فحص التفكير الرياضي",
    mathScreenerDescription: "المقارنة الرمزية، والحس العددي، ومطابقة التمثيلات، ومنطق التسلسل، والطلاقة الحسابية.",
    mathScreenerDuration: "٣-٥ دقائق",
    mathParadigm1: "مقارنة الأحجام الرمزية",
    mathParadigm2: "الحس العددي",
    mathParadigm3: "تطابق الرمز مع الكمية",
    mathParadigm4: "الطلاقة الحسابية",
    mathParadigm5: "التفكير التسلسلي",

    comfortScreenerName: "فحص الراحة",
    comfortScreenerDescription: "تقرير ذاتي حسي خاص مع مطابقة سياق الفصل للضوضاء والإضاءة والهواء وراحة التركيز.",
    comfortScreenerDuration: "١-٢ دقيقة",
    comfortParadigm1: "التقرير الذاتي الحسي",
    comfortParadigm2: "الفحص البيئي الواعي بالسياق",
    comfortParadigm3: "مؤشرات الراحة في الفصل",

    reflectionScreenerName: "التأمل في التعلم",
    reflectionScreenerDescription: "تقرير ذاتي عن الانخراط المدرسي مع محفزات حول التركيز والثقة والصعوبة وطلب المساعدة والجهد الذهني.",
    reflectionScreenerDuration: "٢-٣ دقائق",
    reflectionParadigm1: "التقرير الذاتي عن الانخراط المدرسي",
    reflectionParadigm2: "الضائقة الأكاديمية وطلب المساعدة",
    reflectionParadigm3: "فحص الدعم المدرسي المرحلي",

    // getTaskMeta labels — reading
    readingTask1Label: "المهمة 1 – التمييز بين الكلمات في السياق",
    readingTask2Label: "المهمة 2 – فهم مقطع قصير",
    readingTask3Label: "المهمة 3 – إعادة بناء الجملة",
    readingTask4Label: "المهمة 4 – مقارنة الوسيلة",

    // getTaskMeta labels — math
    mathTask1Label: "المهمة 1 – مقارنة القيم",
    mathTask2Label: "المهمة 2 – مطابقة التمثيلات",
    mathTask3Label: "المهمة 3 – منطق التسلسل",
    mathTask4Label: "المهمة 4 – طلاقة الحساب الذهني",

    // getTaskMeta labels — comfort
    comfortTask1Label: "الشاشة 1 – راحة الضوضاء",
    comfortTask2Label: "الشاشة 2 – راحة الإضاءة",
    comfortTask3Label: "الشاشة 3 – راحة الهواء والبيئة",
    comfortTask4Label: "الشاشة 4 – سهولة التركيز وتفضيل الدعم",

    // getTaskMeta labels — reflection
    reflectionTask1Label: "المحفز 1 – التركيز",
    reflectionTask2Label: "المحفز 2 – الثقة",
    reflectionTask3Label: "المحفز 3 – الصعوبة أو الشعور بالضياع",
    reflectionTask4Label: "المحفز 4 – تفضيل الدعم",
    reflectionTask5Label: "المحفز 5 – الجهد الذهني",

    // Indicator pill display labels (keyed by stored English indicator string)
    indicatorLabels: {
      "repeated attention difficulty indicators":                   "مؤشرات صعوبة انتباه متكررة",
      "difficulty sustaining performance across structured tasks":  "صعوبة الحفاظ على الأداء عبر المهام المنظمة",
      "difficulty handling multi-step academic instructions":       "صعوبة في متابعة التعليمات الأكاديمية متعددة الخطوات",
      "possible reading-access difficulty":                        "صعوبة محتملة في الوصول إلى القراءة",
      "repeated decoding or word-discrimination difficulty":        "صعوبة متكررة في فك الشفرة أو تمييز الكلمات",
      "possible math-processing difficulty":                       "صعوبة محتملة في معالجة الرياضيات",
      "repeated difficulty with symbolic numerical tasks":          "صعوبة متكررة في المهام العددية الرمزية",
      "repeated sensory discomfort indicators":                    "مؤشرات متكررة للانزعاج الحسي",
      "possible classroom overstimulation":                        "إفراط محتمل في التحفيز داخل الفصل",
      "repeated disengagement indicators":                         "مؤشرات انفصال متكررة",
      "repeated emotional strain indicators":                      "مؤشرات توتر عاطفي متكررة",
      "reading support may be beneficial":                         "قد يكون دعم القراءة مفيداً",
      "guided math support may help":                              "قد يساعد الدعم الرياضي الموجَّه",
      "environmental adjustment may help":                         "قد يساعد تعديل البيئة",
      "learner may benefit from additional support":               "قد يستفيد المتعلم من دعم إضافي",
    },

    // Suggested support action keys → display strings
    supportActionLabels: {
      "attention.chunk_instructions":    "تقديم تعليمات مقسَّمة ونسخة مرئية خطوة بخطوة للمتابعة.",
      "attention.support_review":        "النظر في مراجعة أنماط الانتباه المستدام والمتابعة في الفصل من قِبل فريق الدعم.",
      "attention.short_chunks":          "استخدام مهام أقصر وتسلسل خطوات مرئي للمراحل التالية أثناء المتابعة.",
      "reading.guided_decoding":         "تقديم قراءة بدعم صوتي، وتلميحات فك الشفرة الموجَّهة، وكتل قراءة أقصر.",
      "reading.monitor_comprehension":   "مراقبة الفهم وتقديم دعم القراءة الصوتية اختيارياً على النصوص الأكثر كثافة.",
      "math.worked_examples":            "استخدام أمثلة محلولة، ودعائم رمزية-بصرية، ومهام تجديد طلاقة قصيرة.",
      "math.monitor_symbolic":           "مراقبة حمل التفكير الرمزي وإضافة مثال موجَّه مختصر قبل العمل الاستقلالي.",
      "sensory.review_environment":      "مراجعة الجلوس والضوضاء والإضاءة وتقديم خيارات متابعة مبسَّطة للجلسة القادمة.",
      "sensory.monitor_comfort":         "مراقبة الراحة داخل الفصل وتقديم مسار متابعة أهدأ عند الحاجة.",
      "engagement.guided_followup":      "تقديم متابعة موجَّهة أقصر، وشرح إضافي، وخطة خطوات واضحة للمرحلة التالية.",
      "engagement.monitor_confidence":   "مراقبة أنماط الثقة وصعوبة الدروس عبر الجلسات القليلة القادمة.",
    },

    // Teacher metrics_summary key display labels
    metricsLabels: {
      omission_count:                     "الإغفالات",
      commission_count:                   "الاستجابات الخاطئة",
      response_time_variability_ms:       "تباين وقت الاستجابة (مللي ثانية)",
      performance_drop_percent:           "انخفاض الأداء (%)",
      multistep_score:                    "درجة متعددة الخطوات",
      word_accuracy_percent:              "دقة الكلمات (%)",
      comprehension_accuracy_percent:     "دقة الفهم (%)",
      modality_gap:                       "فجوة الوسيلة",
      skipped_items:                      "العناصر المتخطاة",
      symbolic_accuracy_percent:          "الدقة الرمزية (%)",
      visual_symbolic_gap:                "الفجوة البصرية-الرمزية",
      sequence_accuracy_percent:          "دقة التسلسل (%)",
      self_report_average:                "متوسط التقرير الذاتي",
      environment_match_score:            "درجة توافق البيئة",
      support_preference:                 "تفضيل الدعم",
      focus_rating:                       "تقييم التركيز",
      confidence_rating:                  "تقييم الثقة",
      difficulty_rating:                  "تقييم الصعوبة",
      preferred_support:                  "الدعم المفضَّل",
    },

    // Recommendation keys → display strings
    recommendationLabels: {
      "recommendation.support_review":            "يُوصى بمراجعة فريق الدعم.",
      "recommendation.high_score_monitor":        "لوحظ ارتفاع الدرجة الحالية. يُستمر في المتابعة حتى تتأسس أدلة متكررة.",
      "recommendation.monitor_repeated_patterns": "مراقبة الأنماط المتكررة والنظر في تعديلات دعم الفصل.",
      "recommendation.routine_monitoring":        "لا تصعيد عاجل. يُستمر في المتابعة الروتينية عند الاقتضاء.",
    },

    // English paradigm strings → localized display strings (for <pre> block)
    paradigmLabels: {
      "CPT-style sustained attention":                  "انتباه مستدام من نوع CPT",
      "Go/No-Go inhibition":                            "تثبيط Go/No-Go",
      "Working-memory sequencing":                      "تسلسل الذاكرة العاملة",
      "Multi-step instruction handling":                "معالجة التعليمات متعددة الخطوات",
      "Decoding and word recognition":                  "فك الشفرة والتعرف على الكلمات",
      "Reading comprehension":                          "فهم القراءة",
      "Sentence reconstruction":                        "إعادة بناء الجمل",
      "Text-only versus audio-supported comparison":    "مقارنة النص فقط مقابل الدعم الصوتي",
      "Symbolic magnitude comparison":                  "مقارنة الأحجام الرمزية",
      "Number sense":                                   "الحس العددي",
      "Symbol-quantity mapping":                        "تطابق الرمز مع الكمية",
      "Arithmetic fluency":                             "الطلاقة الحسابية",
      "Sequence reasoning":                             "التفكير التسلسلي",
      "Sensory self-report":                            "التقرير الذاتي الحسي",
      "Context-aware environmental screening":          "الفحص البيئي الواعي بالسياق",
      "Classroom comfort indicators":                   "مؤشرات الراحة في الفصل",
      "School engagement self-report":                  "التقرير الذاتي عن الانخراط المدرسي",
      "Academic distress and help-seeking":             "الضائقة الأكاديمية وطلب المساعدة",
      "Staged school-based support screening":          "فحص الدعم المدرسي المرحلي",
    },

    // Generic student-safe feedback (per domain, non-diagnostic)
    genericStudentFeedback: {
      attention: [
        "شكراً. هذا يساعد في تخصيص دعمك.",
        "وضع التركيز متاح لنشاطك القادم.",
        "يمكن تقديم نسخة خطوة بخطوة في المرة القادمة.",
      ],
      reading: [
        "شكراً. هذا يساعد في تخصيص دعمك.",
        "القراءة بدعم صوتي يمكن تقديمها في المرة القادمة.",
        "تتوفر ممارسة إضافية موجّهة في القراءة.",
      ],
      math: [
        "شكراً. هذا يساعد في تخصيص دعمك.",
        "تتوفر ممارسة إضافية موجّهة.",
        "يمكن تقديم أمثلة محلولة في المرة القادمة.",
      ],
      sensory: [
        "شكراً. هذا يساعد في تخصيص دعمك.",
        "يمكن تقديم متابعة أكثر هدوءاً أو بساطةً في المرة القادمة.",
        "يمكن تعديل إعدادات الراحة عند الحاجة.",
      ],
      engagement: [
        "شكراً. هذا يساعد في تخصيص دعمك.",
        "يمكن تقديم نسخة خطوة بخطوة في المرة القادمة.",
        "يمكن إعداد شرح إضافي للدرس القادم.",
      ],
    },

    // Screener-specific conditional student feedback strings
    studentFeedbackThanks: "شكراً. هذا يساعد في تخصيص دعمك.",
    studentFeedbackStepByStep: "يمكن تقديم نسخة خطوة بخطوة في المرة القادمة.",
    studentFeedbackFocusMode: "وضع التركيز متاح لنشاطك القادم.",
    studentFeedbackExtraExplanation: "يمكن إعداد شرح إضافي أو ممارسة موجّهة للدرس القادم.",
  },
};

/**
 * Get the label map for a given language.
 * Falls back to "en" for unsupported languages.
 *
 * @param {string} language - "en" | "fr" | "ar"
 * @returns {object}        - Label map with string values and function helpers
 */
function getLabels(language) {
  return LABELS[language] || LABELS["en"];
}

/**
 * Check if a language is RTL.
 * @param {string} language
 * @returns {boolean}
 */
function isRTL(language) {
  return language === "ar";
}

export { getLabels, isRTL, LABELS };
