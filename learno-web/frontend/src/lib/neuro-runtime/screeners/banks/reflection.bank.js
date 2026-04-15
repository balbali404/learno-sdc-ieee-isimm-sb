/**
 * reflection.bank.js
 *
 * Item banks for the Learning Reflection screener.
 * 5 engagement constructs are fixed across levels; only wording nuance varies.
 * Each construct has 2 phrasings (a=standard, b=variant) × 4 levels × 3 languages.
 *
 * Constructs: focus, confidence, difficulty, support, effort
 */

// ─── FOCUS PROMPT POOL ────────────────────────────────────────────────────────

export const FOCUS_PROMPT_POOL = [
  // ── EARLY ────────────────────────────────────────────────────────────────
  {
    id: "focus-early-a",
    level: "early",
    content: {
      en: {
        title: "Were you able to pay attention during the lesson?",
        helper: "Tell us if it was easy or hard to listen and follow along.",
      },
      fr: {
        title: "As-tu réussi à faire attention pendant la leçon ?",
        helper: "Dis-nous si c'était facile ou difficile d'écouter et de suivre.",
      },
      ar: {
        title: "هل استطعت الانتباه خلال الدرس؟",
        helper: "أخبرنا إذا كان من السهل أو الصعب الاستماع والمتابعة.",
      },
    },
  },
  {
    id: "focus-early-b",
    level: "early",
    content: {
      en: {
        title: "How well could you keep your mind on the lesson today?",
        helper: "Choose the answer that best describes how focused you felt.",
      },
      fr: {
        title: "À quel point pouvais-tu garder ton attention sur la leçon aujourd'hui ?",
        helper: "Choisis la réponse qui décrit le mieux ton niveau de concentration.",
      },
      ar: {
        title: "إلى أيّ مدى استطعت إبقاء تفكيرك على الدرس اليوم؟",
        helper: "اختر الإجابة التي تصف مستوى تركيزك بشكل أفضل.",
      },
    },
  },
  // ── MIDDLE ───────────────────────────────────────────────────────────────
  {
    id: "focus-middle-a",
    level: "middle",
    content: {
      en: {
        title: "How focused were you during this lesson?",
        helper: "This stays in school-support language and does not generate a diagnosis label.",
      },
      fr: {
        title: "Dans quelle mesure étais-tu concentré pendant cette leçon ?",
        helper: "Cela reste dans un langage de soutien scolaire et ne génère pas d'étiquette de diagnostic.",
      },
      ar: {
        title: "ما مدى تركيزك خلال هذا الدرس؟",
        helper: "يبقى هذا في لغة الدعم المدرسي ولا يُولّد تسمية تشخيصية.",
      },
    },
  },
  {
    id: "focus-middle-b",
    level: "middle",
    content: {
      en: {
        title: "How well did you manage to stay focused throughout this lesson?",
        helper: "Think about moments you felt engaged versus distracted.",
      },
      fr: {
        title: "Dans quelle mesure as-tu réussi à rester concentré tout au long de cette leçon ?",
        helper: "Pense aux moments où tu te sentais engagé par rapport aux moments de distraction.",
      },
      ar: {
        title: "كم نجحت في البقاء مركّزاً طوال هذا الدرس؟",
        helper: "فكّر في اللحظات التي شعرت فيها بالانخراط مقابل التشتت.",
      },
    },
  },
  // ── SECONDARY ────────────────────────────────────────────────────────────
  {
    id: "focus-secondary-a",
    level: "secondary",
    content: {
      en: {
        title: "How would you rate your level of focus and attention during this session?",
        helper: "Consider both sustained attention and moments where you lost focus.",
      },
      fr: {
        title: "Comment évalueriez-vous votre niveau de concentration et d'attention pendant cette séance ?",
        helper: "Tenez compte de l'attention soutenue et des moments où vous avez perdu le fil.",
      },
      ar: {
        title: "كيف تقيّم مستوى تركيزك وانتباهك خلال هذه الجلسة؟",
        helper: "ضع في اعتبارك الانتباه المستدام واللحظات التي فقدت فيها التركيز.",
      },
    },
  },
  {
    id: "focus-secondary-b",
    level: "secondary",
    content: {
      en: {
        title: "To what extent were you able to maintain attention on the lesson content throughout?",
        helper: "Rate any difficulties with distraction, mind-wandering, or disengagement.",
      },
      fr: {
        title: "Dans quelle mesure avez-vous pu maintenir l'attention sur le contenu du cours tout au long de la séance ?",
        helper: "Évaluez toute difficulté liée à la distraction, à l'esprit vagabond ou au désengagement.",
      },
      ar: {
        title: "إلى أيّ مدى استطعت الحفاظ على الانتباه لمحتوى الدرس طوال الجلسة؟",
        helper: "قيّم أيّ صعوبات مع التشتت أو الشرود الذهني أو عدم الانخراط.",
      },
    },
  },
  // ── ADVANCED ─────────────────────────────────────────────────────────────
  {
    id: "focus-advanced-a",
    level: "advanced",
    content: {
      en: {
        title: "How effectively were you able to direct and sustain focused attention on the session content?",
        helper: "Reflect on attentional control, cognitive engagement, and any internal or external disruptions.",
      },
      fr: {
        title: "Dans quelle mesure avez-vous pu diriger et maintenir une attention focalisée sur le contenu de la séance ?",
        helper: "Réfléchissez au contrôle attentionnel, à l'engagement cognitif et aux perturbations internes ou externes.",
      },
      ar: {
        title: "كم نجحت في توجيه الانتباه المركّز والحفاظ عليه على محتوى الجلسة؟",
        helper: "تأمّل في التحكم بالانتباه والانخراط المعرفي وأيّ اضطرابات داخلية أو خارجية.",
      },
    },
  },
  {
    id: "focus-advanced-b",
    level: "advanced",
    content: {
      en: {
        title: "Evaluate the quality of your attentional engagement during this session, including any periods of cognitive drift.",
        helper: "Consider meta-cognitive awareness of your own focus patterns and their impact on learning.",
      },
      fr: {
        title: "Évaluez la qualité de votre engagement attentionnel pendant cette séance, y compris les éventuelles périodes de dérive cognitive.",
        helper: "Tenez compte de la conscience méta-cognitive de vos propres schémas d'attention et de leur impact sur l'apprentissage.",
      },
      ar: {
        title: "قيّم جودة انخراطك الانتباهي خلال هذه الجلسة، بما في ذلك أيّ فترات من الانجراف المعرفي.",
        helper: "ضع في اعتبارك الوعي ما وراء المعرفي بأنماط انتباهك الخاصة وتأثيرها على التعلم.",
      },
    },
  },
];

// ─── CONFIDENCE PROMPT POOL ───────────────────────────────────────────────────

export const CONFIDENCE_PROMPT_POOL = [
  // ── EARLY ────────────────────────────────────────────────────────────────
  {
    id: "confidence-early-a",
    level: "early",
    content: {
      en: {
        title: "Do you feel like you understood the lesson?",
        helper: "Tell us if you feel good, okay, or unsure about what you learned.",
      },
      fr: {
        title: "As-tu l'impression d'avoir compris la leçon ?",
        helper: "Dis-nous si tu te sens bien, correct ou incertain par rapport à ce que tu as appris.",
      },
      ar: {
        title: "هل تشعر أنك فهمت الدرس؟",
        helper: "أخبرنا إذا كنت تشعر بشكل جيد أو مقبول أو غير متأكد مما تعلمته.",
      },
    },
  },
  {
    id: "confidence-early-b",
    level: "early",
    content: {
      en: {
        title: "How sure do you feel about what you learned today?",
        helper: "Choose the answer that shows how confident you are.",
      },
      fr: {
        title: "À quel point es-tu sûr de ce que tu as appris aujourd'hui ?",
        helper: "Choisis la réponse qui montre ton niveau de confiance.",
      },
      ar: {
        title: "كم أنت متأكد مما تعلمته اليوم؟",
        helper: "اختر الإجابة التي تُظهر مستوى ثقتك.",
      },
    },
  },
  // ── MIDDLE ───────────────────────────────────────────────────────────────
  {
    id: "confidence-middle-a",
    level: "middle",
    content: {
      en: {
        title: "How confident do you feel about this topic now?",
        helper: "Low-confidence patterns can help shape future support.",
      },
      fr: {
        title: "Dans quelle mesure te sens-tu confiant sur ce sujet maintenant ?",
        helper: "Les schémas de faible confiance peuvent aider à orienter le soutien futur.",
      },
      ar: {
        title: "كم تشعر بالثقة حول هذا الموضوع الآن؟",
        helper: "يمكن لأنماط انخفاض الثقة أن تساعد في تشكيل الدعم المستقبلي.",
      },
    },
  },
  {
    id: "confidence-middle-b",
    level: "middle",
    content: {
      en: {
        title: "How well do you feel you grasp the main ideas from this lesson?",
        helper: "Rate how clear the material feels to you right now.",
      },
      fr: {
        title: "Dans quelle mesure penses-tu comprendre les idées principales de cette leçon ?",
        helper: "Évalue à quel point le contenu te semble clair en ce moment.",
      },
      ar: {
        title: "كم تشعر أنك استوعبت الأفكار الرئيسية من هذا الدرس؟",
        helper: "قيّم مدى وضوح المادة بالنسبة لك الآن.",
      },
    },
  },
  // ── SECONDARY ────────────────────────────────────────────────────────────
  {
    id: "confidence-secondary-a",
    level: "secondary",
    content: {
      en: {
        title: "How confident do you feel in your understanding of the material covered in this session?",
        helper: "Low confidence may indicate areas that need review or additional support.",
      },
      fr: {
        title: "Dans quelle mesure vous sentez-vous confiant dans votre compréhension du contenu de cette séance ?",
        helper: "Une faible confiance peut indiquer des domaines nécessitant révision ou soutien supplémentaire.",
      },
      ar: {
        title: "كم تشعر بالثقة في فهمك للمادة التي تمت تغطيتها في هذه الجلسة؟",
        helper: "قد تشير الثقة المنخفضة إلى مجالات تحتاج إلى مراجعة أو دعم إضافي.",
      },
    },
  },
  {
    id: "confidence-secondary-b",
    level: "secondary",
    content: {
      en: {
        title: "Rate your confidence in applying or explaining the key concepts from this lesson.",
        helper: "Consider both conceptual understanding and your ability to use the knowledge independently.",
      },
      fr: {
        title: "Évaluez votre confiance pour appliquer ou expliquer les concepts clés de cette leçon.",
        helper: "Tenez compte de la compréhension conceptuelle et de votre capacité à utiliser les connaissances de manière autonome.",
      },
      ar: {
        title: "قيّم ثقتك في تطبيق أو شرح المفاهيم الأساسية من هذا الدرس.",
        helper: "ضع في اعتبارك الفهم المفاهيمي وقدرتك على استخدام المعرفة باستقلالية.",
      },
    },
  },
  // ── ADVANCED ─────────────────────────────────────────────────────────────
  {
    id: "confidence-advanced-a",
    level: "advanced",
    content: {
      en: {
        title: "How would you assess your conceptual confidence and depth of understanding following this session?",
        helper: "Reflect on areas of uncertainty, gaps in reasoning, and your readiness to apply or extend the material.",
      },
      fr: {
        title: "Comment évalueriez-vous votre confiance conceptuelle et la profondeur de votre compréhension à l'issue de cette séance ?",
        helper: "Réfléchissez aux zones d'incertitude, aux lacunes dans le raisonnement et à votre capacité à appliquer ou approfondir la matière.",
      },
      ar: {
        title: "كيف تقيّم ثقتك المفاهيمية وعمق فهمك في أعقاب هذه الجلسة؟",
        helper: "تأمّل في مجالات عدم اليقين والثغرات في التفكير ومدى استعدادك لتطبيق المادة أو توسيعها.",
      },
    },
  },
  {
    id: "confidence-advanced-b",
    level: "advanced",
    content: {
      en: {
        title: "Evaluate your readiness to independently analyse, apply, or synthesise the concepts from this session.",
        helper: "Consider knowledge gaps, areas requiring further reading, and your overall academic confidence.",
      },
      fr: {
        title: "Évaluez votre capacité à analyser, appliquer ou synthétiser de manière autonome les concepts de cette séance.",
        helper: "Tenez compte des lacunes de connaissances, des domaines nécessitant des lectures supplémentaires et de votre confiance académique globale.",
      },
      ar: {
        title: "قيّم استعدادك لتحليل وتطبيق وتركيب مفاهيم هذه الجلسة باستقلالية.",
        helper: "ضع في اعتبارك فجوات المعرفة والمجالات التي تتطلب قراءات إضافية وثقتك الأكاديمية الإجمالية.",
      },
    },
  },
];

// ─── DIFFICULTY PROMPT POOL ───────────────────────────────────────────────────

export const DIFFICULTY_PROMPT_POOL = [
  // ── EARLY ────────────────────────────────────────────────────────────────
  {
    id: "difficulty-early-a",
    level: "early",
    content: {
      en: {
        title: "Was the lesson hard or did any part feel confusing?",
        helper: "Tell us if anything felt too tricky or hard to understand.",
      },
      fr: {
        title: "La leçon était-elle difficile ou une partie t'a-t-elle semblé confuse ?",
        helper: "Dis-nous si quelque chose te semblait trop difficile ou difficile à comprendre.",
      },
      ar: {
        title: "هل كان الدرس صعباً أو شعرت بارتباك في أيّ جزء منه؟",
        helper: "أخبرنا إذا كان أيّ شيء يبدو صعباً جداً أو يصعب فهمه.",
      },
    },
  },
  {
    id: "difficulty-early-b",
    level: "early",
    content: {
      en: {
        title: "Did you feel lost or stuck at any point during the lesson?",
        helper: "It's okay to say yes — this helps us find ways to help you.",
      },
      fr: {
        title: "T'es-tu senti perdu ou bloqué à un moment de la leçon ?",
        helper: "C'est normal de dire oui — cela nous aide à trouver des façons de t'aider.",
      },
      ar: {
        title: "هل شعرت بالضياع أو التوقف في أيّ لحظة خلال الدرس؟",
        helper: "لا بأس بقول نعم — هذا يساعدنا على إيجاد طرق لمساعدتك.",
      },
    },
  },
  // ── MIDDLE ───────────────────────────────────────────────────────────────
  {
    id: "difficulty-middle-a",
    level: "middle",
    content: {
      en: {
        title: "How difficult did this lesson feel, or did you feel lost at any point?",
        helper: "Choose the option that fits best overall.",
      },
      fr: {
        title: "Dans quelle mesure cette leçon t'a-t-elle semblé difficile, ou t'es-tu senti perdu à un moment ?",
        helper: "Choisis l'option qui correspond le mieux à ton ressenti global.",
      },
      ar: {
        title: "كم بدا هذا الدرس صعباً، أو هل شعرت بالضياع في أيّ لحظة؟",
        helper: "اختر الخيار الذي يناسب شعورك العام بشكل أفضل.",
      },
    },
  },
  {
    id: "difficulty-middle-b",
    level: "middle",
    content: {
      en: {
        title: "Were there parts of this lesson that felt overwhelming or hard to follow?",
        helper: "Honest feedback helps us adjust future sessions to better fit your needs.",
      },
      fr: {
        title: "Y avait-il des parties de cette leçon qui semblaient accablantes ou difficiles à suivre ?",
        helper: "Des retours honnêtes nous aident à ajuster les prochaines séances à tes besoins.",
      },
      ar: {
        title: "هل كانت هناك أجزاء من هذا الدرس بدت مثقلة أو صعبة المتابعة؟",
        helper: "تساعدنا التعليقات الصادقة على تعديل الجلسات المستقبلية لتلائم احتياجاتك بشكل أفضل.",
      },
    },
  },
  // ── SECONDARY ────────────────────────────────────────────────────────────
  {
    id: "difficulty-secondary-a",
    level: "secondary",
    content: {
      en: {
        title: "How difficult did you find this session overall, and were there points where you felt cognitively lost?",
        helper: "Rate the challenge level and any moments of confusion or cognitive overload.",
      },
      fr: {
        title: "Dans quelle mesure avez-vous trouvé cette séance difficile dans l'ensemble, et y avait-il des moments où vous vous sentiez perdu cognitivement ?",
        helper: "Évaluez le niveau de défi et les éventuels moments de confusion ou de surcharge cognitive.",
      },
      ar: {
        title: "كم وجدت هذه الجلسة صعبة بشكل عام، وهل كانت هناك لحظات شعرت فيها بالضياع المعرفي؟",
        helper: "قيّم مستوى التحدي وأيّ لحظات من الارتباك أو الحمل المعرفي الزائد.",
      },
    },
  },
  {
    id: "difficulty-secondary-b",
    level: "secondary",
    content: {
      en: {
        title: "Identify the degree to which content complexity or pacing created difficulty for you during this lesson.",
        helper: "Specify whether difficulty was conceptual, procedural, or related to lesson speed.",
      },
      fr: {
        title: "Identifiez le degré auquel la complexité du contenu ou le rythme vous a posé des difficultés pendant cette leçon.",
        helper: "Précisez si la difficulté était conceptuelle, procédurale ou liée à la vitesse du cours.",
      },
      ar: {
        title: "حدّد الدرجة التي خلقت بها تعقيد المحتوى أو وتيرة الدرس صعوبة لك.",
        helper: "حدّد ما إذا كانت الصعوبة مفاهيمية أو إجرائية أو مرتبطة بسرعة الدرس.",
      },
    },
  },
  // ── ADVANCED ─────────────────────────────────────────────────────────────
  {
    id: "difficulty-advanced-a",
    level: "advanced",
    content: {
      en: {
        title: "How would you characterise the cognitive demand of this session and any points where understanding broke down?",
        helper: "Reflect on conceptual gaps, reasoning difficulties, and the degree of intellectual challenge encountered.",
      },
      fr: {
        title: "Comment caractériseriez-vous la demande cognitive de cette séance et les points où la compréhension a échoué ?",
        helper: "Réfléchissez aux lacunes conceptuelles, aux difficultés de raisonnement et au degré de défi intellectuel rencontré.",
      },
      ar: {
        title: "كيف تصف العبء المعرفي لهذه الجلسة وأيّ نقاط توقف فيها الفهم؟",
        helper: "تأمّل في الثغرات المفاهيمية وصعوبات التفكير ودرجة التحدي الفكري الذي واجهته.",
      },
    },
  },
  {
    id: "difficulty-advanced-b",
    level: "advanced",
    content: {
      en: {
        title: "Evaluate the extent to which this session's content challenged your existing knowledge structures and required effortful processing.",
        helper: "Consider desirable difficulty, knowledge integration challenges, and areas requiring follow-up study.",
      },
      fr: {
        title: "Évaluez dans quelle mesure le contenu de cette séance a remis en question vos structures de connaissances existantes et nécessité un traitement laborieux.",
        helper: "Tenez compte de la difficulté souhaitable, des défis d'intégration des connaissances et des domaines nécessitant une étude de suivi.",
      },
      ar: {
        title: "قيّم مدى تحدي محتوى هذه الجلسة لبنياتك المعرفية الحالية واقتضائه معالجة مجهدة.",
        helper: "ضع في اعتبارك الصعوبة المرغوبة وتحديات دمج المعرفة والمجالات التي تتطلب دراسة متابعة.",
      },
    },
  },
];

// ─── SUPPORT PROMPT POOL ──────────────────────────────────────────────────────

export const SUPPORT_PROMPT_POOL = [
  // ── EARLY ────────────────────────────────────────────────────────────────
  {
    id: "support-early-a",
    level: "early",
    content: {
      en: {
        title: "What would make the next lesson easier for you?",
        helper: "Pick the one that would help you the most.",
      },
      fr: {
        title: "Qu'est-ce qui rendrait la prochaine leçon plus facile pour toi ?",
        helper: "Choisis celui qui t'aiderait le plus.",
      },
      ar: {
        title: "ما الذي سيجعل الدرس القادم أسهل بالنسبة لك؟",
        helper: "اختر الخيار الذي سيساعدك أكثر.",
      },
    },
  },
  {
    id: "support-early-b",
    level: "early",
    content: {
      en: {
        title: "Which type of help would you most like for next time?",
        helper: "There are no wrong answers — just tell us what would help you.",
      },
      fr: {
        title: "Quel type d'aide aimerais-tu le plus pour la prochaine fois ?",
        helper: "Il n'y a pas de mauvaises réponses — dis-nous simplement ce qui t'aiderait.",
      },
      ar: {
        title: "أيّ نوع من المساعدة تريده أكثر للمرة القادمة؟",
        helper: "لا توجد إجابات خاطئة — أخبرنا فقط بما سيساعدك.",
      },
    },
  },
  // ── MIDDLE ───────────────────────────────────────────────────────────────
  {
    id: "support-middle-a",
    level: "middle",
    content: {
      en: {
        title: "What would help you most next time?",
        helper: "Choose the support that would make the next lesson or follow-up easier.",
      },
      fr: {
        title: "Qu'est-ce qui t'aiderait le plus la prochaine fois ?",
        helper: "Choisis le soutien qui rendrait la prochaine leçon ou le suivi plus facile.",
      },
      ar: {
        title: "ما الذي سيساعدك أكثر في المرة القادمة؟",
        helper: "اختر الدعم الذي سيجعل الدرس القادم أو المتابعة أسهل.",
      },
    },
  },
  {
    id: "support-middle-b",
    level: "middle",
    content: {
      en: {
        title: "Which type of support would be most useful for your next lesson or follow-up?",
        helper: "Your choice helps us personalise what comes next.",
      },
      fr: {
        title: "Quel type de soutien serait le plus utile pour ta prochaine leçon ou ton suivi ?",
        helper: "Ton choix nous aide à personnaliser ce qui suit.",
      },
      ar: {
        title: "أيّ نوع من الدعم سيكون أكثر فائدة لدرسك القادم أو متابعتك؟",
        helper: "يساعدنا اختيارك على تخصيص ما يأتي بعد ذلك.",
      },
    },
  },
  // ── SECONDARY ────────────────────────────────────────────────────────────
  {
    id: "support-secondary-a",
    level: "secondary",
    content: {
      en: {
        title: "Which type of academic support would most benefit your engagement with this topic going forward?",
        helper: "Your preference informs the type of follow-up preparation available to you.",
      },
      fr: {
        title: "Quel type de soutien académique bénéficierait le plus à votre engagement avec ce sujet à l'avenir ?",
        helper: "Votre préférence oriente le type de préparation de suivi qui vous sera proposé.",
      },
      ar: {
        title: "أيّ نوع من الدعم الأكاديمي سيفيد انخراطك مع هذا الموضوع إلى الأمام؟",
        helper: "تُوجّه تفضيلاتك نوع تحضير المتابعة المتاح لك.",
      },
    },
  },
  {
    id: "support-secondary-b",
    level: "secondary",
    content: {
      en: {
        title: "Select the support approach that would best address the difficulties you experienced in this session.",
        helper: "Your selection is used to prepare targeted follow-up resources.",
      },
      fr: {
        title: "Sélectionnez l'approche de soutien qui répondrait le mieux aux difficultés que vous avez rencontrées dans cette séance.",
        helper: "Votre sélection est utilisée pour préparer des ressources de suivi ciblées.",
      },
      ar: {
        title: "اختر نهج الدعم الذي سيعالج بشكل أفضل الصعوبات التي واجهتها في هذه الجلسة.",
        helper: "يُستخدم اختيارك لتحضير موارد متابعة مستهدفة.",
      },
    },
  },
  // ── ADVANCED ─────────────────────────────────────────────────────────────
  {
    id: "support-advanced-a",
    level: "advanced",
    content: {
      en: {
        title: "Which form of academic support would most effectively address gaps identified during this session?",
        helper: "Your response is used to prioritise follow-up resources aligned with your learning needs.",
      },
      fr: {
        title: "Quelle forme de soutien académique répondrait le plus efficacement aux lacunes identifiées pendant cette séance ?",
        helper: "Votre réponse est utilisée pour prioriser les ressources de suivi alignées sur vos besoins d'apprentissage.",
      },
      ar: {
        title: "أيّ شكل من أشكال الدعم الأكاديمي سيعالج بشكل أكثر فاعلية الثغرات المحددة خلال هذه الجلسة؟",
        helper: "تُستخدم إجابتك لتحديد أولويات موارد المتابعة المتوافقة مع احتياجاتك التعليمية.",
      },
    },
  },
  {
    id: "support-advanced-b",
    level: "advanced",
    content: {
      en: {
        title: "Identify the support modality most likely to address your current knowledge or skill gaps from this session.",
        helper: "Select based on your assessment of whether your difficulties are conceptual, applied, or procedural.",
      },
      fr: {
        title: "Identifiez la modalité de soutien la plus susceptible de combler vos lacunes actuelles de connaissances ou de compétences issues de cette séance.",
        helper: "Sélectionnez en fonction de votre évaluation de la nature conceptuelle, appliquée ou procédurale de vos difficultés.",
      },
      ar: {
        title: "حدّد نمط الدعم الأكثر احتمالاً لمعالجة فجوات معرفتك أو مهاراتك الحالية من هذه الجلسة.",
        helper: "اختر بناءً على تقييمك لما إذا كانت صعوباتك مفاهيمية أو تطبيقية أو إجرائية.",
      },
    },
  },
];

// ─── EFFORT PROMPT POOL ───────────────────────────────────────────────────────

export const EFFORT_PROMPT_POOL = [
  // ── EARLY ────────────────────────────────────────────────────────────────
  {
    id: "effort-early-a",
    level: "early",
    content: {
      en: {
        title: "Did your brain feel tired after this lesson?",
        helper: "Tell us if thinking hard made you feel worn out or fine.",
      },
      fr: {
        title: "Ton cerveau s'est-il senti fatigué après cette leçon ?",
        helper: "Dis-nous si réfléchir fort t'a épuisé ou si tu te sens bien.",
      },
      ar: {
        title: "هل شعر دماغك بالتعب بعد هذا الدرس؟",
        helper: "أخبرنا إذا كان التفكير بجد جعلك تشعر بالإرهاق أو بخير.",
      },
    },
  },
  {
    id: "effort-early-b",
    level: "early",
    content: {
      en: {
        title: "How tired did you feel from thinking during this lesson?",
        helper: "Choose the answer that matches how your brain felt.",
      },
      fr: {
        title: "À quel point te sentais-tu fatigué de réfléchir pendant cette leçon ?",
        helper: "Choisis la réponse qui correspond à ce que ton cerveau a ressenti.",
      },
      ar: {
        title: "كم شعرت بالإرهاق من التفكير خلال هذا الدرس؟",
        helper: "اختر الإجابة التي تتوافق مع ما شعر به دماغك.",
      },
    },
  },
  // ── MIDDLE ───────────────────────────────────────────────────────────────
  {
    id: "effort-middle-a",
    level: "middle",
    content: {
      en: {
        title: "How mentally tiring was this lesson?",
        helper: "This prompt supports non-diagnostic academic strain screening.",
      },
      fr: {
        title: "Dans quelle mesure cette leçon était-elle mentalement fatigante ?",
        helper: "Cette question soutient le dépistage non diagnostique de la tension académique.",
      },
      ar: {
        title: "كم كان هذا الدرس مرهقاً ذهنياً؟",
        helper: "يدعم هذا السؤال الفحص غير التشخيصي للضغط الأكاديمي.",
      },
    },
  },
  {
    id: "effort-middle-b",
    level: "middle",
    content: {
      en: {
        title: "How much mental energy did this lesson require?",
        helper: "High effort is not negative — it helps us plan the right follow-up.",
      },
      fr: {
        title: "Quelle quantité d'énergie mentale cette leçon a-t-elle nécessitée ?",
        helper: "Un effort élevé n'est pas négatif — cela nous aide à planifier le bon suivi.",
      },
      ar: {
        title: "كم من الطاقة الذهنية احتاجها هذا الدرس؟",
        helper: "الجهد العالي ليس سلبياً — يساعدنا على التخطيط للمتابعة المناسبة.",
      },
    },
  },
  // ── SECONDARY ────────────────────────────────────────────────────────────
  {
    id: "effort-secondary-a",
    level: "secondary",
    content: {
      en: {
        title: "How would you rate the mental effort required to engage with this session's content?",
        helper: "Rate cognitive fatigue experienced rather than difficulty of the material itself.",
      },
      fr: {
        title: "Comment évalueriez-vous l'effort mental requis pour vous engager avec le contenu de cette séance ?",
        helper: "Évaluez la fatigue cognitive ressentie plutôt que la difficulté du contenu en lui-même.",
      },
      ar: {
        title: "كيف تقيّم الجهد الذهني المطلوب للانخراط مع محتوى هذه الجلسة؟",
        helper: "قيّم الإجهاد المعرفي الذي شعرت به وليس صعوبة المادة نفسها.",
      },
    },
  },
  {
    id: "effort-secondary-b",
    level: "secondary",
    content: {
      en: {
        title: "To what extent did this session leave you feeling mentally drained or fatigued?",
        helper: "Consider the impact of sustained concentration, problem-solving, and information processing.",
      },
      fr: {
        title: "Dans quelle mesure cette séance vous a-t-elle laissé mentalement épuisé ou fatigué ?",
        helper: "Tenez compte de l'impact de la concentration soutenue, de la résolution de problèmes et du traitement de l'information.",
      },
      ar: {
        title: "إلى أيّ مدى جعلتك هذه الجلسة تشعر بالإرهاق الذهني أو التعب؟",
        helper: "ضع في اعتبارك تأثير التركيز المستدام وحل المشكلات ومعالجة المعلومات.",
      },
    },
  },
  // ── ADVANCED ─────────────────────────────────────────────────────────────
  {
    id: "effort-advanced-a",
    level: "advanced",
    content: {
      en: {
        title: "How would you assess the cognitive load and mental fatigue incurred during this session?",
        helper: "Reflect on working memory demand, reasoning intensity, and residual mental fatigue post-session.",
      },
      fr: {
        title: "Comment évalueriez-vous la charge cognitive et la fatigue mentale encourues pendant cette séance ?",
        helper: "Réfléchissez aux exigences de la mémoire de travail, à l'intensité du raisonnement et à la fatigue mentale résiduelle après la séance.",
      },
      ar: {
        title: "كيف تقيّم الحمل المعرفي والإجهاد الذهني المتراكم خلال هذه الجلسة؟",
        helper: "تأمّل في متطلبات الذاكرة العاملة وكثافة التفكير والإجهاد الذهني المتبقي بعد الجلسة.",
      },
    },
  },
  {
    id: "effort-advanced-b",
    level: "advanced",
    content: {
      en: {
        title: "Evaluate the degree to which sustained intellectual effort during this session impacted your cognitive resources and capacity for subsequent work.",
        helper: "Consider spill-over fatigue effects, metacognitive monitoring, and the balance between productive struggle and cognitive overload.",
      },
      fr: {
        title: "Évaluez dans quelle mesure l'effort intellectuel soutenu pendant cette séance a impacté vos ressources cognitives et votre capacité pour le travail ultérieur.",
        helper: "Tenez compte des effets de débordement de la fatigue, du suivi méta-cognitif et de l'équilibre entre la lutte productive et la surcharge cognitive.",
      },
      ar: {
        title: "قيّم الدرجة التي أثّر بها الجهد الفكري المستدام خلال هذه الجلسة على مواردك المعرفية وقدرتك على العمل اللاحق.",
        helper: "ضع في اعتبارك تأثيرات الإجهاد المتدفق والمراقبة ما وراء المعرفية والتوازن بين الكفاح المثمر والحمل المعرفي الزائد.",
      },
    },
  },
];

// ─── REFLECTION_PROMPTS_BANK aggregate (keyed by level) ──────────────────────

function _groupByLevel(pools) {
  const result = {};
  for (const pool of pools) {
    for (const item of pool) {
      const lvl = item.level;
      if (!result[lvl]) result[lvl] = { en: [], fr: [], ar: [] };
      for (const lang of ["en", "fr", "ar"]) {
        if (item.content[lang]) result[lvl][lang].push(item.content[lang]);
      }
    }
  }
  return result;
}

export const REFLECTION_PROMPTS_BANK = _groupByLevel([
  FOCUS_PROMPT_POOL,
  CONFIDENCE_PROMPT_POOL,
  DIFFICULTY_PROMPT_POOL,
  SUPPORT_PROMPT_POOL,
  EFFORT_PROMPT_POOL,
]);
