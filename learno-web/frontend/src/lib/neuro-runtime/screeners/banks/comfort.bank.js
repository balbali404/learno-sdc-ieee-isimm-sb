/**
 * comfort.bank.js
 *
 * Item banks for the Comfort Check screener.
 * 4 sensory constructs are fixed across levels; only wording depth varies.
 * Each construct has 2 phrasings (a=standard, b=variant) × 4 levels × 3 languages.
 *
 * Constructs: noise, light, air, concentration
 */

// ─── NOISE PROMPT POOL ────────────────────────────────────────────────────────

export const NOISE_PROMPT_POOL = [
  // ── EARLY ────────────────────────────────────────────────────────────────
  {
    id: "noise-early-a",
    level: "early",
    content: {
      en: {
        title: "Did the noise in the room make it hard to listen?",
        helper: "Think about loud sounds or lots of talking around you.",
      },
      fr: {
        title: "Est-ce que le bruit dans la salle t'a rendu difficile d'écouter ?",
        helper: "Pense aux sons forts ou aux bavardages autour de toi.",
      },
      ar: {
        title: "هل أزعجك الضجيج في الغرفة وجعل الاستماع صعباً؟",
        helper: "فكّر في الأصوات العالية أو الأحاديث الكثيرة من حولك.",
      },
    },
  },
  {
    id: "noise-early-b",
    level: "early",
    content: {
      en: {
        title: "Were there too many sounds that made it hard to pay attention?",
        helper: "This could be talking, outside noise, or other loud sounds.",
      },
      fr: {
        title: "Y avait-il trop de sons qui t'ont empêché de te concentrer ?",
        helper: "Cela peut être des bavardages, du bruit dehors ou d'autres sons forts.",
      },
      ar: {
        title: "هل كانت هناك أصوات كثيرة جعلت الانتباه صعباً؟",
        helper: "قد تكون أحاديث، أو أصواتاً من الخارج، أو أصواتاً عالية أخرى.",
      },
    },
  },
  // ── MIDDLE ───────────────────────────────────────────────────────────────
  {
    id: "noise-middle-a",
    level: "middle",
    content: {
      en: {
        title: "Did noise make it harder to focus today?",
        helper: "Private check-in. This helps match follow-up tasks to classroom comfort.",
      },
      fr: {
        title: "Le bruit a-t-il rendu la concentration plus difficile aujourd'hui ?",
        helper: "Bilan privé. Cela aide à adapter les tâches de suivi au confort en classe.",
      },
      ar: {
        title: "هل جعل الضجيج التركيز أصعب اليوم؟",
        helper: "تسجيل خاص. يساعد هذا على تخصيص مهام المتابعة حسب راحتك في الفصل.",
      },
    },
  },
  {
    id: "noise-middle-b",
    level: "middle",
    content: {
      en: {
        title: "How much did background noise affect your ability to concentrate?",
        helper: "Consider noise from other students, corridors, or outside the classroom.",
      },
      fr: {
        title: "Dans quelle mesure le bruit de fond a-t-il affecté ta capacité à te concentrer ?",
        helper: "Pense au bruit des autres élèves, des couloirs ou de l'extérieur de la classe.",
      },
      ar: {
        title: "كم أثّر الضجيج الخلفي على قدرتك على التركيز؟",
        helper: "فكّر في الضجيج من الطلاب الآخرين أو الممرات أو خارج الفصل.",
      },
    },
  },
  // ── SECONDARY ────────────────────────────────────────────────────────────
  {
    id: "noise-secondary-a",
    level: "secondary",
    content: {
      en: {
        title: "To what extent did ambient noise interfere with sustained attention during this session?",
        helper: "Consider background conversations, equipment sounds, and corridor noise.",
      },
      fr: {
        title: "Dans quelle mesure le bruit ambiant a-t-il interféré avec votre attention soutenue pendant cette séance ?",
        helper: "Tenez compte des conversations de fond, des bruits d'équipements et du couloir.",
      },
      ar: {
        title: "إلى أيّ مدى أعاق الضجيج المحيط الانتباه المستدام خلال هذه الجلسة؟",
        helper: "ضع في اعتبارك المحادثات الخلفية وأصوات المعدات وضجيج الممر.",
      },
    },
  },
  {
    id: "noise-secondary-b",
    level: "secondary",
    content: {
      en: {
        title: "Rate how much noise in the environment affected your concentration during the lesson.",
        helper: "Include any auditory distractions that pulled your attention away from the task.",
      },
      fr: {
        title: "Évaluez dans quelle mesure le bruit dans l'environnement a affecté votre concentration pendant le cours.",
        helper: "Incluez toute distraction auditive qui a détourné votre attention de la tâche.",
      },
      ar: {
        title: "قيّم مدى تأثير الضجيج في البيئة على تركيزك خلال الدرس.",
        helper: "اشمل أيّ مصادر تشتيت سمعي أبعدت انتباهك عن المهمة.",
      },
    },
  },
  // ── ADVANCED ─────────────────────────────────────────────────────────────
  {
    id: "noise-advanced-a",
    level: "advanced",
    content: {
      en: {
        title: "How significantly did auditory distractions impact your cognitive load during this session?",
        helper: "Reflect on any noise-related interference with reading, reasoning, or working memory.",
      },
      fr: {
        title: "Dans quelle mesure les distractions auditives ont-elles impacté votre charge cognitive pendant cette séance ?",
        helper: "Réfléchissez à toute interférence liée au bruit avec la lecture, le raisonnement ou la mémoire de travail.",
      },
      ar: {
        title: "كم أثّرت مصادر التشتيت السمعي على العبء المعرفي خلال هذه الجلسة؟",
        helper: "تأمّل في أيّ تداخل مرتبط بالضجيج مع القراءة أو التفكير أو الذاكرة العاملة.",
      },
    },
  },
  {
    id: "noise-advanced-b",
    level: "advanced",
    content: {
      en: {
        title: "Assess the degree to which environmental noise disrupted your ability to maintain focus during complex tasks.",
        helper: "Consider noise sensitivity in the context of analytical or synthesis-level work.",
      },
      fr: {
        title: "Évaluez le degré auquel le bruit ambiant a perturbé votre capacité à maintenir la concentration pendant des tâches complexes.",
        helper: "Considérez la sensibilité au bruit dans le contexte d'un travail analytique ou de synthèse.",
      },
      ar: {
        title: "قيّم الدرجة التي أعاق بها الضجيج البيئي قدرتك على الحفاظ على التركيز خلال المهام المعقدة.",
        helper: "ضع في الاعتبار الحساسية للضجيج في سياق العمل التحليلي أو التركيبي.",
      },
    },
  },
];

// ─── LIGHT PROMPT POOL ────────────────────────────────────────────────────────

export const LIGHT_PROMPT_POOL = [
  // ── EARLY ────────────────────────────────────────────────────────────────
  {
    id: "light-early-a",
    level: "early",
    content: {
      en: {
        title: "Was the light in the room okay for you?",
        helper: "Think about if it was too bright, too dark, or just right.",
      },
      fr: {
        title: "La lumière dans la salle était-elle correcte pour toi ?",
        helper: "Pense à si elle était trop forte, trop sombre ou juste bien.",
      },
      ar: {
        title: "هل كان الضوء في الغرفة مناسباً لك؟",
        helper: "فكّر في ما إذا كان شديداً جداً أو خافتاً جداً أو مناسباً.",
      },
    },
  },
  {
    id: "light-early-b",
    level: "early",
    content: {
      en: {
        title: "Did the brightness in the room hurt your eyes or make it hard to see?",
        helper: "Tell us if the light felt too strong or if the room was too dim.",
      },
      fr: {
        title: "La luminosité dans la salle t'a-t-elle fait mal aux yeux ou rendu difficile de voir ?",
        helper: "Dis-nous si la lumière était trop forte ou si la salle était trop sombre.",
      },
      ar: {
        title: "هل أزعج الضوء في الغرفة عينيك أو جعل الرؤية صعبة؟",
        helper: "أخبرنا إذا كان الضوء قوياً جداً أو كانت الغرفة معتمة جداً.",
      },
    },
  },
  // ── MIDDLE ───────────────────────────────────────────────────────────────
  {
    id: "light-middle-a",
    level: "middle",
    content: {
      en: {
        title: "Was the classroom lighting comfortable?",
        helper: "You can think about glare, brightness, or visual strain.",
      },
      fr: {
        title: "L'éclairage de la classe était-il confortable ?",
        helper: "Tu peux penser à l'éblouissement, la luminosité ou la fatigue visuelle.",
      },
      ar: {
        title: "هل كانت إضاءة الفصل مريحة؟",
        helper: "يمكنك التفكير في الوهج أو السطوع أو إجهاد البصر.",
      },
    },
  },
  {
    id: "light-middle-b",
    level: "middle",
    content: {
      en: {
        title: "Did the lighting conditions affect how easily you could read or work?",
        helper: "Consider screen glare, bright sunlight, or overly dim light.",
      },
      fr: {
        title: "Les conditions d'éclairage ont-elles affecté la facilité à lire ou travailler ?",
        helper: "Pense à l'éblouissement de l'écran, la lumière solaire forte ou un éclairage trop faible.",
      },
      ar: {
        title: "هل أثّرت ظروف الإضاءة على سهولة القراءة أو العمل؟",
        helper: "فكّر في الوهج من الشاشة أو ضوء الشمس الساطع أو الضوء الخافت.",
      },
    },
  },
  // ── SECONDARY ────────────────────────────────────────────────────────────
  {
    id: "light-secondary-a",
    level: "secondary",
    content: {
      en: {
        title: "How comfortable was the classroom lighting for reading and written tasks?",
        helper: "Rate any visual discomfort from glare, contrast issues, or insufficient light.",
      },
      fr: {
        title: "Dans quelle mesure l'éclairage de la classe était-il confortable pour la lecture et les travaux écrits ?",
        helper: "Évaluez tout inconfort visuel dû à l'éblouissement, aux problèmes de contraste ou à un éclairage insuffisant.",
      },
      ar: {
        title: "كم كانت إضاءة الفصل مريحة لأعمال القراءة والكتابة؟",
        helper: "قيّم أيّ إزعاج بصري ناتج عن الوهج أو مشكلات التباين أو الإضاءة غير الكافية.",
      },
    },
  },
  {
    id: "light-secondary-b",
    level: "secondary",
    content: {
      en: {
        title: "Did lighting conditions contribute to visual fatigue or difficulty sustaining focus?",
        helper: "Consider glare from windows or screens, uneven brightness, and eye strain.",
      },
      fr: {
        title: "Les conditions d'éclairage ont-elles contribué à la fatigue visuelle ou à la difficulté à maintenir la concentration ?",
        helper: "Pensez à l'éblouissement des fenêtres ou écrans, la luminosité inégale et la fatigue oculaire.",
      },
      ar: {
        title: "هل أسهمت ظروف الإضاءة في الإجهاد البصري أو صعوبة الحفاظ على التركيز؟",
        helper: "فكّر في الوهج من النوافذ أو الشاشات والسطوع غير المتساوي وإجهاد العيون.",
      },
    },
  },
  // ── ADVANCED ─────────────────────────────────────────────────────────────
  {
    id: "light-advanced-a",
    level: "advanced",
    content: {
      en: {
        title: "To what extent did lighting quality affect your visual processing and concentration during this session?",
        helper: "Consider luminance levels, glare, contrast, and their effect on reading or screen-based work.",
      },
      fr: {
        title: "Dans quelle mesure la qualité de l'éclairage a-t-elle affecté votre traitement visuel et votre concentration pendant cette séance ?",
        helper: "Tenez compte des niveaux de luminance, de l'éblouissement, du contraste et de leur effet sur la lecture ou le travail sur écran.",
      },
      ar: {
        title: "إلى أيّ مدى أثّرت جودة الإضاءة على معالجتك البصرية وتركيزك خلال هذه الجلسة؟",
        helper: "ضع في اعتبارك مستويات الإضاءة والوهج والتباين وأثرها على القراءة أو العمل على الشاشة.",
      },
    },
  },
  {
    id: "light-advanced-b",
    level: "advanced",
    content: {
      en: {
        title: "Evaluate whether light conditions in this environment supported or hindered your sustained cognitive performance.",
        helper: "Reflect on light-related factors such as flicker, glare, or luminance imbalance.",
      },
      fr: {
        title: "Évaluez si les conditions lumineuses dans cet environnement ont soutenu ou entravé vos performances cognitives soutenues.",
        helper: "Réfléchissez aux facteurs liés à la lumière tels que le scintillement, l'éblouissement ou le déséquilibre de luminance.",
      },
      ar: {
        title: "قيّم ما إذا كانت ظروف الإضاءة في هذه البيئة قد دعمت أو عرقلت أداءك المعرفي المستدام.",
        helper: "تأمّل في العوامل المرتبطة بالضوء كالوميض والوهج أو عدم توازن الإضاءة.",
      },
    },
  },
];

// ─── AIR PROMPT POOL ──────────────────────────────────────────────────────────

export const AIR_PROMPT_POOL = [
  // ── EARLY ────────────────────────────────────────────────────────────────
  {
    id: "air-early-a",
    level: "early",
    content: {
      en: {
        title: "Did the room feel stuffy or uncomfortable to be in?",
        helper: "Think about whether the air felt hot, stuffy, or made you feel sleepy.",
      },
      fr: {
        title: "La salle semblait-elle étouffante ou inconfortable ?",
        helper: "Pense à si l'air semblait chaud, étouffant ou te donnait envie de dormir.",
      },
      ar: {
        title: "هل شعرت بأن الغرفة خانقة أو غير مريحة؟",
        helper: "فكّر في ما إذا كان الهواء حاراً أو خانقاً أو جعلك تشعر بالنعاس.",
      },
    },
  },
  {
    id: "air-early-b",
    level: "early",
    content: {
      en: {
        title: "Was the air in the classroom hard to breathe or did it make you feel uncomfortable?",
        helper: "You can say if the room felt too hot, too cold, or hard to breathe in.",
      },
      fr: {
        title: "L'air en classe était-il difficile à respirer ou t'a-t-il rendu inconfortable ?",
        helper: "Tu peux dire si la salle semblait trop chaude, trop froide ou difficile à respirer.",
      },
      ar: {
        title: "هل كان هواء الفصل صعب التنفس أو جعلك تشعر بالانزعاج؟",
        helper: "يمكنك القول إذا كانت الغرفة حارة جداً أو باردة جداً أو صعبة التنفس.",
      },
    },
  },
  // ── MIDDLE ───────────────────────────────────────────────────────────────
  {
    id: "air-middle-a",
    level: "middle",
    content: {
      en: {
        title: "Did the classroom air or environment make concentration harder?",
        helper: "This includes air quality, room stuffiness, or general physical comfort.",
      },
      fr: {
        title: "L'air ou l'environnement de la classe a-t-il rendu la concentration plus difficile ?",
        helper: "Cela inclut la qualité de l'air, la sensation d'étouffement ou le confort physique général.",
      },
      ar: {
        title: "هل جعل هواء الفصل أو بيئته التركيز أصعب؟",
        helper: "يشمل ذلك جودة الهواء أو الشعور بالاختناق أو الراحة الجسدية العامة.",
      },
    },
  },
  {
    id: "air-middle-b",
    level: "middle",
    content: {
      en: {
        title: "How did the air quality and physical environment of the classroom affect your focus?",
        helper: "Consider temperature, stuffiness, ventilation, and physical comfort.",
      },
      fr: {
        title: "Comment la qualité de l'air et l'environnement physique de la classe ont-ils affecté ta concentration ?",
        helper: "Pense à la température, l'étouffement, la ventilation et le confort physique.",
      },
      ar: {
        title: "كيف أثّرت جودة الهواء والبيئة المادية للفصل على تركيزك؟",
        helper: "فكّر في درجة الحرارة والاختناق والتهوية والراحة الجسدية.",
      },
    },
  },
  // ── SECONDARY ────────────────────────────────────────────────────────────
  {
    id: "air-secondary-a",
    level: "secondary",
    content: {
      en: {
        title: "Did air quality or environmental conditions in the classroom affect your ability to concentrate?",
        helper: "Consider CO₂ levels, stuffiness, temperature, and their impact on alertness.",
      },
      fr: {
        title: "La qualité de l'air ou les conditions environnementales en classe ont-elles affecté votre capacité à vous concentrer ?",
        helper: "Tenez compte des niveaux de CO₂, de l'étouffement, de la température et de leur impact sur la vigilance.",
      },
      ar: {
        title: "هل أثّرت جودة الهواء أو الظروف البيئية في الفصل على قدرتك على التركيز؟",
        helper: "ضع في اعتبارك مستويات ثاني أكسيد الكربون والاختناق ودرجة الحرارة وتأثيرها على اليقظة.",
      },
    },
  },
  {
    id: "air-secondary-b",
    level: "secondary",
    content: {
      en: {
        title: "Rate the impact of the physical environment (air, temperature, ventilation) on your alertness and focus.",
        helper: "Include any discomfort from poor ventilation, heat, or cramped conditions.",
      },
      fr: {
        title: "Évaluez l'impact de l'environnement physique (air, température, ventilation) sur votre vigilance et votre concentration.",
        helper: "Incluez tout inconfort dû à une mauvaise ventilation, à la chaleur ou aux conditions d'espace restreint.",
      },
      ar: {
        title: "قيّم تأثير البيئة المادية (الهواء، درجة الحرارة، التهوية) على يقظتك وتركيزك.",
        helper: "اشمل أيّ انزعاج من ضعف التهوية أو الحرارة أو ضيق المساحة.",
      },
    },
  },
  // ── ADVANCED ─────────────────────────────────────────────────────────────
  {
    id: "air-advanced-a",
    level: "advanced",
    content: {
      en: {
        title: "How significantly did environmental air quality and thermal comfort influence your cognitive performance during this session?",
        helper: "Reflect on factors such as CO₂ accumulation, humidity, temperature regulation, and ventilation.",
      },
      fr: {
        title: "Dans quelle mesure la qualité de l'air et le confort thermique ont-ils influencé vos performances cognitives pendant cette séance ?",
        helper: "Réfléchissez à des facteurs tels que l'accumulation de CO₂, l'humidité, la régulation de la température et la ventilation.",
      },
      ar: {
        title: "كم أثّرت جودة الهواء البيئي وراحة الحرارة على أدائك المعرفي خلال هذه الجلسة؟",
        helper: "تأمّل في عوامل مثل تراكم ثاني أكسيد الكربون والرطوبة وتنظيم الحرارة والتهوية.",
      },
    },
  },
  {
    id: "air-advanced-b",
    level: "advanced",
    content: {
      en: {
        title: "Evaluate to what extent environmental stressors (air quality, temperature, space) affected your sustained attention capacity.",
        helper: "Consider physiological comfort in relation to cognitive load and task persistence.",
      },
      fr: {
        title: "Évaluez dans quelle mesure les facteurs de stress environnementaux (qualité de l'air, température, espace) ont affecté votre capacité d'attention soutenue.",
        helper: "Considérez le confort physiologique par rapport à la charge cognitive et la persistance des tâches.",
      },
      ar: {
        title: "قيّم إلى أيّ مدى أثّرت الضغوط البيئية (جودة الهواء، الحرارة، المساحة) على قدرتك على الانتباه المستدام.",
        helper: "ضع في اعتبارك الراحة الفيزيولوجية بالنسبة للعبء المعرفي ومثابرة المهمة.",
      },
    },
  },
];

// ─── CONCENTRATION PROMPT POOL ────────────────────────────────────────────────

export const CONCENTRATION_PROMPT_POOL = [
  // ── EARLY ────────────────────────────────────────────────────────────────
  {
    id: "concentration-early-a",
    level: "early",
    content: {
      en: {
        title: "Was it easy to stay calm and keep thinking during the lesson?",
        helper: "Tell us what would make the next lesson easier for you.",
      },
      fr: {
        title: "Était-il facile de rester calme et de continuer à réfléchir pendant la leçon ?",
        helper: "Dis-nous ce qui rendrait la prochaine leçon plus facile pour toi.",
      },
      ar: {
        title: "هل كان من السهل البقاء هادئاً والاستمرار في التفكير خلال الدرس؟",
        helper: "أخبرنا بما سيجعل الدرس القادم أسهل بالنسبة لك.",
      },
    },
  },
  {
    id: "concentration-early-b",
    level: "early",
    content: {
      en: {
        title: "How easy was it to keep paying attention and not get distracted?",
        helper: "Choose what would help you do better next time.",
      },
      fr: {
        title: "Dans quelle mesure était-il facile de continuer à faire attention sans être distrait ?",
        helper: "Choisis ce qui t'aiderait à mieux faire la prochaine fois.",
      },
      ar: {
        title: "كم كان من السهل الاستمرار في الانتباه وعدم التشتت؟",
        helper: "اختر ما سيساعدك على الأداء بشكل أفضل في المرة القادمة.",
      },
    },
  },
  // ── MIDDLE ───────────────────────────────────────────────────────────────
  {
    id: "concentration-middle-a",
    level: "middle",
    content: {
      en: {
        title: "How easy was it to stay calm and focused, and what would help next time?",
        helper: "Choose the support that would make the next follow-up easier.",
      },
      fr: {
        title: "Dans quelle mesure était-il facile de rester calme et concentré, et qu'est-ce qui aiderait la prochaine fois ?",
        helper: "Choisis le soutien qui rendrait le prochain suivi plus facile.",
      },
      ar: {
        title: "كم كان من السهل البقاء هادئاً ومركّزاً، وما الذي سيساعد في المرة القادمة؟",
        helper: "اختر الدعم الذي سيجعل المتابعة القادمة أسهل.",
      },
    },
  },
  {
    id: "concentration-middle-b",
    level: "middle",
    content: {
      en: {
        title: "Rate how easy it was to maintain concentration throughout the lesson.",
        helper: "Think about focus dips, mental fatigue, or distractions that affected your work.",
      },
      fr: {
        title: "Évalue à quel point il était facile de maintenir la concentration tout au long de la leçon.",
        helper: "Pense aux baisses de concentration, à la fatigue mentale ou aux distractions qui ont affecté ton travail.",
      },
      ar: {
        title: "قيّم مدى سهولة الحفاظ على التركيز طوال الدرس.",
        helper: "فكّر في انخفاضات التركيز أو الإجهاد الذهني أو المشتتات التي أثّرت على عملك.",
      },
    },
  },
  // ── SECONDARY ────────────────────────────────────────────────────────────
  {
    id: "concentration-secondary-a",
    level: "secondary",
    content: {
      en: {
        title: "How effectively were you able to sustain focus and regulate attention throughout this session?",
        helper: "Rate any difficulty with mental fatigue, distractibility, or reduced engagement.",
      },
      fr: {
        title: "Dans quelle mesure avez-vous pu maintenir la concentration et réguler l'attention tout au long de cette séance ?",
        helper: "Évaluez toute difficulté liée à la fatigue mentale, à la distractibilité ou à une moindre implication.",
      },
      ar: {
        title: "كم استطعت الحفاظ على التركيز وتنظيم الانتباه طوال هذه الجلسة؟",
        helper: "قيّم أيّ صعوبة في الإجهاد الذهني أو التشتت أو انخفاض الانخراط.",
      },
    },
  },
  {
    id: "concentration-secondary-b",
    level: "secondary",
    content: {
      en: {
        title: "To what extent did mental fatigue, environmental factors, or personal wellbeing affect your concentration?",
        helper: "Select what type of adjustment would best support your next session.",
      },
      fr: {
        title: "Dans quelle mesure la fatigue mentale, les facteurs environnementaux ou le bien-être personnel ont-ils affecté votre concentration ?",
        helper: "Sélectionnez le type d'ajustement qui soutiendrait le mieux votre prochaine séance.",
      },
      ar: {
        title: "إلى أيّ مدى أثّرت الإجهاد الذهني أو العوامل البيئية أو الرفاهية الشخصية على تركيزك؟",
        helper: "اختر نوع التعديل الذي سيدعم جلستك القادمة بشكل أفضل.",
      },
    },
  },
  // ── ADVANCED ─────────────────────────────────────────────────────────────
  {
    id: "concentration-advanced-a",
    level: "advanced",
    content: {
      en: {
        title: "How effectively did you manage sustained attention and cognitive regulation during this session?",
        helper: "Reflect on attentional fatigue, meta-cognitive control, and any environmental or internal disruptions.",
      },
      fr: {
        title: "Dans quelle mesure avez-vous géré l'attention soutenue et la régulation cognitive pendant cette séance ?",
        helper: "Réfléchissez à la fatigue attentionnelle, au contrôle méta-cognitif et aux perturbations environnementales ou internes.",
      },
      ar: {
        title: "كم نجحت في إدارة الانتباه المستدام والتنظيم المعرفي خلال هذه الجلسة؟",
        helper: "تأمّل في الإجهاد الانتباهي والتحكم ما وراء المعرفي وأيّ اضطرابات بيئية أو داخلية.",
      },
    },
  },
  {
    id: "concentration-advanced-b",
    level: "advanced",
    content: {
      en: {
        title: "Evaluate your capacity for sustained concentration during complex, multi-step tasks in this environment.",
        helper: "Consider cognitive load, self-regulation strategies, and environmental support or hindrance.",
      },
      fr: {
        title: "Évaluez votre capacité de concentration soutenue lors de tâches complexes en plusieurs étapes dans cet environnement.",
        helper: "Considérez la charge cognitive, les stratégies d'autorégulation et le soutien ou l'obstacle environnemental.",
      },
      ar: {
        title: "قيّم قدرتك على التركيز المستدام أثناء المهام المعقدة متعددة الخطوات في هذه البيئة.",
        helper: "ضع في اعتبارك العبء المعرفي واستراتيجيات التنظيم الذاتي ودعم أو عرقلة البيئة.",
      },
    },
  },
];

// ─── COMFORT_PROMPTS_BANK aggregate (keyed by level) ─────────────────────────

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

export const COMFORT_PROMPTS_BANK = _groupByLevel([
  NOISE_PROMPT_POOL,
  LIGHT_PROMPT_POOL,
  AIR_PROMPT_POOL,
  CONCENTRATION_PROMPT_POOL,
]);
