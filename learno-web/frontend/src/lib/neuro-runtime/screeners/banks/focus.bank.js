/**
 * focus.bank.js
 *
 * Item banks for the Focus Check screener.
 * Each pool has 3 variants (sets A, B, C) per level (early, middle, secondary, advanced).
 *
 * Constraints (all levels):
 *  - SELECTIVE_TERMS: each set has 12 items, 6 targets and 6 distractors
 *  - GO_NO_GO: each set has exactly 20 symbols, target "X" appears 7 times (35% density)
 *  - MEMORY_SEQUENCE: each set has exactly 5 study-step items (EARLY: 3 steps)
 *  - MULTISTEP: each scenario has exactly 3 order steps, 3 main-idea options, 3 title options
 *
 * Level content rules:
 *  - EARLY (6–9): simple icon-friendly words, 3-step memory, concrete multistep
 *  - MIDDLE (10–13): academic lists, 5-step, multistep reasoning (current default)
 *  - SECONDARY (14–17): denser academic vocabulary, abstract multistep
 *  - ADVANCED (18+): workflow/synthesis tasks, formal multistep
 */

// ─── SELECTIVE ATTENTION TERMS ──────────────────────────────────────────────
// Science (target=true) vs Humanities (target=false)

export const SELECTIVE_TERMS_POOL = [
  {
    id: "selective-a",
    content: {
      en: {
        topic: "Science words",
        items: [
          { id: "chlorophyll", label: "Chlorophyll", isTarget: true },
          { id: "treaty", label: "Treaty", isTarget: false },
          { id: "ecosystem", label: "Ecosystem", isTarget: true },
          { id: "stanza", label: "Stanza", isTarget: false },
          { id: "velocity", label: "Velocity", isTarget: true },
          { id: "parliament", label: "Parliament", isTarget: false },
          { id: "molecule", label: "Molecule", isTarget: true },
          { id: "thesis", label: "Thesis", isTarget: false },
          { id: "gravity", label: "Gravity", isTarget: true },
          { id: "simile", label: "Simile", isTarget: false },
          { id: "atom", label: "Atom", isTarget: true },
          { id: "timeline", label: "Timeline", isTarget: false },
        ],
      },
      fr: {
        topic: "Mots scientifiques",
        items: [
          { id: "chlorophyll", label: "Chlorophylle", isTarget: true },
          { id: "treaty", label: "Traité", isTarget: false },
          { id: "ecosystem", label: "Écosystème", isTarget: true },
          { id: "stanza", label: "Strophe", isTarget: false },
          { id: "velocity", label: "Vitesse", isTarget: true },
          { id: "parliament", label: "Parlement", isTarget: false },
          { id: "molecule", label: "Molécule", isTarget: true },
          { id: "thesis", label: "Thèse", isTarget: false },
          { id: "gravity", label: "Gravité", isTarget: true },
          { id: "simile", label: "Comparaison", isTarget: false },
          { id: "atom", label: "Atome", isTarget: true },
          { id: "timeline", label: "Chronologie", isTarget: false },
        ],
      },
      ar: {
        topic: "كلمات علمية",
        items: [
          { id: "chlorophyll", label: "كلوروفيل", isTarget: true },
          { id: "treaty", label: "معاهدة", isTarget: false },
          { id: "ecosystem", label: "نظام بيئي", isTarget: true },
          { id: "stanza", label: "مقطع شعري", isTarget: false },
          { id: "velocity", label: "سرعة", isTarget: true },
          { id: "parliament", label: "برلمان", isTarget: false },
          { id: "molecule", label: "جزيء", isTarget: true },
          { id: "thesis", label: "أطروحة", isTarget: false },
          { id: "gravity", label: "جاذبية", isTarget: true },
          { id: "simile", label: "تشبيه", isTarget: false },
          { id: "atom", label: "ذرة", isTarget: true },
          { id: "timeline", label: "خط زمني", isTarget: false },
        ],
      },
    },
  },
  {
    id: "selective-b",
    content: {
      en: {
        topic: "Science words",
        items: [
          { id: "photosynthesis", label: "Photosynthesis", isTarget: true },
          { id: "metaphor", label: "Metaphor", isTarget: false },
          { id: "nucleus", label: "Nucleus", isTarget: true },
          { id: "democracy", label: "Democracy", isTarget: false },
          { id: "oxidation", label: "Oxidation", isTarget: true },
          { id: "allegory", label: "Allegory", isTarget: false },
          { id: "electrode", label: "Electrode", isTarget: true },
          { id: "amendment", label: "Amendment", isTarget: false },
          { id: "inertia", label: "Inertia", isTarget: true },
          { id: "rhetoric", label: "Rhetoric", isTarget: false },
          { id: "density", label: "Density", isTarget: true },
          { id: "clause", label: "Clause", isTarget: false },
        ],
      },
      fr: {
        topic: "Mots scientifiques",
        items: [
          { id: "photosynthesis", label: "Photosynthèse", isTarget: true },
          { id: "metaphor", label: "Métaphore", isTarget: false },
          { id: "nucleus", label: "Noyau", isTarget: true },
          { id: "democracy", label: "Démocratie", isTarget: false },
          { id: "oxidation", label: "Oxydation", isTarget: true },
          { id: "allegory", label: "Allégorie", isTarget: false },
          { id: "electrode", label: "Électrode", isTarget: true },
          { id: "amendment", label: "Amendement", isTarget: false },
          { id: "inertia", label: "Inertie", isTarget: true },
          { id: "rhetoric", label: "Rhétorique", isTarget: false },
          { id: "density", label: "Densité", isTarget: true },
          { id: "clause", label: "Clause", isTarget: false },
        ],
      },
      ar: {
        topic: "كلمات علمية",
        items: [
          { id: "photosynthesis", label: "تمثيل ضوئي", isTarget: true },
          { id: "metaphor", label: "استعارة", isTarget: false },
          { id: "nucleus", label: "نواة", isTarget: true },
          { id: "democracy", label: "ديمقراطية", isTarget: false },
          { id: "oxidation", label: "أكسدة", isTarget: true },
          { id: "allegory", label: "رمزية", isTarget: false },
          { id: "electrode", label: "قطب كهربي", isTarget: true },
          { id: "amendment", label: "تعديل", isTarget: false },
          { id: "inertia", label: "قصور ذاتي", isTarget: true },
          { id: "rhetoric", label: "خطابة", isTarget: false },
          { id: "density", label: "كثافة", isTarget: true },
          { id: "clause", label: "بند", isTarget: false },
        ],
      },
    },
  },
  {
    id: "selective-c",
    content: {
      en: {
        topic: "Science words",
        items: [
          { id: "evaporation", label: "Evaporation", isTarget: true },
          { id: "narrative", label: "Narrative", isTarget: false },
          { id: "combustion", label: "Combustion", isTarget: true },
          { id: "sovereignty", label: "Sovereignty", isTarget: false },
          { id: "refraction", label: "Refraction", isTarget: true },
          { id: "irony", label: "Irony", isTarget: false },
          { id: "chromosome", label: "Chromosome", isTarget: true },
          { id: "verdict", label: "Verdict", isTarget: false },
          { id: "amplitude", label: "Amplitude", isTarget: true },
          { id: "satire", label: "Satire", isTarget: false },
          { id: "friction", label: "Friction", isTarget: true },
          { id: "ideology", label: "Ideology", isTarget: false },
        ],
      },
      fr: {
        topic: "Mots scientifiques",
        items: [
          { id: "evaporation", label: "Évaporation", isTarget: true },
          { id: "narrative", label: "Récit", isTarget: false },
          { id: "combustion", label: "Combustion", isTarget: true },
          { id: "sovereignty", label: "Souveraineté", isTarget: false },
          { id: "refraction", label: "Réfraction", isTarget: true },
          { id: "irony", label: "Ironie", isTarget: false },
          { id: "chromosome", label: "Chromosome", isTarget: true },
          { id: "verdict", label: "Verdict", isTarget: false },
          { id: "amplitude", label: "Amplitude", isTarget: true },
          { id: "satire", label: "Satire", isTarget: false },
          { id: "friction", label: "Friction", isTarget: true },
          { id: "ideology", label: "Idéologie", isTarget: false },
        ],
      },
      ar: {
        topic: "كلمات علمية",
        items: [
          { id: "evaporation", label: "تبخر", isTarget: true },
          { id: "narrative", label: "سرد", isTarget: false },
          { id: "combustion", label: "احتراق", isTarget: true },
          { id: "sovereignty", label: "سيادة", isTarget: false },
          { id: "refraction", label: "انكسار", isTarget: true },
          { id: "irony", label: "سخرية", isTarget: false },
          { id: "chromosome", label: "كروموسوم", isTarget: true },
          { id: "verdict", label: "حكم", isTarget: false },
          { id: "amplitude", label: "سعة", isTarget: true },
          { id: "satire", label: "هجاء", isTarget: false },
          { id: "friction", label: "احتكاك", isTarget: true },
          { id: "ideology", label: "أيديولوجية", isTarget: false },
        ],
      },
    },
  },
];

// ─── GO / NO-GO SEQUENCES ────────────────────────────────────────────────────
// Each set: 20 symbols, target "X" appears exactly 7 times

export const GO_NO_GO_POOL = [
  {
    id: "gng-a",
    content: {
      en: { target: "X", sequence: ["M","X","R","T","X","L","X","Q","B","X","N","C","X","P","D","X","H","K","X","S"] },
      fr: { target: "X", sequence: ["M","X","R","T","X","L","X","Q","B","X","N","C","X","P","D","X","H","K","X","S"] },
      ar: { target: "X", sequence: ["M","X","R","T","X","L","X","Q","B","X","N","C","X","P","D","X","H","K","X","S"] },
    },
  },
  {
    id: "gng-b",
    content: {
      en: { target: "X", sequence: ["F","X","A","X","G","W","X","Z","V","X","J","X","E","Y","X","U","X","I","O","X"] },
      fr: { target: "X", sequence: ["F","X","A","X","G","W","X","Z","V","X","J","X","E","Y","X","U","X","I","O","X"] },
      ar: { target: "X", sequence: ["F","X","A","X","G","W","X","Z","V","X","J","X","E","Y","X","U","X","I","O","X"] },
    },
  },
  {
    id: "gng-c",
    content: {
      en: { target: "X", sequence: ["B","C","X","D","X","N","P","X","Q","K","X","H","S","X","T","X","R","X","L","M"] },
      fr: { target: "X", sequence: ["B","C","X","D","X","N","P","X","Q","K","X","H","S","X","T","X","R","X","L","M"] },
      ar: { target: "X", sequence: ["B","C","X","D","X","N","P","X","Q","K","X","H","S","X","T","X","R","X","L","M"] },
    },
  },
];

// ─── MEMORY SEQUENCES ────────────────────────────────────────────────────────
// Each set: exactly 5 ordered study-step items

export const MEMORY_SEQUENCE_POOL = [
  {
    id: "memory-a",
    content: {
      en: {
        steps: [
          "Read the source note",
          "Mark the key data",
          "Compare the two examples",
          "Write the pattern",
          "Check the conclusion",
        ],
      },
      fr: {
        steps: [
          "Lire la note source",
          "Marquer les données clés",
          "Comparer les deux exemples",
          "Écrire le modèle",
          "Vérifier la conclusion",
        ],
      },
      ar: {
        steps: [
          "اقرأ الملاحظة المصدرية",
          "حدد البيانات الرئيسية",
          "قارن المثالين",
          "اكتب النمط",
          "تحقق من الاستنتاج",
        ],
      },
    },
  },
  {
    id: "memory-b",
    content: {
      en: {
        steps: [
          "Scan the question prompt",
          "Highlight unfamiliar terms",
          "Recall a related example",
          "Draft your answer",
          "Review for accuracy",
        ],
      },
      fr: {
        steps: [
          "Lire l'énoncé de la question",
          "Souligner les termes inconnus",
          "Rappeler un exemple similaire",
          "Rédiger la réponse",
          "Vérifier l'exactitude",
        ],
      },
      ar: {
        steps: [
          "اقرأ السؤال بتمعن",
          "سلط الضوء على المصطلحات غير المألوفة",
          "تذكر مثالاً مرتبطاً",
          "ضع إجابتك",
          "راجع للتأكد من الدقة",
        ],
      },
    },
  },
  {
    id: "memory-c",
    content: {
      en: {
        steps: [
          "Identify the main topic",
          "List supporting details",
          "Connect ideas with arrows",
          "Summarise in one sentence",
          "Confirm your summary matches",
        ],
      },
      fr: {
        steps: [
          "Identifier le sujet principal",
          "Lister les détails pertinents",
          "Relier les idées avec des flèches",
          "Résumer en une phrase",
          "Vérifier que le résumé correspond",
        ],
      },
      ar: {
        steps: [
          "حدد الموضوع الرئيسي",
          "اذكر التفاصيل الداعمة",
          "اربط الأفكار بالأسهم",
          "لخص في جملة واحدة",
          "تأكد أن ملخصك يتطابق",
        ],
      },
    },
  },
];

// ─── MULTISTEP SCENARIOS ─────────────────────────────────────────────────────
// Each: 1 note, 3 mainIdeaOptions (1 correct), 3 order steps, 3 titleOptions (1 correct)

export const MULTISTEP_POOL = [
  {
    id: "multistep-a",
    content: {
      en: {
        note: "During science club, students tested whether pot size changed seed growth. They planted the same bean seeds in different pots, measured plant height each week, and compared the final results. The wider pots produced stronger growth.",
        mainIdeaOptions: [
          { id: "pot-size", label: "Pot size affected seed growth.", isCorrect: true },
          { id: "watering-hourly", label: "Bean seeds need watering every hour.", isCorrect: false },
          { id: "club-only", label: "Science club should only use wide pots.", isCorrect: false },
        ],
        order: [
          { id: "plant-seeds", label: "Plant the same bean seeds in different pots." },
          { id: "measure-height", label: "Measure plant height each week." },
          { id: "compare-results", label: "Compare the final results." },
        ],
        titleOptions: [
          { id: "growth-title", label: "How pot size affected seed growth", isCorrect: true },
          { id: "meeting-title", label: "What happened during science club", isCorrect: false },
          { id: "watering-title", label: "Why plants need more water", isCorrect: false },
        ],
      },
      fr: {
        note: "Lors du club de sciences, les élèves ont testé si la taille du pot affectait la croissance des graines. Ils ont planté les mêmes graines de haricots dans différents pots, mesuré la hauteur des plantes chaque semaine et comparé les résultats finaux. Les pots plus larges ont produit une croissance plus forte.",
        mainIdeaOptions: [
          { id: "pot-size", label: "La taille du pot a affecté la croissance des graines.", isCorrect: true },
          { id: "watering-hourly", label: "Les graines de haricots ont besoin d'eau toutes les heures.", isCorrect: false },
          { id: "club-only", label: "Le club de sciences ne devrait utiliser que de grands pots.", isCorrect: false },
        ],
        order: [
          { id: "plant-seeds", label: "Planter les mêmes graines de haricots dans différents pots." },
          { id: "measure-height", label: "Mesurer la hauteur des plantes chaque semaine." },
          { id: "compare-results", label: "Comparer les résultats finaux." },
        ],
        titleOptions: [
          { id: "growth-title", label: "Comment la taille du pot affecte la croissance des graines", isCorrect: true },
          { id: "meeting-title", label: "Ce qui s'est passé au club de sciences", isCorrect: false },
          { id: "watering-title", label: "Pourquoi les plantes ont besoin de plus d'eau", isCorrect: false },
        ],
      },
      ar: {
        note: "خلال نادي العلوم، اختبر الطلاب ما إذا كان حجم الوعاء يؤثر على نمو البذور. زرعوا نفس بذور الفاصولياء في أوعية مختلفة، وقاسوا ارتفاع النبات كل أسبوع، وقارنوا النتائج النهائية. أنتجت الأوعية الأوسع نمواً أقوى.",
        mainIdeaOptions: [
          { id: "pot-size", label: "حجم الوعاء أثّر على نمو البذور.", isCorrect: true },
          { id: "watering-hourly", label: "تحتاج بذور الفاصولياء للري كل ساعة.", isCorrect: false },
          { id: "club-only", label: "ينبغي أن يستخدم نادي العلوم الأوعية الواسعة فقط.", isCorrect: false },
        ],
        order: [
          { id: "plant-seeds", label: "زراعة نفس بذور الفاصولياء في أوعية مختلفة." },
          { id: "measure-height", label: "قياس ارتفاع النبات كل أسبوع." },
          { id: "compare-results", label: "مقارنة النتائج النهائية." },
        ],
        titleOptions: [
          { id: "growth-title", label: "كيف أثّر حجم الوعاء على نمو البذور", isCorrect: true },
          { id: "meeting-title", label: "ما الذي حدث خلال نادي العلوم", isCorrect: false },
          { id: "watering-title", label: "لماذا تحتاج النباتات لمزيد من الماء", isCorrect: false },
        ],
      },
    },
  },
  {
    id: "multistep-b",
    content: {
      en: {
        note: "For the school fair, a student team tested which bridge design held the most weight. They built three bridge models using craft sticks, applied equal loads, and recorded when each bridge failed. The arch design lasted longest.",
        mainIdeaOptions: [
          { id: "arch-best", label: "The arch design held the most weight.", isCorrect: true },
          { id: "sticks-strong", label: "Craft sticks are the strongest building material.", isCorrect: false },
          { id: "fair-win", label: "The team won first place at the school fair.", isCorrect: false },
        ],
        order: [
          { id: "build-models", label: "Build three bridge models using craft sticks." },
          { id: "apply-load", label: "Apply equal loads to each bridge." },
          { id: "record-failure", label: "Record when each bridge failed." },
        ],
        titleOptions: [
          { id: "bridge-title", label: "Which bridge design is strongest", isCorrect: true },
          { id: "fair-title", label: "How to win a school fair project", isCorrect: false },
          { id: "sticks-title", label: "Why craft sticks are used in building", isCorrect: false },
        ],
      },
      fr: {
        note: "Pour la foire scolaire, une équipe d'élèves a testé quel design de pont supportait le plus de poids. Ils ont construit trois modèles de ponts avec des bâtons, appliqué des charges égales et noté quand chaque pont a cédé. Le design en arche a duré le plus longtemps.",
        mainIdeaOptions: [
          { id: "arch-best", label: "Le design en arche a supporté le plus de poids.", isCorrect: true },
          { id: "sticks-strong", label: "Les bâtons sont le matériau de construction le plus solide.", isCorrect: false },
          { id: "fair-win", label: "L'équipe a gagné la première place à la foire.", isCorrect: false },
        ],
        order: [
          { id: "build-models", label: "Construire trois modèles de ponts avec des bâtons." },
          { id: "apply-load", label: "Appliquer des charges égales sur chaque pont." },
          { id: "record-failure", label: "Noter quand chaque pont a cédé." },
        ],
        titleOptions: [
          { id: "bridge-title", label: "Quel design de pont est le plus solide", isCorrect: true },
          { id: "fair-title", label: "Comment gagner un projet de foire scolaire", isCorrect: false },
          { id: "sticks-title", label: "Pourquoi utiliser des bâtons en construction", isCorrect: false },
        ],
      },
      ar: {
        note: "لمعرض المدرسة، اختبر فريق من الطلاب أيّ تصميم جسر يتحمل أكبر وزن. بنوا ثلاثة نماذج جسور باستخدام عيدان الحرف، وطبّقوا أحمالاً متساوية، وسجّلوا وقت تعطل كل جسر. دام تصميم القوس أطول.",
        mainIdeaOptions: [
          { id: "arch-best", label: "تصميم القوس حمل أكبر وزن.", isCorrect: true },
          { id: "sticks-strong", label: "عيدان الحرف هي أقوى مواد البناء.", isCorrect: false },
          { id: "fair-win", label: "فاز الفريق بالمرتبة الأولى في المعرض.", isCorrect: false },
        ],
        order: [
          { id: "build-models", label: "بناء ثلاثة نماذج جسور باستخدام عيدان الحرف." },
          { id: "apply-load", label: "تطبيق أحمال متساوية على كل جسر." },
          { id: "record-failure", label: "تسجيل وقت تعطل كل جسر." },
        ],
        titleOptions: [
          { id: "bridge-title", label: "أيّ تصميم جسر هو الأقوى", isCorrect: true },
          { id: "fair-title", label: "كيف تفوز بمشروع المعرض المدرسي", isCorrect: false },
          { id: "sticks-title", label: "لماذا تُستخدم العيدان في البناء", isCorrect: false },
        ],
      },
    },
  },
  {
    id: "multistep-c",
    content: {
      en: {
        note: "In geography class, students explored how rivers change the land. They watched a time-lapse of river erosion, identified three affected areas, and matched each area to a type of change. The river bend showed the most erosion.",
        mainIdeaOptions: [
          { id: "rivers-erode", label: "Rivers can change the shape of the land.", isCorrect: true },
          { id: "bends-rare", label: "River bends are rare in geography.", isCorrect: false },
          { id: "timelapse-only", label: "Time-lapses are only used in science class.", isCorrect: false },
        ],
        order: [
          { id: "watch-timelapse", label: "Watch a time-lapse of river erosion." },
          { id: "identify-areas", label: "Identify three affected land areas." },
          { id: "match-change", label: "Match each area to a type of change." },
        ],
        titleOptions: [
          { id: "erosion-title", label: "How rivers shape the land through erosion", isCorrect: true },
          { id: "class-title", label: "What students did in geography class", isCorrect: false },
          { id: "bend-title", label: "Why rivers have bends", isCorrect: false },
        ],
      },
      fr: {
        note: "En cours de géographie, les élèves ont exploré comment les rivières modifient le terrain. Ils ont regardé un timelapse d'érosion fluviale, identifié trois zones affectées et associé chaque zone à un type de changement. Le méandre de la rivière présentait l'érosion la plus importante.",
        mainIdeaOptions: [
          { id: "rivers-erode", label: "Les rivières peuvent modifier la forme du terrain.", isCorrect: true },
          { id: "bends-rare", label: "Les méandres sont rares en géographie.", isCorrect: false },
          { id: "timelapse-only", label: "Les timelapses ne sont utilisés qu'en sciences.", isCorrect: false },
        ],
        order: [
          { id: "watch-timelapse", label: "Regarder un timelapse d'érosion fluviale." },
          { id: "identify-areas", label: "Identifier trois zones de terrain affectées." },
          { id: "match-change", label: "Associer chaque zone à un type de changement." },
        ],
        titleOptions: [
          { id: "erosion-title", label: "Comment les rivières façonnent le terrain par érosion", isCorrect: true },
          { id: "class-title", label: "Ce que les élèves ont fait en cours de géographie", isCorrect: false },
          { id: "bend-title", label: "Pourquoi les rivières ont des méandres", isCorrect: false },
        ],
      },
      ar: {
        note: "في درس الجغرافيا، استكشف الطلاب كيف تغيّر الأنهار شكل الأرض. شاهدوا تسجيلاً مسرّعاً لتآكل نهري، وحددوا ثلاث مناطق متأثرة، وطابقوا كل منطقة بنوع من التغيير. أظهر منعطف النهر أكبر قدر من التآكل.",
        mainIdeaOptions: [
          { id: "rivers-erode", label: "يمكن للأنهار أن تغيّر شكل الأرض.", isCorrect: true },
          { id: "bends-rare", label: "منعطفات الأنهار نادرة في الجغرافيا.", isCorrect: false },
          { id: "timelapse-only", label: "التسجيلات المسرّعة تُستخدم فقط في العلوم.", isCorrect: false },
        ],
        order: [
          { id: "watch-timelapse", label: "مشاهدة تسجيل مسرّع لتآكل نهري." },
          { id: "identify-areas", label: "تحديد ثلاث مناطق أرضية متأثرة." },
          { id: "match-change", label: "مطابقة كل منطقة بنوع من التغيير." },
        ],
        titleOptions: [
          { id: "erosion-title", label: "كيف تشكّل الأنهار الأرض عبر التآكل", isCorrect: true },
          { id: "class-title", label: "ما الذي فعله الطلاب في درس الجغرافيا", isCorrect: false },
          { id: "bend-title", label: "لماذا للأنهار منعطفات", isCorrect: false },
        ],
      },
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// EARLY LEVEL POOLS (ages 6–9)
// ═══════════════════════════════════════════════════════════════════════════════

export const SELECTIVE_TERMS_POOL_EARLY = [
  {
    id: "selective-early-a",
    level: "early",
    content: {
      en: {
        topic: "Animal words",
        items: [
          { id: "dog", label: "Dog", isTarget: true },
          { id: "red", label: "Red", isTarget: false },
          { id: "cat", label: "Cat", isTarget: true },
          { id: "happy", label: "Happy", isTarget: false },
          { id: "bird", label: "Bird", isTarget: true },
          { id: "big", label: "Big", isTarget: false },
          { id: "fish", label: "Fish", isTarget: true },
          { id: "fast", label: "Fast", isTarget: false },
          { id: "rabbit", label: "Rabbit", isTarget: true },
          { id: "loud", label: "Loud", isTarget: false },
          { id: "cow", label: "Cow", isTarget: true },
          { id: "soft", label: "Soft", isTarget: false },
        ],
      },
      fr: {
        topic: "Mots d'animaux",
        items: [
          { id: "dog", label: "Chien", isTarget: true },
          { id: "red", label: "Rouge", isTarget: false },
          { id: "cat", label: "Chat", isTarget: true },
          { id: "happy", label: "Content", isTarget: false },
          { id: "bird", label: "Oiseau", isTarget: true },
          { id: "big", label: "Grand", isTarget: false },
          { id: "fish", label: "Poisson", isTarget: true },
          { id: "fast", label: "Rapide", isTarget: false },
          { id: "rabbit", label: "Lapin", isTarget: true },
          { id: "loud", label: "Fort", isTarget: false },
          { id: "cow", label: "Vache", isTarget: true },
          { id: "soft", label: "Doux", isTarget: false },
        ],
      },
      ar: {
        topic: "كلمات الحيوانات",
        items: [
          { id: "dog", label: "كلب", isTarget: true },
          { id: "red", label: "أحمر", isTarget: false },
          { id: "cat", label: "قطة", isTarget: true },
          { id: "happy", label: "سعيد", isTarget: false },
          { id: "bird", label: "طائر", isTarget: true },
          { id: "big", label: "كبير", isTarget: false },
          { id: "fish", label: "سمكة", isTarget: true },
          { id: "fast", label: "سريع", isTarget: false },
          { id: "rabbit", label: "أرنب", isTarget: true },
          { id: "loud", label: "عالٍ", isTarget: false },
          { id: "cow", label: "بقرة", isTarget: true },
          { id: "soft", label: "ناعم", isTarget: false },
        ],
      },
    },
  },
  {
    id: "selective-early-b",
    level: "early",
    content: {
      en: {
        topic: "Fruit words",
        items: [
          { id: "apple", label: "Apple", isTarget: true },
          { id: "run", label: "Run", isTarget: false },
          { id: "banana", label: "Banana", isTarget: true },
          { id: "sleep", label: "Sleep", isTarget: false },
          { id: "mango", label: "Mango", isTarget: true },
          { id: "jump", label: "Jump", isTarget: false },
          { id: "grape", label: "Grape", isTarget: true },
          { id: "walk", label: "Walk", isTarget: false },
          { id: "orange", label: "Orange", isTarget: true },
          { id: "sing", label: "Sing", isTarget: false },
          { id: "lemon", label: "Lemon", isTarget: true },
          { id: "draw", label: "Draw", isTarget: false },
        ],
      },
      fr: {
        topic: "Mots de fruits",
        items: [
          { id: "apple", label: "Pomme", isTarget: true },
          { id: "run", label: "Courir", isTarget: false },
          { id: "banana", label: "Banane", isTarget: true },
          { id: "sleep", label: "Dormir", isTarget: false },
          { id: "mango", label: "Mangue", isTarget: true },
          { id: "jump", label: "Sauter", isTarget: false },
          { id: "grape", label: "Raisin", isTarget: true },
          { id: "walk", label: "Marcher", isTarget: false },
          { id: "orange", label: "Orange", isTarget: true },
          { id: "sing", label: "Chanter", isTarget: false },
          { id: "lemon", label: "Citron", isTarget: true },
          { id: "draw", label: "Dessiner", isTarget: false },
        ],
      },
      ar: {
        topic: "كلمات الفاكهة",
        items: [
          { id: "apple", label: "تفاحة", isTarget: true },
          { id: "run", label: "يركض", isTarget: false },
          { id: "banana", label: "موزة", isTarget: true },
          { id: "sleep", label: "ينام", isTarget: false },
          { id: "mango", label: "مانجو", isTarget: true },
          { id: "jump", label: "يقفز", isTarget: false },
          { id: "grape", label: "عنبة", isTarget: true },
          { id: "walk", label: "يمشي", isTarget: false },
          { id: "orange", label: "برتقالة", isTarget: true },
          { id: "sing", label: "يغني", isTarget: false },
          { id: "lemon", label: "ليمونة", isTarget: true },
          { id: "draw", label: "يرسم", isTarget: false },
        ],
      },
    },
  },
  {
    id: "selective-early-c",
    level: "early",
    content: {
      en: {
        topic: "Colour words",
        items: [
          { id: "blue", label: "Blue", isTarget: true },
          { id: "table", label: "Table", isTarget: false },
          { id: "green", label: "Green", isTarget: true },
          { id: "chair", label: "Chair", isTarget: false },
          { id: "yellow", label: "Yellow", isTarget: true },
          { id: "door", label: "Door", isTarget: false },
          { id: "pink", label: "Pink", isTarget: true },
          { id: "book", label: "Book", isTarget: false },
          { id: "purple", label: "Purple", isTarget: true },
          { id: "window", label: "Window", isTarget: false },
          { id: "white", label: "White", isTarget: true },
          { id: "floor", label: "Floor", isTarget: false },
        ],
      },
      fr: {
        topic: "Mots de couleurs",
        items: [
          { id: "blue", label: "Bleu", isTarget: true },
          { id: "table", label: "Table", isTarget: false },
          { id: "green", label: "Vert", isTarget: true },
          { id: "chair", label: "Chaise", isTarget: false },
          { id: "yellow", label: "Jaune", isTarget: true },
          { id: "door", label: "Porte", isTarget: false },
          { id: "pink", label: "Rose", isTarget: true },
          { id: "book", label: "Livre", isTarget: false },
          { id: "purple", label: "Violet", isTarget: true },
          { id: "window", label: "Fenêtre", isTarget: false },
          { id: "white", label: "Blanc", isTarget: true },
          { id: "floor", label: "Sol", isTarget: false },
        ],
      },
      ar: {
        topic: "كلمات الألوان",
        items: [
          { id: "blue", label: "أزرق", isTarget: true },
          { id: "table", label: "طاولة", isTarget: false },
          { id: "green", label: "أخضر", isTarget: true },
          { id: "chair", label: "كرسي", isTarget: false },
          { id: "yellow", label: "أصفر", isTarget: true },
          { id: "door", label: "باب", isTarget: false },
          { id: "pink", label: "وردي", isTarget: true },
          { id: "book", label: "كتاب", isTarget: false },
          { id: "purple", label: "بنفسجي", isTarget: true },
          { id: "window", label: "نافذة", isTarget: false },
          { id: "white", label: "أبيض", isTarget: true },
          { id: "floor", label: "أرضية", isTarget: false },
        ],
      },
    },
  },
];

// EARLY GO/NO-GO — same symbol constraint, 20 symbols, X appears 7 times
export const GO_NO_GO_POOL_EARLY = [
  {
    id: "gng-early-a",
    level: "early",
    content: {
      en: { target: "X", sequence: ["A","X","B","X","C","D","X","E","F","X","G","H","X","I","J","X","K","X","L","M"] },
      fr: { target: "X", sequence: ["A","X","B","X","C","D","X","E","F","X","G","H","X","I","J","X","K","X","L","M"] },
      ar: { target: "X", sequence: ["A","X","B","X","C","D","X","E","F","X","G","H","X","I","J","X","K","X","L","M"] },
    },
  },
  {
    id: "gng-early-b",
    level: "early",
    content: {
      en: { target: "X", sequence: ["N","X","O","P","X","Q","R","X","S","T","X","U","V","X","W","X","Y","Z","X","A"] },
      fr: { target: "X", sequence: ["N","X","O","P","X","Q","R","X","S","T","X","U","V","X","W","X","Y","Z","X","A"] },
      ar: { target: "X", sequence: ["N","X","O","P","X","Q","R","X","S","T","X","U","V","X","W","X","Y","Z","X","A"] },
    },
  },
  {
    id: "gng-early-c",
    level: "early",
    content: {
      en: { target: "X", sequence: ["B","C","X","D","E","X","F","G","H","X","I","J","X","K","L","M","X","N","X","O"] },
      fr: { target: "X", sequence: ["B","C","X","D","E","X","F","G","H","X","I","J","X","K","L","M","X","N","X","O"] },
      ar: { target: "X", sequence: ["B","C","X","D","E","X","F","G","H","X","I","J","X","K","L","M","X","N","X","O"] },
    },
  },
];

// EARLY MEMORY — 3-step sequences (simpler than middle's 5-step)
export const MEMORY_SEQUENCE_POOL_EARLY = [
  {
    id: "memory-early-a",
    level: "early",
    content: {
      en: { steps: ["Look at the picture", "Point to the matching word", "Say the word aloud"] },
      fr: { steps: ["Regarde l'image", "Pointe le mot correspondant", "Dis le mot à voix haute"] },
      ar: { steps: ["انظر إلى الصورة", "أشر إلى الكلمة المطابقة", "قل الكلمة بصوت عالٍ"] },
    },
  },
  {
    id: "memory-early-b",
    level: "early",
    content: {
      en: { steps: ["Listen to the story", "Find the main character", "Tell what happened"] },
      fr: { steps: ["Écoute l'histoire", "Trouve le personnage principal", "Dis ce qui s'est passé"] },
      ar: { steps: ["استمع إلى القصة", "ابحث عن الشخصية الرئيسية", "أخبر ما حدث"] },
    },
  },
  {
    id: "memory-early-c",
    level: "early",
    content: {
      en: { steps: ["Read the short sentence", "Find the missing word", "Write it in the blank"] },
      fr: { steps: ["Lis la courte phrase", "Trouve le mot manquant", "Écris-le dans l'espace"] },
      ar: { steps: ["اقرأ الجملة القصيرة", "ابحث عن الكلمة المفقودة", "اكتبها في الفراغ"] },
    },
  },
];

// EARLY MULTISTEP — concrete, 3 steps
export const MULTISTEP_POOL_EARLY = [
  {
    id: "multistep-early-a",
    level: "early",
    content: {
      en: {
        note: "Sara planted a seed in a small pot. She watered it every day and put it near the window. After two weeks, the seed grew into a small plant.",
        mainIdeaOptions: [
          { id: "plants-need-water", label: "Plants need water and light to grow.", isCorrect: true },
          { id: "pots-are-best", label: "Big pots are always better than small pots.", isCorrect: false },
          { id: "sara-won", label: "Sara won a prize for her plant.", isCorrect: false },
        ],
        order: [
          { id: "plant-seed", label: "Sara planted a seed in a pot." },
          { id: "water-daily", label: "She watered it every day." },
          { id: "plant-grew", label: "The seed grew into a small plant." },
        ],
        titleOptions: [
          { id: "growing-title", label: "How Sara grew a plant", isCorrect: true },
          { id: "prize-title", label: "How Sara won a prize", isCorrect: false },
          { id: "pot-title", label: "Why small pots are best", isCorrect: false },
        ],
      },
      fr: {
        note: "Sara a planté une graine dans un petit pot. Elle l'a arrosée chaque jour et l'a mise près de la fenêtre. Après deux semaines, la graine est devenue une petite plante.",
        mainIdeaOptions: [
          { id: "plants-need-water", label: "Les plantes ont besoin d'eau et de lumière pour pousser.", isCorrect: true },
          { id: "pots-are-best", label: "Les grands pots sont toujours meilleurs que les petits.", isCorrect: false },
          { id: "sara-won", label: "Sara a gagné un prix pour sa plante.", isCorrect: false },
        ],
        order: [
          { id: "plant-seed", label: "Sara a planté une graine dans un pot." },
          { id: "water-daily", label: "Elle l'a arrosée chaque jour." },
          { id: "plant-grew", label: "La graine est devenue une petite plante." },
        ],
        titleOptions: [
          { id: "growing-title", label: "Comment Sara a fait pousser une plante", isCorrect: true },
          { id: "prize-title", label: "Comment Sara a gagné un prix", isCorrect: false },
          { id: "pot-title", label: "Pourquoi les petits pots sont les meilleurs", isCorrect: false },
        ],
      },
      ar: {
        note: "زرعت سارة بذرة في وعاء صغير. سقتها كل يوم ووضعتها بالقرب من النافذة. بعد أسبوعين، نمت البذرة لتصبح نبتة صغيرة.",
        mainIdeaOptions: [
          { id: "plants-need-water", label: "تحتاج النباتات إلى الماء والضوء للنمو.", isCorrect: true },
          { id: "pots-are-best", label: "الأوعية الكبيرة دائماً أفضل من الصغيرة.", isCorrect: false },
          { id: "sara-won", label: "فازت سارة بجائزة على نبتتها.", isCorrect: false },
        ],
        order: [
          { id: "plant-seed", label: "زرعت سارة بذرة في وعاء." },
          { id: "water-daily", label: "سقتها كل يوم." },
          { id: "plant-grew", label: "نمت البذرة لتصبح نبتة صغيرة." },
        ],
        titleOptions: [
          { id: "growing-title", label: "كيف زرعت سارة نبتة", isCorrect: true },
          { id: "prize-title", label: "كيف فازت سارة بجائزة", isCorrect: false },
          { id: "pot-title", label: "لماذا الأوعية الصغيرة هي الأفضل", isCorrect: false },
        ],
      },
    },
  },
  {
    id: "multistep-early-b",
    level: "early",
    content: {
      en: {
        note: "Ali wanted to make a sandwich. He got two slices of bread, added cheese and tomato, and put the slices together. He ate his sandwich at lunchtime.",
        mainIdeaOptions: [
          { id: "make-sandwich", label: "Ali made a sandwich step by step.", isCorrect: true },
          { id: "cheese-best", label: "Cheese is always the best sandwich filling.", isCorrect: false },
          { id: "ali-lunch", label: "Ali ate lunch at school.", isCorrect: false },
        ],
        order: [
          { id: "get-bread", label: "Get two slices of bread." },
          { id: "add-filling", label: "Add cheese and tomato." },
          { id: "put-together", label: "Put the slices together." },
        ],
        titleOptions: [
          { id: "sandwich-title", label: "How to make a simple sandwich", isCorrect: true },
          { id: "lunch-title", label: "What Ali had for lunch", isCorrect: false },
          { id: "cheese-title", label: "Why cheese is the best filling", isCorrect: false },
        ],
      },
      fr: {
        note: "Ali voulait faire un sandwich. Il a pris deux tranches de pain, ajouté du fromage et des tomates, et mis les tranches ensemble. Il a mangé son sandwich à l'heure du déjeuner.",
        mainIdeaOptions: [
          { id: "make-sandwich", label: "Ali a fait un sandwich étape par étape.", isCorrect: true },
          { id: "cheese-best", label: "Le fromage est toujours la meilleure garniture.", isCorrect: false },
          { id: "ali-lunch", label: "Ali a déjeuné à l'école.", isCorrect: false },
        ],
        order: [
          { id: "get-bread", label: "Prendre deux tranches de pain." },
          { id: "add-filling", label: "Ajouter du fromage et des tomates." },
          { id: "put-together", label: "Mettre les tranches ensemble." },
        ],
        titleOptions: [
          { id: "sandwich-title", label: "Comment faire un sandwich simple", isCorrect: true },
          { id: "lunch-title", label: "Ce qu'Ali a mangé au déjeuner", isCorrect: false },
          { id: "cheese-title", label: "Pourquoi le fromage est la meilleure garniture", isCorrect: false },
        ],
      },
      ar: {
        note: "أراد علي أن يصنع شطيرة. أخذ شريحتين من الخبز، وأضاف الجبن والطماطم، وضم الشريحتين معاً. أكل شطيرته وقت الغداء.",
        mainIdeaOptions: [
          { id: "make-sandwich", label: "صنع علي شطيرة خطوة بخطوة.", isCorrect: true },
          { id: "cheese-best", label: "الجبن دائماً أفضل حشوة للشطيرة.", isCorrect: false },
          { id: "ali-lunch", label: "أكل علي الغداء في المدرسة.", isCorrect: false },
        ],
        order: [
          { id: "get-bread", label: "خذ شريحتين من الخبز." },
          { id: "add-filling", label: "أضف الجبن والطماطم." },
          { id: "put-together", label: "ضم الشريحتين معاً." },
        ],
        titleOptions: [
          { id: "sandwich-title", label: "كيف تصنع شطيرة بسيطة", isCorrect: true },
          { id: "lunch-title", label: "ماذا أكل علي على الغداء", isCorrect: false },
          { id: "cheese-title", label: "لماذا الجبن هو أفضل حشوة", isCorrect: false },
        ],
      },
    },
  },
  {
    id: "multistep-early-c",
    level: "early",
    content: {
      en: {
        note: "Nadia drew a picture for her friend's birthday. She chose her favourite colours, drew a cake, and wrote 'Happy Birthday' on it. She gave the picture to her friend at school.",
        mainIdeaOptions: [
          { id: "made-card", label: "Nadia made a birthday drawing for her friend.", isCorrect: true },
          { id: "best-colours", label: "Nadia has the best set of colours in the class.", isCorrect: false },
          { id: "ate-cake", label: "Nadia and her friend ate a real cake.", isCorrect: false },
        ],
        order: [
          { id: "choose-colours", label: "Choose favourite colours." },
          { id: "draw-cake", label: "Draw a cake and write 'Happy Birthday'." },
          { id: "give-picture", label: "Give the picture to a friend." },
        ],
        titleOptions: [
          { id: "card-title", label: "How Nadia made a birthday drawing", isCorrect: true },
          { id: "colours-title", label: "What colours Nadia likes best", isCorrect: false },
          { id: "cake-title", label: "Why Nadia drew a cake", isCorrect: false },
        ],
      },
      fr: {
        note: "Nadia a fait un dessin pour l'anniversaire de son amie. Elle a choisi ses couleurs préférées, dessiné un gâteau et écrit 'Joyeux anniversaire'. Elle a donné le dessin à son amie à l'école.",
        mainIdeaOptions: [
          { id: "made-card", label: "Nadia a fait un dessin d'anniversaire pour son amie.", isCorrect: true },
          { id: "best-colours", label: "Nadia a le meilleur jeu de couleurs de la classe.", isCorrect: false },
          { id: "ate-cake", label: "Nadia et son amie ont mangé un vrai gâteau.", isCorrect: false },
        ],
        order: [
          { id: "choose-colours", label: "Choisir ses couleurs préférées." },
          { id: "draw-cake", label: "Dessiner un gâteau et écrire 'Joyeux anniversaire'." },
          { id: "give-picture", label: "Donner le dessin à une amie." },
        ],
        titleOptions: [
          { id: "card-title", label: "Comment Nadia a fait un dessin d'anniversaire", isCorrect: true },
          { id: "colours-title", label: "Quelles couleurs Nadia préfère", isCorrect: false },
          { id: "cake-title", label: "Pourquoi Nadia a dessiné un gâteau", isCorrect: false },
        ],
      },
      ar: {
        note: "رسمت ناديا صورة لعيد ميلاد صديقتها. اختارت ألوانها المفضلة، ورسمت كعكة، وكتبت 'عيد ميلاد سعيد' عليها. أعطت الصورة لصديقتها في المدرسة.",
        mainIdeaOptions: [
          { id: "made-card", label: "صنعت ناديا رسمة عيد ميلاد لصديقتها.", isCorrect: true },
          { id: "best-colours", label: "لدى ناديا أفضل مجموعة ألوان في الفصل.", isCorrect: false },
          { id: "ate-cake", label: "أكلت ناديا وصديقتها كعكة حقيقية.", isCorrect: false },
        ],
        order: [
          { id: "choose-colours", label: "اختر الألوان المفضلة." },
          { id: "draw-cake", label: "ارسم كعكة واكتب 'عيد ميلاد سعيد'." },
          { id: "give-picture", label: "أعط الصورة لصديق." },
        ],
        titleOptions: [
          { id: "card-title", label: "كيف صنعت ناديا رسمة عيد ميلاد", isCorrect: true },
          { id: "colours-title", label: "ما الألوان التي تفضلها ناديا", isCorrect: false },
          { id: "cake-title", label: "لماذا رسمت ناديا كعكة", isCorrect: false },
        ],
      },
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECONDARY LEVEL POOLS (ages 14–17)
// ═══════════════════════════════════════════════════════════════════════════════

export const SELECTIVE_TERMS_POOL_SECONDARY = [
  {
    id: "selective-secondary-a",
    level: "secondary",
    content: {
      en: {
        topic: "Biology terms",
        items: [
          { id: "mitosis", label: "Mitosis", isTarget: true },
          { id: "sovereignty", label: "Sovereignty", isTarget: false },
          { id: "osmosis", label: "Osmosis", isTarget: true },
          { id: "epistemology", label: "Epistemology", isTarget: false },
          { id: "homeostasis", label: "Homeostasis", isTarget: true },
          { id: "jurisprudence", label: "Jurisprudence", isTarget: false },
          { id: "catalyst", label: "Catalyst", isTarget: true },
          { id: "hermeneutics", label: "Hermeneutics", isTarget: false },
          { id: "mutation", label: "Mutation", isTarget: true },
          { id: "axiom", label: "Axiom", isTarget: false },
          { id: "synthesis", label: "Synthesis", isTarget: true },
          { id: "dialectic", label: "Dialectic", isTarget: false },
        ],
      },
      fr: {
        topic: "Termes biologiques",
        items: [
          { id: "mitosis", label: "Mitose", isTarget: true },
          { id: "sovereignty", label: "Souveraineté", isTarget: false },
          { id: "osmosis", label: "Osmose", isTarget: true },
          { id: "epistemology", label: "Épistémologie", isTarget: false },
          { id: "homeostasis", label: "Homéostasie", isTarget: true },
          { id: "jurisprudence", label: "Jurisprudence", isTarget: false },
          { id: "catalyst", label: "Catalyseur", isTarget: true },
          { id: "hermeneutics", label: "Herméneutique", isTarget: false },
          { id: "mutation", label: "Mutation", isTarget: true },
          { id: "axiom", label: "Axiome", isTarget: false },
          { id: "synthesis", label: "Synthèse", isTarget: true },
          { id: "dialectic", label: "Dialectique", isTarget: false },
        ],
      },
      ar: {
        topic: "مصطلحات أحيائية",
        items: [
          { id: "mitosis", label: "انقسام خيطي", isTarget: true },
          { id: "sovereignty", label: "سيادة", isTarget: false },
          { id: "osmosis", label: "تناضح", isTarget: true },
          { id: "epistemology", label: "نظرية المعرفة", isTarget: false },
          { id: "homeostasis", label: "التوازن الداخلي", isTarget: true },
          { id: "jurisprudence", label: "فقه قانوني", isTarget: false },
          { id: "catalyst", label: "محفّز", isTarget: true },
          { id: "hermeneutics", label: "تأويلية", isTarget: false },
          { id: "mutation", label: "طفرة", isTarget: true },
          { id: "axiom", label: "مسلّمة", isTarget: false },
          { id: "synthesis", label: "تخليق", isTarget: true },
          { id: "dialectic", label: "جدلية", isTarget: false },
        ],
      },
    },
  },
  {
    id: "selective-secondary-b",
    level: "secondary",
    content: {
      en: {
        topic: "Chemistry terms",
        items: [
          { id: "electrolysis", label: "Electrolysis", isTarget: true },
          { id: "metaphysics", label: "Metaphysics", isTarget: false },
          { id: "precipitation", label: "Precipitation", isTarget: true },
          { id: "rhetoric", label: "Rhetoric", isTarget: false },
          { id: "titration", label: "Titration", isTarget: true },
          { id: "phenomenology", label: "Phenomenology", isTarget: false },
          { id: "isomer", label: "Isomer", isTarget: true },
          { id: "utilitarianism", label: "Utilitarianism", isTarget: false },
          { id: "equilibrium", label: "Equilibrium", isTarget: true },
          { id: "ontology", label: "Ontology", isTarget: false },
          { id: "polymer", label: "Polymer", isTarget: true },
          { id: "semiotics", label: "Semiotics", isTarget: false },
        ],
      },
      fr: {
        topic: "Termes de chimie",
        items: [
          { id: "electrolysis", label: "Électrolyse", isTarget: true },
          { id: "metaphysics", label: "Métaphysique", isTarget: false },
          { id: "precipitation", label: "Précipitation", isTarget: true },
          { id: "rhetoric", label: "Rhétorique", isTarget: false },
          { id: "titration", label: "Titration", isTarget: true },
          { id: "phenomenology", label: "Phénoménologie", isTarget: false },
          { id: "isomer", label: "Isomère", isTarget: true },
          { id: "utilitarianism", label: "Utilitarisme", isTarget: false },
          { id: "equilibrium", label: "Équilibre", isTarget: true },
          { id: "ontology", label: "Ontologie", isTarget: false },
          { id: "polymer", label: "Polymère", isTarget: true },
          { id: "semiotics", label: "Sémiotique", isTarget: false },
        ],
      },
      ar: {
        topic: "مصطلحات كيميائية",
        items: [
          { id: "electrolysis", label: "تحليل كهربائي", isTarget: true },
          { id: "metaphysics", label: "ميتافيزيقا", isTarget: false },
          { id: "precipitation", label: "ترسيب", isTarget: true },
          { id: "rhetoric", label: "بلاغة", isTarget: false },
          { id: "titration", label: "معايرة", isTarget: true },
          { id: "phenomenology", label: "ظاهراتية", isTarget: false },
          { id: "isomer", label: "متصاوغ", isTarget: true },
          { id: "utilitarianism", label: "نفعية", isTarget: false },
          { id: "equilibrium", label: "توازن", isTarget: true },
          { id: "ontology", label: "وجودية", isTarget: false },
          { id: "polymer", label: "بوليمر", isTarget: true },
          { id: "semiotics", label: "سيميائية", isTarget: false },
        ],
      },
    },
  },
  {
    id: "selective-secondary-c",
    level: "secondary",
    content: {
      en: {
        topic: "Physics terms",
        items: [
          { id: "momentum", label: "Momentum", isTarget: true },
          { id: "ideology", label: "Ideology", isTarget: false },
          { id: "electromagnetic", label: "Electromagnetic", isTarget: true },
          { id: "jurisprudence", label: "Jurisprudence", isTarget: false },
          { id: "thermodynamics", label: "Thermodynamics", isTarget: true },
          { id: "aesthetics", label: "Aesthetics", isTarget: false },
          { id: "quantum", label: "Quantum", isTarget: true },
          { id: "deontology", label: "Deontology", isTarget: false },
          { id: "resonance", label: "Resonance", isTarget: true },
          { id: "hermeneutics", label: "Hermeneutics", isTarget: false },
          { id: "interference", label: "Interference", isTarget: true },
          { id: "epistemology", label: "Epistemology", isTarget: false },
        ],
      },
      fr: {
        topic: "Termes de physique",
        items: [
          { id: "momentum", label: "Quantité de mouvement", isTarget: true },
          { id: "ideology", label: "Idéologie", isTarget: false },
          { id: "electromagnetic", label: "Électromagnétique", isTarget: true },
          { id: "jurisprudence", label: "Jurisprudence", isTarget: false },
          { id: "thermodynamics", label: "Thermodynamique", isTarget: true },
          { id: "aesthetics", label: "Esthétique", isTarget: false },
          { id: "quantum", label: "Quantique", isTarget: true },
          { id: "deontology", label: "Déontologie", isTarget: false },
          { id: "resonance", label: "Résonance", isTarget: true },
          { id: "hermeneutics", label: "Herméneutique", isTarget: false },
          { id: "interference", label: "Interférence", isTarget: true },
          { id: "epistemology", label: "Épistémologie", isTarget: false },
        ],
      },
      ar: {
        topic: "مصطلحات فيزيائية",
        items: [
          { id: "momentum", label: "زخم", isTarget: true },
          { id: "ideology", label: "أيديولوجية", isTarget: false },
          { id: "electromagnetic", label: "كهرومغناطيسي", isTarget: true },
          { id: "jurisprudence", label: "فقه قانوني", isTarget: false },
          { id: "thermodynamics", label: "ديناميكا حرارية", isTarget: true },
          { id: "aesthetics", label: "جماليات", isTarget: false },
          { id: "quantum", label: "كمّي", isTarget: true },
          { id: "deontology", label: "واجبية أخلاقية", isTarget: false },
          { id: "resonance", label: "رنين", isTarget: true },
          { id: "hermeneutics", label: "تأويلية", isTarget: false },
          { id: "interference", label: "تداخل", isTarget: true },
          { id: "epistemology", label: "نظرية المعرفة", isTarget: false },
        ],
      },
    },
  },
];

// SECONDARY GO/NO-GO — same structure as middle
export const GO_NO_GO_POOL_SECONDARY = [
  {
    id: "gng-secondary-a",
    level: "secondary",
    content: {
      en: { target: "X", sequence: ["P","X","Q","R","X","S","T","X","U","V","X","W","Y","X","Z","A","X","B","C","X"] },
      fr: { target: "X", sequence: ["P","X","Q","R","X","S","T","X","U","V","X","W","Y","X","Z","A","X","B","C","X"] },
      ar: { target: "X", sequence: ["P","X","Q","R","X","S","T","X","U","V","X","W","Y","X","Z","A","X","B","C","X"] },
    },
  },
  {
    id: "gng-secondary-b",
    level: "secondary",
    content: {
      en: { target: "X", sequence: ["D","E","X","F","G","X","H","I","J","X","K","L","X","M","N","X","O","P","X","Q"] },
      fr: { target: "X", sequence: ["D","E","X","F","G","X","H","I","J","X","K","L","X","M","N","X","O","P","X","Q"] },
      ar: { target: "X", sequence: ["D","E","X","F","G","X","H","I","J","X","K","L","X","M","N","X","O","P","X","Q"] },
    },
  },
  {
    id: "gng-secondary-c",
    level: "secondary",
    content: {
      en: { target: "X", sequence: ["R","X","S","T","U","X","V","W","X","Y","Z","X","A","B","C","X","D","X","E","F"] },
      fr: { target: "X", sequence: ["R","X","S","T","U","X","V","W","X","Y","Z","X","A","B","C","X","D","X","E","F"] },
      ar: { target: "X", sequence: ["R","X","S","T","U","X","V","W","X","Y","Z","X","A","B","C","X","D","X","E","F"] },
    },
  },
];

// SECONDARY MEMORY — 5 steps, abstract academic
export const MEMORY_SEQUENCE_POOL_SECONDARY = [
  {
    id: "memory-secondary-a",
    level: "secondary",
    content: {
      en: {
        steps: [
          "Identify the research question",
          "Locate primary and secondary sources",
          "Annotate key arguments",
          "Synthesise evidence across sources",
          "Draft a position statement",
        ],
      },
      fr: {
        steps: [
          "Identifier la question de recherche",
          "Localiser les sources primaires et secondaires",
          "Annoter les arguments clés",
          "Synthétiser les preuves de différentes sources",
          "Rédiger une déclaration de position",
        ],
      },
      ar: {
        steps: [
          "تحديد سؤال البحث",
          "البحث في المصادر الأولية والثانوية",
          "تعليق على الحجج الرئيسية",
          "تركيب الأدلة من مصادر متعددة",
          "صياغة بيان موقف",
        ],
      },
    },
  },
  {
    id: "memory-secondary-b",
    level: "secondary",
    content: {
      en: {
        steps: [
          "State the hypothesis clearly",
          "Design a controlled experiment",
          "Record variables and observations",
          "Analyse patterns in the data",
          "Evaluate whether results support the hypothesis",
        ],
      },
      fr: {
        steps: [
          "Énoncer clairement l'hypothèse",
          "Concevoir une expérience contrôlée",
          "Enregistrer les variables et observations",
          "Analyser les schémas dans les données",
          "Évaluer si les résultats soutiennent l'hypothèse",
        ],
      },
      ar: {
        steps: [
          "صياغة الفرضية بوضوح",
          "تصميم تجربة ضابطة",
          "تسجيل المتغيرات والملاحظات",
          "تحليل الأنماط في البيانات",
          "تقييم ما إذا كانت النتائج تدعم الفرضية",
        ],
      },
    },
  },
  {
    id: "memory-secondary-c",
    level: "secondary",
    content: {
      en: {
        steps: [
          "Deconstruct the essay prompt",
          "Outline the argument structure",
          "Select relevant textual evidence",
          "Draft each paragraph with a clear topic sentence",
          "Review coherence and transitions",
        ],
      },
      fr: {
        steps: [
          "Déconstruire la consigne de dissertation",
          "Structurer le plan de l'argumentation",
          "Sélectionner des preuves textuelles pertinentes",
          "Rédiger chaque paragraphe avec une phrase-clé",
          "Vérifier la cohérence et les transitions",
        ],
      },
      ar: {
        steps: [
          "تفكيك سؤال المقال",
          "تحديد هيكل الحجة",
          "اختيار الأدلة النصية ذات الصلة",
          "كتابة كل فقرة بجملة موضوع واضحة",
          "مراجعة التماسك والانتقالات",
        ],
      },
    },
  },
];

// SECONDARY MULTISTEP — abstract analytical scenarios
export const MULTISTEP_POOL_SECONDARY = [
  {
    id: "multistep-secondary-a",
    level: "secondary",
    content: {
      en: {
        note: "In a chemistry investigation, students tested the effect of temperature on enzyme activity. They prepared identical enzyme solutions at three different temperatures, measured the reaction rate for each, and plotted the data on a graph to identify the optimal temperature.",
        mainIdeaOptions: [
          { id: "temp-affects-enzyme", label: "Temperature significantly affects enzyme activity and has an optimal range.", isCorrect: true },
          { id: "enzymes-work-always", label: "Enzymes work equally well at all temperatures.", isCorrect: false },
          { id: "graph-only", label: "The main purpose of the investigation was to practise graphing skills.", isCorrect: false },
        ],
        order: [
          { id: "prepare-solutions", label: "Prepare identical enzyme solutions at different temperatures." },
          { id: "measure-rate", label: "Measure the reaction rate for each temperature." },
          { id: "plot-graph", label: "Plot the data and identify the optimal temperature." },
        ],
        titleOptions: [
          { id: "enzyme-title", label: "How temperature affects enzyme activity", isCorrect: true },
          { id: "chemistry-title", label: "Basic chemistry investigation techniques", isCorrect: false },
          { id: "graph-title", label: "Why scientists use graphs in investigations", isCorrect: false },
        ],
      },
      fr: {
        note: "Lors d'une investigation en chimie, les élèves ont testé l'effet de la température sur l'activité enzymatique. Ils ont préparé des solutions enzymatiques identiques à trois températures différentes, mesuré le taux de réaction pour chacune et tracé les données sur un graphique pour identifier la température optimale.",
        mainIdeaOptions: [
          { id: "temp-affects-enzyme", label: "La température affecte significativement l'activité enzymatique et a une plage optimale.", isCorrect: true },
          { id: "enzymes-work-always", label: "Les enzymes fonctionnent aussi bien à toutes les températures.", isCorrect: false },
          { id: "graph-only", label: "L'objectif principal était de pratiquer les compétences en graphisme.", isCorrect: false },
        ],
        order: [
          { id: "prepare-solutions", label: "Préparer des solutions enzymatiques identiques à différentes températures." },
          { id: "measure-rate", label: "Mesurer le taux de réaction pour chaque température." },
          { id: "plot-graph", label: "Tracer les données et identifier la température optimale." },
        ],
        titleOptions: [
          { id: "enzyme-title", label: "Comment la température affecte l'activité enzymatique", isCorrect: true },
          { id: "chemistry-title", label: "Techniques d'investigation chimique de base", isCorrect: false },
          { id: "graph-title", label: "Pourquoi les scientifiques utilisent des graphiques", isCorrect: false },
        ],
      },
      ar: {
        note: "في تحقيق كيميائي، اختبر الطلاب تأثير درجة الحرارة على نشاط الإنزيم. حضّروا محاليل إنزيم متطابقة عند ثلاث درجات حرارة مختلفة، وقاسوا معدل التفاعل لكل منها، ورسموا البيانات على رسم بياني لتحديد درجة الحرارة المثلى.",
        mainIdeaOptions: [
          { id: "temp-affects-enzyme", label: "درجة الحرارة تؤثر بشكل كبير على نشاط الإنزيم ولها نطاق مثالي.", isCorrect: true },
          { id: "enzymes-work-always", label: "تعمل الإنزيمات بشكل متساوٍ عند جميع درجات الحرارة.", isCorrect: false },
          { id: "graph-only", label: "الغرض الرئيسي من التحقيق كان التدرب على مهارات رسم البيانات.", isCorrect: false },
        ],
        order: [
          { id: "prepare-solutions", label: "تحضير محاليل إنزيم متطابقة عند درجات حرارة مختلفة." },
          { id: "measure-rate", label: "قياس معدل التفاعل لكل درجة حرارة." },
          { id: "plot-graph", label: "رسم البيانات وتحديد درجة الحرارة المثلى." },
        ],
        titleOptions: [
          { id: "enzyme-title", label: "كيف تؤثر درجة الحرارة على نشاط الإنزيم", isCorrect: true },
          { id: "chemistry-title", label: "تقنيات التحقيق الكيميائي الأساسية", isCorrect: false },
          { id: "graph-title", label: "لماذا يستخدم العلماء الرسوم البيانية في التحقيقات", isCorrect: false },
        ],
      },
    },
  },
  {
    id: "multistep-secondary-b",
    level: "secondary",
    content: {
      en: {
        note: "In an economics lesson, students analysed the impact of supply and demand on pricing. They examined case studies of two markets, compared how each responded to a sudden shortage, and evaluated government intervention strategies.",
        mainIdeaOptions: [
          { id: "shortage-pricing", label: "Supply shortages drive up prices and may require regulatory responses.", isCorrect: true },
          { id: "price-fixed", label: "Prices are always fixed regardless of supply and demand.", isCorrect: false },
          { id: "govt-wrong", label: "Government intervention always makes markets worse.", isCorrect: false },
        ],
        order: [
          { id: "examine-cases", label: "Examine case studies of two markets." },
          { id: "compare-response", label: "Compare how each responded to a sudden shortage." },
          { id: "evaluate-intervention", label: "Evaluate government intervention strategies." },
        ],
        titleOptions: [
          { id: "shortage-title", label: "How supply shortages affect prices and policy", isCorrect: true },
          { id: "market-title", label: "An introduction to market case studies", isCorrect: false },
          { id: "govt-title", label: "Why governments intervene in markets", isCorrect: false },
        ],
      },
      fr: {
        note: "Dans un cours d'économie, les élèves ont analysé l'impact de l'offre et de la demande sur les prix. Ils ont examiné des études de cas de deux marchés, comparé leurs réponses à une pénurie soudaine et évalué les stratégies d'intervention gouvernementale.",
        mainIdeaOptions: [
          { id: "shortage-pricing", label: "Les pénuries d'offre font monter les prix et peuvent nécessiter des réponses réglementaires.", isCorrect: true },
          { id: "price-fixed", label: "Les prix sont toujours fixes indépendamment de l'offre et de la demande.", isCorrect: false },
          { id: "govt-wrong", label: "L'intervention gouvernementale aggrave toujours les marchés.", isCorrect: false },
        ],
        order: [
          { id: "examine-cases", label: "Examiner des études de cas de deux marchés." },
          { id: "compare-response", label: "Comparer leurs réponses à une pénurie soudaine." },
          { id: "evaluate-intervention", label: "Évaluer les stratégies d'intervention gouvernementale." },
        ],
        titleOptions: [
          { id: "shortage-title", label: "Comment les pénuries d'offre affectent les prix et les politiques", isCorrect: true },
          { id: "market-title", label: "Introduction aux études de cas de marchés", isCorrect: false },
          { id: "govt-title", label: "Pourquoi les gouvernements interviennent dans les marchés", isCorrect: false },
        ],
      },
      ar: {
        note: "في درس اقتصاد، حلّل الطلاب تأثير العرض والطلب على التسعير. فحصوا دراسات حالة لسوقين، وقارنوا كيف استجاب كل منهما لنقص مفاجئ، وقيّموا استراتيجيات تدخل الحكومة.",
        mainIdeaOptions: [
          { id: "shortage-pricing", label: "تؤدي ندرة العرض إلى ارتفاع الأسعار وقد تتطلب استجابات تنظيمية.", isCorrect: true },
          { id: "price-fixed", label: "الأسعار دائماً ثابتة بغض النظر عن العرض والطلب.", isCorrect: false },
          { id: "govt-wrong", label: "تدخل الحكومة يجعل الأسواق دائماً أسوأ.", isCorrect: false },
        ],
        order: [
          { id: "examine-cases", label: "فحص دراسات حالة لسوقين." },
          { id: "compare-response", label: "مقارنة استجابة كل سوق لنقص مفاجئ." },
          { id: "evaluate-intervention", label: "تقييم استراتيجيات تدخل الحكومة." },
        ],
        titleOptions: [
          { id: "shortage-title", label: "كيف تؤثر ندرة العرض على الأسعار والسياسات", isCorrect: true },
          { id: "market-title", label: "مقدمة في دراسات حالة الأسواق", isCorrect: false },
          { id: "govt-title", label: "لماذا تتدخل الحكومات في الأسواق", isCorrect: false },
        ],
      },
    },
  },
  {
    id: "multistep-secondary-c",
    level: "secondary",
    content: {
      en: {
        note: "During a literature class, students analysed a poem's use of imagery and tone. They identified recurring metaphors, traced how the tone shifted across stanzas, and connected these elements to the poem's central theme of loss.",
        mainIdeaOptions: [
          { id: "imagery-tone", label: "Imagery and shifting tone work together to convey the theme of loss.", isCorrect: true },
          { id: "poem-long", label: "Longer poems always use more metaphors than shorter ones.", isCorrect: false },
          { id: "tone-fixed", label: "The tone in a poem must stay the same throughout.", isCorrect: false },
        ],
        order: [
          { id: "identify-metaphors", label: "Identify recurring metaphors in the poem." },
          { id: "trace-tone", label: "Trace how the tone shifts across stanzas." },
          { id: "connect-theme", label: "Connect imagery and tone to the theme of loss." },
        ],
        titleOptions: [
          { id: "imagery-title", label: "How imagery and tone convey the theme of loss", isCorrect: true },
          { id: "poetry-title", label: "An introduction to reading poetry closely", isCorrect: false },
          { id: "metaphor-title", label: "Why metaphors are used in literature", isCorrect: false },
        ],
      },
      fr: {
        note: "Lors d'un cours de littérature, les élèves ont analysé l'utilisation des images et du ton dans un poème. Ils ont identifié les métaphores récurrentes, retracé comment le ton évoluait entre les strophes et relié ces éléments au thème central de la perte.",
        mainIdeaOptions: [
          { id: "imagery-tone", label: "Les images et le ton changeant travaillent ensemble pour transmettre le thème de la perte.", isCorrect: true },
          { id: "poem-long", label: "Les poèmes plus longs utilisent toujours plus de métaphores que les courts.", isCorrect: false },
          { id: "tone-fixed", label: "Le ton d'un poème doit rester le même tout au long.", isCorrect: false },
        ],
        order: [
          { id: "identify-metaphors", label: "Identifier les métaphores récurrentes dans le poème." },
          { id: "trace-tone", label: "Retracer comment le ton évolue entre les strophes." },
          { id: "connect-theme", label: "Relier images et ton au thème de la perte." },
        ],
        titleOptions: [
          { id: "imagery-title", label: "Comment les images et le ton transmettent le thème de la perte", isCorrect: true },
          { id: "poetry-title", label: "Introduction à la lecture approfondie de la poésie", isCorrect: false },
          { id: "metaphor-title", label: "Pourquoi les métaphores sont utilisées en littérature", isCorrect: false },
        ],
      },
      ar: {
        note: "خلال درس أدب، حلّل الطلاب استخدام الصور والنبرة في قصيدة. حددوا الاستعارات المتكررة، وتتبعوا كيف تحولت النبرة عبر المقاطع، وربطوا هذه العناصر بالموضوع المحوري للقصيدة عن الخسارة.",
        mainIdeaOptions: [
          { id: "imagery-tone", label: "تعمل الصور والنبرة المتحولة معاً لنقل موضوع الخسارة.", isCorrect: true },
          { id: "poem-long", label: "القصائد الطويلة دائماً تستخدم استعارات أكثر من القصيرة.", isCorrect: false },
          { id: "tone-fixed", label: "يجب أن تبقى نبرة القصيدة ثابتة طوالها.", isCorrect: false },
        ],
        order: [
          { id: "identify-metaphors", label: "تحديد الاستعارات المتكررة في القصيدة." },
          { id: "trace-tone", label: "تتبع كيف تتحول النبرة عبر المقاطع." },
          { id: "connect-theme", label: "ربط الصور والنبرة بموضوع الخسارة." },
        ],
        titleOptions: [
          { id: "imagery-title", label: "كيف تنقل الصور والنبرة موضوع الخسارة", isCorrect: true },
          { id: "poetry-title", label: "مقدمة في القراءة المعمّقة للشعر", isCorrect: false },
          { id: "metaphor-title", label: "لماذا تُستخدم الاستعارات في الأدب", isCorrect: false },
        ],
      },
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCED LEVEL POOLS (ages 18+)
// ═══════════════════════════════════════════════════════════════════════════════

export const SELECTIVE_TERMS_POOL_ADVANCED = [
  {
    id: "selective-advanced-a",
    level: "advanced",
    content: {
      en: {
        topic: "Neuroscience terms",
        items: [
          { id: "neuroplasticity", label: "Neuroplasticity", isTarget: true },
          { id: "federalism", label: "Federalism", isTarget: false },
          { id: "synaptic-pruning", label: "Synaptic pruning", isTarget: true },
          { id: "positivism", label: "Positivism", isTarget: false },
          { id: "cortisol", label: "Cortisol", isTarget: true },
          { id: "constructivism", label: "Constructivism", isTarget: false },
          { id: "hippocampus", label: "Hippocampus", isTarget: true },
          { id: "structuralism", label: "Structuralism", isTarget: false },
          { id: "dopamine", label: "Dopamine", isTarget: true },
          { id: "functionalism", label: "Functionalism", isTarget: false },
          { id: "axon", label: "Axon", isTarget: true },
          { id: "determinism", label: "Determinism", isTarget: false },
        ],
      },
      fr: {
        topic: "Termes de neurosciences",
        items: [
          { id: "neuroplasticity", label: "Neuroplasticité", isTarget: true },
          { id: "federalism", label: "Fédéralisme", isTarget: false },
          { id: "synaptic-pruning", label: "Élagage synaptique", isTarget: true },
          { id: "positivism", label: "Positivisme", isTarget: false },
          { id: "cortisol", label: "Cortisol", isTarget: true },
          { id: "constructivism", label: "Constructivisme", isTarget: false },
          { id: "hippocampus", label: "Hippocampe", isTarget: true },
          { id: "structuralism", label: "Structuralisme", isTarget: false },
          { id: "dopamine", label: "Dopamine", isTarget: true },
          { id: "functionalism", label: "Fonctionnalisme", isTarget: false },
          { id: "axon", label: "Axone", isTarget: true },
          { id: "determinism", label: "Déterminisme", isTarget: false },
        ],
      },
      ar: {
        topic: "مصطلحات علم الأعصاب",
        items: [
          { id: "neuroplasticity", label: "مرونة عصبية", isTarget: true },
          { id: "federalism", label: "فيدرالية", isTarget: false },
          { id: "synaptic-pruning", label: "تقليم متشابكي", isTarget: true },
          { id: "positivism", label: "وضعانية", isTarget: false },
          { id: "cortisol", label: "كورتيزول", isTarget: true },
          { id: "constructivism", label: "بنائية", isTarget: false },
          { id: "hippocampus", label: "حُصين", isTarget: true },
          { id: "structuralism", label: "بنيوية", isTarget: false },
          { id: "dopamine", label: "دوبامين", isTarget: true },
          { id: "functionalism", label: "وظيفانية", isTarget: false },
          { id: "axon", label: "محور عصبي", isTarget: true },
          { id: "determinism", label: "حتمية", isTarget: false },
        ],
      },
    },
  },
  {
    id: "selective-advanced-b",
    level: "advanced",
    content: {
      en: {
        topic: "Statistical terms",
        items: [
          { id: "regression", label: "Regression", isTarget: true },
          { id: "absolutism", label: "Absolutism", isTarget: false },
          { id: "variance", label: "Variance", isTarget: true },
          { id: "phenomenology", label: "Phenomenology", isTarget: false },
          { id: "covariance", label: "Covariance", isTarget: true },
          { id: "hegemony", label: "Hegemony", isTarget: false },
          { id: "p-value", label: "P-value", isTarget: true },
          { id: "teleology", label: "Teleology", isTarget: false },
          { id: "confidence-interval", label: "Confidence interval", isTarget: true },
          { id: "pragmatism", label: "Pragmatism", isTarget: false },
          { id: "null-hypothesis", label: "Null hypothesis", isTarget: true },
          { id: "nihilism", label: "Nihilism", isTarget: false },
        ],
      },
      fr: {
        topic: "Termes statistiques",
        items: [
          { id: "regression", label: "Régression", isTarget: true },
          { id: "absolutism", label: "Absolutisme", isTarget: false },
          { id: "variance", label: "Variance", isTarget: true },
          { id: "phenomenology", label: "Phénoménologie", isTarget: false },
          { id: "covariance", label: "Covariance", isTarget: true },
          { id: "hegemony", label: "Hégémonie", isTarget: false },
          { id: "p-value", label: "Valeur p", isTarget: true },
          { id: "teleology", label: "Téléologie", isTarget: false },
          { id: "confidence-interval", label: "Intervalle de confiance", isTarget: true },
          { id: "pragmatism", label: "Pragmatisme", isTarget: false },
          { id: "null-hypothesis", label: "Hypothèse nulle", isTarget: true },
          { id: "nihilism", label: "Nihilisme", isTarget: false },
        ],
      },
      ar: {
        topic: "مصطلحات إحصائية",
        items: [
          { id: "regression", label: "انحدار", isTarget: true },
          { id: "absolutism", label: "استبداد", isTarget: false },
          { id: "variance", label: "تباين", isTarget: true },
          { id: "phenomenology", label: "ظاهراتية", isTarget: false },
          { id: "covariance", label: "تغاير", isTarget: true },
          { id: "hegemony", label: "هيمنة", isTarget: false },
          { id: "p-value", label: "قيمة ب", isTarget: true },
          { id: "teleology", label: "غائية", isTarget: false },
          { id: "confidence-interval", label: "فترة الثقة", isTarget: true },
          { id: "pragmatism", label: "براغماتية", isTarget: false },
          { id: "null-hypothesis", label: "فرضية العدم", isTarget: true },
          { id: "nihilism", label: "عدمية", isTarget: false },
        ],
      },
    },
  },
  {
    id: "selective-advanced-c",
    level: "advanced",
    content: {
      en: {
        topic: "Research methodology terms",
        items: [
          { id: "triangulation", label: "Triangulation", isTarget: true },
          { id: "imperialism", label: "Imperialism", isTarget: false },
          { id: "epistemology", label: "Epistemology", isTarget: true },
          { id: "oligarchy", label: "Oligarchy", isTarget: false },
          { id: "grounded-theory", label: "Grounded theory", isTarget: true },
          { id: "utopia", label: "Utopia", isTarget: false },
          { id: "ethnography", label: "Ethnography", isTarget: true },
          { id: "revisionism", label: "Revisionism", isTarget: false },
          { id: "validity", label: "Validity", isTarget: true },
          { id: "colonialism", label: "Colonialism", isTarget: false },
          { id: "sampling-bias", label: "Sampling bias", isTarget: true },
          { id: "nationalism", label: "Nationalism", isTarget: false },
        ],
      },
      fr: {
        topic: "Termes de méthodologie de recherche",
        items: [
          { id: "triangulation", label: "Triangulation", isTarget: true },
          { id: "imperialism", label: "Impérialisme", isTarget: false },
          { id: "epistemology", label: "Épistémologie", isTarget: true },
          { id: "oligarchy", label: "Oligarchie", isTarget: false },
          { id: "grounded-theory", label: "Théorie ancrée", isTarget: true },
          { id: "utopia", label: "Utopie", isTarget: false },
          { id: "ethnography", label: "Ethnographie", isTarget: true },
          { id: "revisionism", label: "Révisionnisme", isTarget: false },
          { id: "validity", label: "Validité", isTarget: true },
          { id: "colonialism", label: "Colonialisme", isTarget: false },
          { id: "sampling-bias", label: "Biais d'échantillonnage", isTarget: true },
          { id: "nationalism", label: "Nationalisme", isTarget: false },
        ],
      },
      ar: {
        topic: "مصطلحات منهجية البحث",
        items: [
          { id: "triangulation", label: "التثليث", isTarget: true },
          { id: "imperialism", label: "إمبريالية", isTarget: false },
          { id: "epistemology", label: "نظرية المعرفة", isTarget: true },
          { id: "oligarchy", label: "أوليغارشية", isTarget: false },
          { id: "grounded-theory", label: "النظرية المرتكزة", isTarget: true },
          { id: "utopia", label: "يوتوبيا", isTarget: false },
          { id: "ethnography", label: "إثنوغرافيا", isTarget: true },
          { id: "revisionism", label: "مراجعية", isTarget: false },
          { id: "validity", label: "صدق", isTarget: true },
          { id: "colonialism", label: "استعمار", isTarget: false },
          { id: "sampling-bias", label: "تحيز أخذ العينات", isTarget: true },
          { id: "nationalism", label: "قومية", isTarget: false },
        ],
      },
    },
  },
];

// ADVANCED GO/NO-GO — same structure
export const GO_NO_GO_POOL_ADVANCED = [
  {
    id: "gng-advanced-a",
    level: "advanced",
    content: {
      en: { target: "X", sequence: ["G","H","X","I","J","K","X","L","M","X","N","O","P","X","Q","R","X","S","T","X"] },
      fr: { target: "X", sequence: ["G","H","X","I","J","K","X","L","M","X","N","O","P","X","Q","R","X","S","T","X"] },
      ar: { target: "X", sequence: ["G","H","X","I","J","K","X","L","M","X","N","O","P","X","Q","R","X","S","T","X"] },
    },
  },
  {
    id: "gng-advanced-b",
    level: "advanced",
    content: {
      en: { target: "X", sequence: ["U","V","W","X","Y","Z","X","A","B","X","C","D","E","X","F","G","X","H","I","X"] },
      fr: { target: "X", sequence: ["U","V","W","X","Y","Z","X","A","B","X","C","D","E","X","F","G","X","H","I","X"] },
      ar: { target: "X", sequence: ["U","V","W","X","Y","Z","X","A","B","X","C","D","E","X","F","G","X","H","I","X"] },
    },
  },
  {
    id: "gng-advanced-c",
    level: "advanced",
    content: {
      en: { target: "X", sequence: ["J","K","X","L","M","N","X","O","P","Q","X","R","S","X","T","U","V","X","W","X"] },
      fr: { target: "X", sequence: ["J","K","X","L","M","N","X","O","P","Q","X","R","S","X","T","U","V","X","W","X"] },
      ar: { target: "X", sequence: ["J","K","X","L","M","N","X","O","P","Q","X","R","S","X","T","U","V","X","W","X"] },
    },
  },
];

// ADVANCED MEMORY — 5 steps, workflow/synthesis focus
export const MEMORY_SEQUENCE_POOL_ADVANCED = [
  {
    id: "memory-advanced-a",
    level: "advanced",
    content: {
      en: {
        steps: [
          "Define the scope and research question",
          "Conduct a systematic literature review",
          "Critically appraise source reliability and bias",
          "Synthesise findings into a coherent argument",
          "Identify limitations and propose further research",
        ],
      },
      fr: {
        steps: [
          "Définir le périmètre et la question de recherche",
          "Effectuer une revue de littérature systématique",
          "Évaluer de manière critique la fiabilité et les biais des sources",
          "Synthétiser les résultats en un argument cohérent",
          "Identifier les limites et proposer des recherches supplémentaires",
        ],
      },
      ar: {
        steps: [
          "تحديد النطاق وسؤال البحث",
          "إجراء مراجعة منهجية للأدبيات",
          "التقييم النقدي لموثوقية المصادر والتحيز",
          "تركيب النتائج في حجة متماسكة",
          "تحديد القيود واقتراح أبحاث مستقبلية",
        ],
      },
    },
  },
  {
    id: "memory-advanced-b",
    level: "advanced",
    content: {
      en: {
        steps: [
          "Identify the core argument and stakeholder positions",
          "Map assumptions underlying each position",
          "Evaluate evidence quality and logical coherence",
          "Construct a counter-argument with supporting evidence",
          "Formulate a balanced, evidence-based conclusion",
        ],
      },
      fr: {
        steps: [
          "Identifier l'argument central et les positions des parties prenantes",
          "Cartographier les hypothèses sous-jacentes à chaque position",
          "Évaluer la qualité des preuves et la cohérence logique",
          "Construire un contre-argument avec des preuves à l'appui",
          "Formuler une conclusion équilibrée et fondée sur des preuves",
        ],
      },
      ar: {
        steps: [
          "تحديد الحجة المحورية ومواقف أصحاب المصلحة",
          "رسم خريطة الافتراضات الكامنة وراء كل موقف",
          "تقييم جودة الأدلة والتماسك المنطقي",
          "بناء حجة مضادة مع أدلة داعمة",
          "صياغة استنتاج متوازن قائم على الأدلة",
        ],
      },
    },
  },
  {
    id: "memory-advanced-c",
    level: "advanced",
    content: {
      en: {
        steps: [
          "Diagnose the problem and its systemic context",
          "Generate and evaluate solution alternatives",
          "Assess feasibility, risks, and trade-offs",
          "Select and justify the optimal course of action",
          "Design an implementation and evaluation plan",
        ],
      },
      fr: {
        steps: [
          "Diagnostiquer le problème et son contexte systémique",
          "Générer et évaluer des solutions alternatives",
          "Évaluer la faisabilité, les risques et les compromis",
          "Sélectionner et justifier la meilleure ligne d'action",
          "Concevoir un plan de mise en œuvre et d'évaluation",
        ],
      },
      ar: {
        steps: [
          "تشخيص المشكلة وسياقها المنهجي",
          "توليد وتقييم الحلول البديلة",
          "تقييم الجدوى والمخاطر والمقايضات",
          "اختيار وتبرير أفضل مسار للعمل",
          "تصميم خطة تنفيذ وتقييم",
        ],
      },
    },
  },
];

// ADVANCED MULTISTEP — synthesis/workflow scenarios
export const MULTISTEP_POOL_ADVANCED = [
  {
    id: "multistep-advanced-a",
    level: "advanced",
    content: {
      en: {
        note: "A research team conducted a meta-analysis of interventions targeting adolescent reading comprehension. They screened 200 studies for methodological rigour, extracted effect sizes from 45 qualifying studies, and used random-effects modelling to produce a pooled estimate, accounting for heterogeneity across contexts.",
        mainIdeaOptions: [
          { id: "meta-synthesis", label: "Systematic aggregation of evidence through meta-analysis produces more robust conclusions than individual studies.", isCorrect: true },
          { id: "any-study-valid", label: "All 200 studies were included because quantity of evidence matters most.", isCorrect: false },
          { id: "fixed-effects-only", label: "Fixed-effects modelling is always preferable to random-effects modelling.", isCorrect: false },
        ],
        order: [
          { id: "screen-studies", label: "Screen 200 studies for methodological rigour." },
          { id: "extract-effects", label: "Extract effect sizes from 45 qualifying studies." },
          { id: "model-pooled", label: "Apply random-effects modelling to produce a pooled estimate." },
        ],
        titleOptions: [
          { id: "metaanalysis-title", label: "How meta-analysis synthesises evidence on reading interventions", isCorrect: true },
          { id: "screening-title", label: "Why screening is the most important part of research", isCorrect: false },
          { id: "effects-title", label: "The role of effect sizes in educational research", isCorrect: false },
        ],
      },
      fr: {
        note: "Une équipe de recherche a effectué une méta-analyse d'interventions ciblant la compréhension en lecture des adolescents. Ils ont sélectionné 200 études selon leur rigueur méthodologique, extrait les tailles d'effet de 45 études qualifiantes et utilisé la modélisation à effets aléatoires pour produire une estimation groupée, en tenant compte de l'hétérogénéité.",
        mainIdeaOptions: [
          { id: "meta-synthesis", label: "L'agrégation systématique de preuves via la méta-analyse produit des conclusions plus robustes que les études individuelles.", isCorrect: true },
          { id: "any-study-valid", label: "Les 200 études ont été incluses car la quantité prime.", isCorrect: false },
          { id: "fixed-effects-only", label: "La modélisation à effets fixes est toujours préférable aux effets aléatoires.", isCorrect: false },
        ],
        order: [
          { id: "screen-studies", label: "Sélectionner 200 études selon leur rigueur méthodologique." },
          { id: "extract-effects", label: "Extraire les tailles d'effet des 45 études qualifiantes." },
          { id: "model-pooled", label: "Appliquer la modélisation à effets aléatoires pour une estimation groupée." },
        ],
        titleOptions: [
          { id: "metaanalysis-title", label: "Comment la méta-analyse synthétise les preuves sur les interventions en lecture", isCorrect: true },
          { id: "screening-title", label: "Pourquoi la sélection est la partie la plus importante de la recherche", isCorrect: false },
          { id: "effects-title", label: "Le rôle des tailles d'effet dans la recherche éducative", isCorrect: false },
        ],
      },
      ar: {
        note: "أجرى فريق بحثي تحليلاً تلوياً للتدخلات التي تستهدف فهم القراءة لدى المراهقين. قاموا بفحص 200 دراسة للتحقق من صرامتها المنهجية، واستخرجوا أحجام التأثير من 45 دراسة مؤهلة، واستخدموا نمذجة التأثيرات العشوائية لإنتاج تقدير مجمّع، مع مراعاة التباين عبر السياقات.",
        mainIdeaOptions: [
          { id: "meta-synthesis", label: "يُنتج التجميع المنهجي للأدلة عبر التحليل التلوي استنتاجات أكثر متانة من الدراسات الفردية.", isCorrect: true },
          { id: "any-study-valid", label: "تم تضمين جميع الدراسات الـ200 لأن كمية الأدلة هي الأهم.", isCorrect: false },
          { id: "fixed-effects-only", label: "نمذجة التأثيرات الثابتة دائماً أفضل من التأثيرات العشوائية.", isCorrect: false },
        ],
        order: [
          { id: "screen-studies", label: "فحص 200 دراسة للصرامة المنهجية." },
          { id: "extract-effects", label: "استخراج أحجام التأثير من 45 دراسة مؤهلة." },
          { id: "model-pooled", label: "تطبيق نمذجة التأثيرات العشوائية لإنتاج تقدير مجمّع." },
        ],
        titleOptions: [
          { id: "metaanalysis-title", label: "كيف يُركّب التحليل التلوي الأدلة حول تدخلات القراءة", isCorrect: true },
          { id: "screening-title", label: "لماذا الفحص هو الجزء الأهم في البحث", isCorrect: false },
          { id: "effects-title", label: "دور أحجام التأثير في البحث التربوي", isCorrect: false },
        ],
      },
    },
  },
  {
    id: "multistep-advanced-b",
    level: "advanced",
    content: {
      en: {
        note: "A policy analyst reviewed the effectiveness of carbon pricing mechanisms across six OECD countries. The analysis involved mapping existing policy instruments, comparing revenue recycling strategies, and modelling emissions trajectories under different price scenarios to assess long-term climate impact.",
        mainIdeaOptions: [
          { id: "carbon-pricing-complex", label: "Effective carbon pricing requires contextual analysis of policy design, revenue use, and emissions modelling.", isCorrect: true },
          { id: "uniform-price", label: "A single uniform carbon price is always the most effective approach.", isCorrect: false },
          { id: "oecd-only", label: "Carbon pricing only works effectively in OECD countries.", isCorrect: false },
        ],
        order: [
          { id: "map-instruments", label: "Map existing carbon policy instruments across six OECD countries." },
          { id: "compare-recycling", label: "Compare revenue recycling strategies across countries." },
          { id: "model-trajectories", label: "Model emissions trajectories under different price scenarios." },
        ],
        titleOptions: [
          { id: "carbon-title", label: "Evaluating carbon pricing effectiveness across policy contexts", isCorrect: true },
          { id: "oecd-title", label: "An overview of OECD environmental policy", isCorrect: false },
          { id: "revenue-title", label: "Why revenue recycling is the key to carbon policy", isCorrect: false },
        ],
      },
      fr: {
        note: "Un analyste des politiques a examiné l'efficacité des mécanismes de tarification du carbone dans six pays de l'OCDE. L'analyse comprenait la cartographie des instruments politiques existants, la comparaison des stratégies de recyclage des revenus et la modélisation des trajectoires d'émissions dans différents scénarios de prix.",
        mainIdeaOptions: [
          { id: "carbon-pricing-complex", label: "Une tarification efficace du carbone nécessite une analyse contextuelle de la conception des politiques, de l'utilisation des revenus et de la modélisation des émissions.", isCorrect: true },
          { id: "uniform-price", label: "Un prix du carbone uniforme unique est toujours l'approche la plus efficace.", isCorrect: false },
          { id: "oecd-only", label: "La tarification du carbone ne fonctionne efficacement que dans les pays de l'OCDE.", isCorrect: false },
        ],
        order: [
          { id: "map-instruments", label: "Cartographier les instruments de politique carbone dans six pays de l'OCDE." },
          { id: "compare-recycling", label: "Comparer les stratégies de recyclage des revenus entre pays." },
          { id: "model-trajectories", label: "Modéliser les trajectoires d'émissions dans différents scénarios de prix." },
        ],
        titleOptions: [
          { id: "carbon-title", label: "Évaluer l'efficacité de la tarification du carbone selon les contextes", isCorrect: true },
          { id: "oecd-title", label: "Aperçu des politiques environnementales de l'OCDE", isCorrect: false },
          { id: "revenue-title", label: "Pourquoi le recyclage des revenus est la clé de la politique carbone", isCorrect: false },
        ],
      },
      ar: {
        note: "راجع محلل سياسات فاعلية آليات تسعير الكربون عبر ست دول في منظمة التعاون الاقتصادي والتنمية. تضمن التحليل رسم خريطة لأدوات السياسة الحالية، ومقارنة استراتيجيات إعادة تدوير الإيرادات، ونمذجة مسارات الانبعاثات في ظل سيناريوهات أسعار مختلفة لتقييم التأثير المناخي طويل الأمد.",
        mainIdeaOptions: [
          { id: "carbon-pricing-complex", label: "يتطلب تسعير الكربون الفعّال تحليلاً سياقياً لتصميم السياسات وإيرادات الاستخدام ونمذجة الانبعاثات.", isCorrect: true },
          { id: "uniform-price", label: "سعر كربون موحد واحد هو دائماً النهج الأكثر فاعلية.", isCorrect: false },
          { id: "oecd-only", label: "تسعير الكربون يعمل بفاعلية فقط في دول منظمة التعاون الاقتصادي.", isCorrect: false },
        ],
        order: [
          { id: "map-instruments", label: "رسم خريطة لأدوات سياسة الكربون في ست دول." },
          { id: "compare-recycling", label: "مقارنة استراتيجيات إعادة تدوير الإيرادات بين الدول." },
          { id: "model-trajectories", label: "نمذجة مسارات الانبعاثات في ظل سيناريوهات أسعار مختلفة." },
        ],
        titleOptions: [
          { id: "carbon-title", label: "تقييم فاعلية تسعير الكربون عبر السياقات السياسية", isCorrect: true },
          { id: "oecd-title", label: "نظرة عامة على السياسة البيئية لمنظمة التعاون الاقتصادي", isCorrect: false },
          { id: "revenue-title", label: "لماذا إعادة تدوير الإيرادات هي مفتاح سياسة الكربون", isCorrect: false },
        ],
      },
    },
  },
  {
    id: "multistep-advanced-c",
    level: "advanced",
    content: {
      en: {
        note: "A software development team applied agile methodology to redesign a legacy healthcare information system. They conducted stakeholder interviews to gather requirements, prioritised features using a value-versus-complexity matrix, and ran two-week sprints with retrospective reviews to continuously improve the delivery process.",
        mainIdeaOptions: [
          { id: "agile-iterative", label: "Agile methodology enables iterative, stakeholder-driven system redesign with continuous improvement.", isCorrect: true },
          { id: "waterfall-better", label: "Waterfall methodology is always more efficient than agile for complex systems.", isCorrect: false },
          { id: "matrix-only", label: "Feature prioritisation matrices are the most critical component of any software project.", isCorrect: false },
        ],
        order: [
          { id: "gather-requirements", label: "Conduct stakeholder interviews to gather requirements." },
          { id: "prioritise-features", label: "Prioritise features using a value-versus-complexity matrix." },
          { id: "run-sprints", label: "Run two-week sprints with retrospective reviews." },
        ],
        titleOptions: [
          { id: "agile-title", label: "How agile methodology supports iterative healthcare system redesign", isCorrect: true },
          { id: "sprint-title", label: "The importance of two-week sprints in software delivery", isCorrect: false },
          { id: "legacy-title", label: "Why legacy systems should be replaced immediately", isCorrect: false },
        ],
      },
      fr: {
        note: "Une équipe de développement logiciel a appliqué la méthodologie agile pour reconcevoir un système d'information de santé ancien. Ils ont mené des entretiens avec les parties prenantes pour recueillir les exigences, priorisé les fonctionnalités à l'aide d'une matrice valeur/complexité et effectué des sprints de deux semaines avec des rétrospectives.",
        mainIdeaOptions: [
          { id: "agile-iterative", label: "La méthodologie agile permet une refonte itérative et pilotée par les parties prenantes avec amélioration continue.", isCorrect: true },
          { id: "waterfall-better", label: "La méthodologie en cascade est toujours plus efficace pour les systèmes complexes.", isCorrect: false },
          { id: "matrix-only", label: "Les matrices de priorisation sont le composant le plus critique de tout projet logiciel.", isCorrect: false },
        ],
        order: [
          { id: "gather-requirements", label: "Mener des entretiens avec les parties prenantes pour recueillir les exigences." },
          { id: "prioritise-features", label: "Prioriser les fonctionnalités avec une matrice valeur/complexité." },
          { id: "run-sprints", label: "Effectuer des sprints de deux semaines avec des rétrospectives." },
        ],
        titleOptions: [
          { id: "agile-title", label: "Comment la méthodologie agile soutient la refonte itérative des systèmes de santé", isCorrect: true },
          { id: "sprint-title", label: "L'importance des sprints de deux semaines dans la livraison logicielle", isCorrect: false },
          { id: "legacy-title", label: "Pourquoi les systèmes anciens doivent être remplacés immédiatement", isCorrect: false },
        ],
      },
      ar: {
        note: "طبّق فريق تطوير برمجيات منهجية أجايل لإعادة تصميم نظام معلومات صحية قديم. أجروا مقابلات مع أصحاب المصلحة لجمع المتطلبات، وحددوا أولويات الميزات باستخدام مصفوفة القيمة مقابل التعقيد، وأجروا سباقات سرعة لأسبوعين مع مراجعات استعادية لتحسين عملية التسليم باستمرار.",
        mainIdeaOptions: [
          { id: "agile-iterative", label: "تتيح منهجية أجايل إعادة تصميم تكرارية تقودها أصحاب المصلحة مع تحسين مستمر.", isCorrect: true },
          { id: "waterfall-better", label: "منهجية الشلال دائماً أكثر كفاءة من أجايل للأنظمة المعقدة.", isCorrect: false },
          { id: "matrix-only", label: "مصفوفات تحديد الأولويات هي المكون الأكثر أهمية في أيّ مشروع برمجي.", isCorrect: false },
        ],
        order: [
          { id: "gather-requirements", label: "إجراء مقابلات مع أصحاب المصلحة لجمع المتطلبات." },
          { id: "prioritise-features", label: "تحديد أولويات الميزات باستخدام مصفوفة القيمة مقابل التعقيد." },
          { id: "run-sprints", label: "تشغيل سباقات سرعة لأسبوعين مع مراجعات استعادية." },
        ],
        titleOptions: [
          { id: "agile-title", label: "كيف تدعم منهجية أجايل إعادة التصميم التكرارية لأنظمة الرعاية الصحية", isCorrect: true },
          { id: "sprint-title", label: "أهمية سباقات السرعة لأسبوعين في تسليم البرمجيات", isCorrect: false },
          { id: "legacy-title", label: "لماذا يجب استبدال الأنظمة القديمة فوراً", isCorrect: false },
        ],
      },
    },
  },
];
