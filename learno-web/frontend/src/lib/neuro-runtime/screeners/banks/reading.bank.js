/**
 * reading.bank.js
 *
 * Item banks for the Reading Check screener.
 * Each pool has 3 variants ensuring equivalent difficulty.
 *
 * Constraints:
 *  - WORD_ITEMS: each set has exactly 3 items; each item has 1 correct + 3 distractors (4 options total)
 *  - PASSAGE: each passage has exactly 2 questions
 *  - RECONSTRUCTION: each set has exactly 7 words forming one valid sentence
 *  - MODALITY: each set has 1 text-only item + 1 audio-supported item
 */

// ─── WORD DISCRIMINATION ITEMS ───────────────────────────────────────────────

export const WORD_ITEMS_POOL = [
  {
    id: "words-a",
    content: {
      en: {
        items: [
          {
            id: "library",
            sentence: "The class visited the ____ to borrow research books.",
            options: ["library", "libary", "librery", "libray"],
            correct: "library",
            confusionType: "similar-looking word",
          },
          {
            id: "coast",
            sentence: "The school trip ended near the rocky ____.",
            options: ["coast", "cost", "toast", "coats"],
            correct: "coast",
            confusionType: "similar-sounding word",
          },
          {
            id: "evidence",
            sentence: "Students used the chart as ____ for their conclusion.",
            options: ["evidence", "evidance", "evedence", "evidencee"],
            correct: "evidence",
            confusionType: "orthographic decoding",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "library",
            sentence: "La classe a visité la ____ pour emprunter des livres.",
            options: ["bibliothèque", "biblioteque", "bibliotheque", "bibliothèque"],
            correct: "bibliothèque",
            confusionType: "mot d'orthographe similaire",
          },
          {
            id: "coast",
            sentence: "La sortie scolaire s'est terminée près de la ____ rocheuse.",
            options: ["côte", "cote", "coûte", "cotte"],
            correct: "côte",
            confusionType: "mot sonorité similaire",
          },
          {
            id: "evidence",
            sentence: "Les élèves ont utilisé le graphique comme ____ pour leur conclusion.",
            options: ["preuve", "prueve", "prève", "prêuve"],
            correct: "preuve",
            confusionType: "décodage orthographique",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "library",
            sentence: "زارت الفصل ____ لاستعارة كتب البحث.",
            options: ["المكتبة", "المكتبه", "المكتبا", "المكتبي"],
            correct: "المكتبة",
            confusionType: "كلمة بشكل مشابه",
          },
          {
            id: "coast",
            sentence: "انتهت الرحلة المدرسية بالقرب من ____ الصخرية.",
            options: ["الساحل", "السحال", "الساهل", "الساجل"],
            correct: "الساحل",
            confusionType: "كلمة بصوت مشابه",
          },
          {
            id: "evidence",
            sentence: "استخدم الطلاب المخطط كـ____ لاستنتاجهم.",
            options: ["دليل", "دلبل", "دليلل", "دلال"],
            correct: "دليل",
            confusionType: "فك تشفير إملائي",
          },
        ],
      },
    },
  },
  {
    id: "words-b",
    content: {
      en: {
        items: [
          {
            id: "ancient",
            sentence: "The museum displayed ____ pottery from early civilizations.",
            options: ["ancient", "anciant", "ancent", "ancietn"],
            correct: "ancient",
            confusionType: "orthographic decoding",
          },
          {
            id: "thorough",
            sentence: "The scientist conducted a ____ review of all the data.",
            options: ["thorough", "through", "though", "thourough"],
            correct: "thorough",
            confusionType: "similar-sounding word",
          },
          {
            id: "parallel",
            sentence: "The two lines on the graph ran ____ to each other.",
            options: ["parallel", "paralel", "parralel", "parrallel"],
            correct: "parallel",
            confusionType: "similar-looking word",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "ancient",
            sentence: "Le musée exposait de la poterie ____ des premières civilisations.",
            options: ["ancienne", "anciene", "aancienne", "ancièene"],
            correct: "ancienne",
            confusionType: "décodage orthographique",
          },
          {
            id: "thorough",
            sentence: "Le scientifique a effectué une revue ____ de toutes les données.",
            options: ["approfondie", "aprofond", "approfondi", "approfondée"],
            correct: "approfondie",
            confusionType: "mot sonorité similaire",
          },
          {
            id: "parallel",
            sentence: "Les deux lignes du graphique couraient ____ l'une à l'autre.",
            options: ["parallèles", "paralleles", "paralelès", "parrallèles"],
            correct: "parallèles",
            confusionType: "mot d'orthographe similaire",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "ancient",
            sentence: "عرض المتحف فخاراً ____ من الحضارات المبكرة.",
            options: ["قديماً", "قديم", "قديما", "قدييم"],
            correct: "قديماً",
            confusionType: "فك تشفير إملائي",
          },
          {
            id: "thorough",
            sentence: "أجرى العالم مراجعة ____ لجميع البيانات.",
            options: ["شاملة", "شامله", "شاملة", "شمله"],
            correct: "شاملة",
            confusionType: "كلمة بصوت مشابه",
          },
          {
            id: "parallel",
            sentence: "سارت الخطان في الرسم البياني بشكل ____ لبعضهما.",
            options: ["متوازٍ", "متوازى", "متوازن", "موتازٍ"],
            correct: "متوازٍ",
            confusionType: "كلمة بشكل مشابه",
          },
        ],
      },
    },
  },
  {
    id: "words-c",
    content: {
      en: {
        items: [
          {
            id: "rhythm",
            sentence: "The poem had a strong ____ that made it easy to remember.",
            options: ["rhythm", "rythm", "rhythem", "rythym"],
            correct: "rhythm",
            confusionType: "orthographic decoding",
          },
          {
            id: "principal",
            sentence: "The ____ of the school announced a new reading programme.",
            options: ["principal", "principle", "principel", "princapal"],
            correct: "principal",
            confusionType: "similar-sounding word",
          },
          {
            id: "necessary",
            sentence: "It is ____ to bring your notebook to every science lesson.",
            options: ["necessary", "necesary", "neccesary", "necessery"],
            correct: "necessary",
            confusionType: "similar-looking word",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "rhythm",
            sentence: "Le poème avait un fort ____ qui le rendait facile à mémoriser.",
            options: ["rythme", "rhythme", "ritme", "rythm"],
            correct: "rythme",
            confusionType: "décodage orthographique",
          },
          {
            id: "principal",
            sentence: "Le ____ de l'école a annoncé un nouveau programme de lecture.",
            options: ["directeur", "directuer", "directour", "diirecteur"],
            correct: "directeur",
            confusionType: "mot sonorité similaire",
          },
          {
            id: "necessary",
            sentence: "Il est ____ d'apporter ton cahier à chaque cours de sciences.",
            options: ["nécessaire", "nécéssaire", "necessaire", "nécésaire"],
            correct: "nécessaire",
            confusionType: "mot d'orthographe similaire",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "rhythm",
            sentence: "كان للقصيدة ____ قوي جعلها سهلة التذكر.",
            options: ["إيقاع", "إيقاع", "أيقاع", "إيقاة"],
            correct: "إيقاع",
            confusionType: "فك تشفير إملائي",
          },
          {
            id: "principal",
            sentence: "أعلن ____ المدرسة عن برنامج قراءة جديد.",
            options: ["مدير", "مديير", "مدبر", "مديرر"],
            correct: "مدير",
            confusionType: "كلمة بصوت مشابه",
          },
          {
            id: "necessary",
            sentence: "من ____ إحضار دفتر الملاحظات في كل درس علوم.",
            options: ["الضروري", "الضرورى", "الضرري", "الضروريي"],
            correct: "الضروري",
            confusionType: "كلمة بشكل مشابه",
          },
        ],
      },
    },
  },
];

// ─── PASSAGES (each with exactly 2 questions) ────────────────────────────────

export const PASSAGE_POOL = [
  {
    id: "passage-a",
    content: {
      en: {
        text: "Mariam joined the after-school robotics club in October. During the first month, the team tested which wheel size helped the robot move most smoothly over uneven mats. They recorded each trial, compared the results, and adjusted the design before the final showcase.",
        questions: [
          {
            prompt: "Why did the team compare the wheel results?",
            options: [
              "To decide which design worked best on uneven mats.",
              "To choose the club leader for the showcase.",
              "To write a history report about robotics.",
            ],
            correct: "To decide which design worked best on uneven mats.",
          },
          {
            prompt: "What happened before the final showcase?",
            options: [
              "The robot design was adjusted.",
              "The club moved to a new school.",
              "The mats were removed from the room.",
            ],
            correct: "The robot design was adjusted.",
          },
        ],
      },
      fr: {
        text: "Mariam a rejoint le club de robotique parascolaire en octobre. Pendant le premier mois, l'équipe a testé quelle taille de roue aidait le robot à se déplacer le plus facilement sur des tapis irréguliers. Ils ont enregistré chaque essai, comparé les résultats et ajusté le design avant la présentation finale.",
        questions: [
          {
            prompt: "Pourquoi l'équipe a-t-elle comparé les résultats des roues ?",
            options: [
              "Pour décider quel design fonctionnait le mieux sur les tapis irréguliers.",
              "Pour choisir le leader du club pour la présentation.",
              "Pour écrire un rapport d'histoire sur la robotique.",
            ],
            correct: "Pour décider quel design fonctionnait le mieux sur les tapis irréguliers.",
          },
          {
            prompt: "Qu'est-ce qui s'est passé avant la présentation finale ?",
            options: [
              "Le design du robot a été ajusté.",
              "Le club a déménagé dans une nouvelle école.",
              "Les tapis ont été retirés de la salle.",
            ],
            correct: "Le design du robot a été ajusté.",
          },
        ],
      },
      ar: {
        text: "انضمت مريم إلى نادي الروبوتيكا بعد المدرسة في أكتوبر. خلال الشهر الأول، اختبر الفريق أيّ حجم عجلة يساعد الروبوت على التحرك بسلاسة على الحصائر الغير مستوية. سجلوا كل تجربة، وقارنوا النتائج، وعدلوا التصميم قبل العرض النهائي.",
        questions: [
          {
            prompt: "لماذا قارن الفريق نتائج العجلات؟",
            options: [
              "لتحديد أيّ تصميم يعمل بشكل أفضل على الحصائر الغير مستوية.",
              "لاختيار قائد النادي للعرض.",
              "لكتابة تقرير تاريخي عن الروبوتيكا.",
            ],
            correct: "لتحديد أيّ تصميم يعمل بشكل أفضل على الحصائر الغير مستوية.",
          },
          {
            prompt: "ما الذي حدث قبل العرض النهائي؟",
            options: [
              "تم تعديل تصميم الروبوت.",
              "انتقل النادي إلى مدرسة جديدة.",
              "أُزيلت الحصائر من الغرفة.",
            ],
            correct: "تم تعديل تصميم الروبوت.",
          },
        ],
      },
    },
  },
  {
    id: "passage-b",
    content: {
      en: {
        text: "Karim's class studied the water cycle by setting up a mini terrarium. They placed damp soil and a small plant inside a sealed jar, then placed it near the window. Over several days, they noticed water droplets forming on the inside of the glass, then dripping back down.",
        questions: [
          {
            prompt: "What did the students observe on the inside of the glass?",
            options: [
              "Water droplets forming and dripping down.",
              "Soil rising to the top of the jar.",
              "The plant turning yellow from lack of light.",
            ],
            correct: "Water droplets forming and dripping down.",
          },
          {
            prompt: "Why did the class place the jar near the window?",
            options: [
              "To use sunlight to drive the water cycle.",
              "To keep the jar cool during the experiment.",
              "To prevent the plant from growing too fast.",
            ],
            correct: "To use sunlight to drive the water cycle.",
          },
        ],
      },
      fr: {
        text: "La classe de Karim a étudié le cycle de l'eau en installant un mini-terrarium. Ils ont placé de la terre humide et une petite plante dans un bocal hermétique, puis l'ont mis près de la fenêtre. Au fil des jours, ils ont remarqué des gouttelettes d'eau se formant à l'intérieur du verre, puis retombant.",
        questions: [
          {
            prompt: "Qu'ont observé les élèves à l'intérieur du verre ?",
            options: [
              "Des gouttelettes d'eau se formant et retombant.",
              "La terre montant au sommet du bocal.",
              "La plante jaunissant par manque de lumière.",
            ],
            correct: "Des gouttelettes d'eau se formant et retombant.",
          },
          {
            prompt: "Pourquoi la classe a-t-elle placé le bocal près de la fenêtre ?",
            options: [
              "Pour utiliser la lumière du soleil pour activer le cycle de l'eau.",
              "Pour garder le bocal frais pendant l'expérience.",
              "Pour empêcher la plante de pousser trop vite.",
            ],
            correct: "Pour utiliser la lumière du soleil pour activer le cycle de l'eau.",
          },
        ],
      },
      ar: {
        text: "درست فصل كريم دورة المياه من خلال إعداد حوض زجاجي صغير. وضعوا تربة رطبة ونبتة صغيرة داخل جرة مغلقة، ثم وضعوها بالقرب من النافذة. على مدى أيام عدة، لاحظوا تشكّل قطرات ماء على الجانب الداخلي من الزجاج، ثم تقطّرها للأسفل.",
        questions: [
          {
            prompt: "ما الذي لاحظه الطلاب على الجانب الداخلي من الزجاج؟",
            options: [
              "قطرات ماء تتشكل وتتقطر للأسفل.",
              "التربة ترتفع إلى أعلى الجرة.",
              "النبتة تصفر بسبب قلة الضوء.",
            ],
            correct: "قطرات ماء تتشكل وتتقطر للأسفل.",
          },
          {
            prompt: "لماذا وضع الفصل الجرة بالقرب من النافذة؟",
            options: [
              "لاستخدام ضوء الشمس لتشغيل دورة المياه.",
              "للحفاظ على برودة الجرة أثناء التجربة.",
              "لمنع النبتة من النمو بسرعة كبيرة.",
            ],
            correct: "لاستخدام ضوء الشمس لتشغيل دورة المياه.",
          },
        ],
      },
    },
  },
  {
    id: "passage-c",
    content: {
      en: {
        text: "During a history lesson, students examined primary sources about trade routes in ancient times. They compared two maps from different centuries, noted which goods were traded, and wrote a short paragraph explaining how trade affected cultural exchange.",
        questions: [
          {
            prompt: "What did students compare during the lesson?",
            options: [
              "Two maps from different centuries.",
              "Two textbooks about modern history.",
              "Two lists of school subjects.",
            ],
            correct: "Two maps from different centuries.",
          },
          {
            prompt: "What did students write about at the end of the lesson?",
            options: [
              "How trade affected cultural exchange.",
              "Why ancient maps are inaccurate.",
              "Where trade routes are located today.",
            ],
            correct: "How trade affected cultural exchange.",
          },
        ],
      },
      fr: {
        text: "Lors d'un cours d'histoire, les élèves ont examiné des sources primaires sur les routes commerciales dans l'Antiquité. Ils ont comparé deux cartes de siècles différents, noté les marchandises échangées et rédigé un court paragraphe expliquant comment le commerce a affecté les échanges culturels.",
        questions: [
          {
            prompt: "Qu'est-ce que les élèves ont comparé pendant le cours ?",
            options: [
              "Deux cartes de siècles différents.",
              "Deux manuels sur l'histoire moderne.",
              "Deux listes de matières scolaires.",
            ],
            correct: "Deux cartes de siècles différents.",
          },
          {
            prompt: "Sur quoi les élèves ont-ils écrit à la fin du cours ?",
            options: [
              "Comment le commerce a affecté les échanges culturels.",
              "Pourquoi les cartes anciennes sont inexactes.",
              "Où se trouvent les routes commerciales aujourd'hui.",
            ],
            correct: "Comment le commerce a affecté les échanges culturels.",
          },
        ],
      },
      ar: {
        text: "خلال درس التاريخ، فحص الطلاب مصادر أولية حول طرق التجارة في العصور القديمة. قارنوا خريطتين من قرون مختلفة، وسجّلوا البضائع المتبادلة، وكتبوا فقرة قصيرة تشرح كيف أثّرت التجارة على التبادل الثقافي.",
        questions: [
          {
            prompt: "ماذا قارن الطلاب خلال الدرس؟",
            options: [
              "خريطتين من قرون مختلفة.",
              "كتابين مدرسيين عن التاريخ الحديث.",
              "قائمتين بالمواد الدراسية.",
            ],
            correct: "خريطتين من قرون مختلفة.",
          },
          {
            prompt: "عمّ كتب الطلاب في نهاية الدرس؟",
            options: [
              "كيف أثّرت التجارة على التبادل الثقافي.",
              "لماذا الخرائط القديمة غير دقيقة.",
              "أين تقع طرق التجارة اليوم.",
            ],
            correct: "كيف أثّرت التجارة على التبادل الثقافي.",
          },
        ],
      },
    },
  },
];

// ─── SENTENCE RECONSTRUCTION (exactly 7 words each) ─────────────────────────

export const RECONSTRUCTION_POOL = [
  {
    id: "reconstruction-a",
    content: {
      en: { words: ["Students", "compare", "evidence", "before", "writing", "the", "conclusion."] },
      fr: { words: ["Les", "élèves", "comparent", "les", "preuves", "avant", "conclusion."] },
      ar: { words: ["يقارن", "الطلاب", "الأدلة", "قبل", "كتابة", "الاستنتاج", "النهائي."] },
    },
  },
  {
    id: "reconstruction-b",
    content: {
      en: { words: ["Scientists", "record", "results", "after", "every", "careful", "observation."] },
      fr: { words: ["Les", "scientifiques", "notent", "résultats", "après", "chaque", "observation."] },
      ar: { words: ["يسجّل", "العلماء", "النتائج", "بعد", "كل", "ملاحظة", "دقيقة."] },
    },
  },
  {
    id: "reconstruction-c",
    content: {
      en: { words: ["Teachers", "review", "student", "work", "to", "improve", "learning."] },
      fr: { words: ["Les", "enseignants", "corrigent", "travail", "pour", "améliorer", "apprentissage."] },
      ar: { words: ["يراجع", "المعلمون", "عمل", "الطلاب", "لتحسين", "عملية", "التعلم."] },
    },
  },
];

// ─── LEVEL-TAGGED POOLS ───────────────────────────────────────────────────────
// The MIDDLE pools above are reused for the "middle" level by default.
// The exports below provide level-specific variants.

export const EARLY_WORD_ITEMS_POOL = [
  {
    id: "early-words-a",
    content: {
      en: {
        items: [
          {
            id: "cat",
            sentence: "The ____ sat on the mat.",
            options: ["cat", "cot", "cut", "car"],
            correct: "cat",
            confusionType: "similar-sounding word",
          },
          {
            id: "ball",
            sentence: "She threw the ____ to her friend.",
            options: ["ball", "bell", "bill", "bull"],
            correct: "ball",
            confusionType: "vowel confusion",
          },
          {
            id: "farm",
            sentence: "The animals live on a ____.",
            options: ["farm", "firm", "form", "fam"],
            correct: "farm",
            confusionType: "similar-looking word",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "cat",
            sentence: "Le ____ est assis sur le tapis.",
            options: ["chat", "chet", "chot", "chut"],
            correct: "chat",
            confusionType: "mot sonorité similaire",
          },
          {
            id: "ball",
            sentence: "Elle a lancé la ____ à son amie.",
            options: ["balle", "belle", "bulle", "bolle"],
            correct: "balle",
            confusionType: "confusion vocalique",
          },
          {
            id: "farm",
            sentence: "Les animaux vivent dans une ____.",
            options: ["ferme", "feme", "frame", "ferma"],
            correct: "ferme",
            confusionType: "mot d'orthographe similaire",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "cat",
            sentence: "جلس ____ على السجادة.",
            options: ["القط", "القطط", "القطو", "القطا"],
            correct: "القط",
            confusionType: "كلمة بصوت مشابه",
          },
          {
            id: "ball",
            sentence: "رمت ____ لصديقتها.",
            options: ["الكرة", "الكرا", "الكرو", "الكره"],
            correct: "الكرة",
            confusionType: "تشابه حروف العلة",
          },
          {
            id: "farm",
            sentence: "تعيش الحيوانات في ____.",
            options: ["المزرعة", "المزرعا", "المزرعو", "المزرعه"],
            correct: "المزرعة",
            confusionType: "كلمة بشكل مشابه",
          },
        ],
      },
    },
  },
  {
    id: "early-words-b",
    content: {
      en: {
        items: [
          {
            id: "ship",
            sentence: "We saw a big ____ in the sea.",
            options: ["ship", "shop", "chip", "whip"],
            correct: "ship",
            confusionType: "similar-looking word",
          },
          {
            id: "plant",
            sentence: "She watered the ____ every morning.",
            options: ["plant", "plent", "plan", "plat"],
            correct: "plant",
            confusionType: "orthographic decoding",
          },
          {
            id: "friend",
            sentence: "He played with his best ____ at school.",
            options: ["friend", "frend", "fiend", "frand"],
            correct: "friend",
            confusionType: "orthographic decoding",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "ship",
            sentence: "Nous avons vu un grand ____ dans la mer.",
            options: ["bateau", "gateau", "rateau", "cateau"],
            correct: "bateau",
            confusionType: "mot d'orthographe similaire",
          },
          {
            id: "plant",
            sentence: "Elle arrosait la ____ chaque matin.",
            options: ["plante", "plente", "planta", "plont"],
            correct: "plante",
            confusionType: "décodage orthographique",
          },
          {
            id: "friend",
            sentence: "Il jouait avec son meilleur ____ à l'école.",
            options: ["ami", "ame", "amic", "amie"],
            correct: "ami",
            confusionType: "décodage orthographique",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "ship",
            sentence: "رأينا ____ كبيرة في البحر.",
            options: ["سفينة", "سفينه", "سفينا", "سفينو"],
            correct: "سفينة",
            confusionType: "كلمة بشكل مشابه",
          },
          {
            id: "plant",
            sentence: "كانت تسقي ____ كل صباح.",
            options: ["النبتة", "النبته", "النبتا", "النبتو"],
            correct: "النبتة",
            confusionType: "فك تشفير إملائي",
          },
          {
            id: "friend",
            sentence: "لعب مع ____ المقرب في المدرسة.",
            options: ["صديقه", "صديقو", "صديقا", "صديقي"],
            correct: "صديقه",
            confusionType: "فك تشفير إملائي",
          },
        ],
      },
    },
  },
  {
    id: "early-words-c",
    content: {
      en: {
        items: [
          {
            id: "book",
            sentence: "She read a ____ before bed.",
            options: ["book", "look", "cook", "took"],
            correct: "book",
            confusionType: "rhyming confusion",
          },
          {
            id: "jump",
            sentence: "He tried to ____ over the puddle.",
            options: ["jump", "dump", "pump", "bump"],
            correct: "jump",
            confusionType: "similar-sounding word",
          },
          {
            id: "store",
            sentence: "They went to the ____ to buy food.",
            options: ["store", "stare", "score", "stole"],
            correct: "store",
            confusionType: "similar-looking word",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "book",
            sentence: "Elle a lu un ____ avant de dormir.",
            options: ["livre", "litre", "libre", "lièvre"],
            correct: "livre",
            confusionType: "confusion de rimes",
          },
          {
            id: "jump",
            sentence: "Il a essayé de ____ par-dessus la flaque.",
            options: ["sauter", "scooter", "couter", "souter"],
            correct: "sauter",
            confusionType: "mot sonorité similaire",
          },
          {
            id: "store",
            sentence: "Ils sont allés au ____ pour acheter de la nourriture.",
            options: ["magasin", "magazin", "maagasin", "magaзin"],
            correct: "magasin",
            confusionType: "mot d'orthographe similaire",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "book",
            sentence: "قرأت ____ قبل النوم.",
            options: ["كتاباً", "كتابا", "كتابً", "كتابن"],
            correct: "كتاباً",
            confusionType: "تشابه الأوزان",
          },
          {
            id: "jump",
            sentence: "حاول ____ فوق البركة.",
            options: ["القفز", "القفض", "القفس", "القفص"],
            correct: "القفز",
            confusionType: "كلمة بصوت مشابه",
          },
          {
            id: "store",
            sentence: "ذهبوا إلى ____ لشراء الطعام.",
            options: ["المتجر", "المتجرر", "المتجير", "المتجرا"],
            correct: "المتجر",
            confusionType: "كلمة بشكل مشابه",
          },
        ],
      },
    },
  },
];

export const EARLY_PASSAGE_POOL = [
  {
    id: "early-passage-a",
    content: {
      en: {
        text: "Tom has a dog named Biscuit. Every morning, Tom feeds Biscuit and takes him for a walk. One day, Biscuit found a ball in the park and brought it home.",
        questions: [
          {
            prompt: "What did Biscuit find at the park?",
            options: ["A ball", "A stick", "A bone"],
            correct: "A ball",
          },
          {
            prompt: "What does Tom do every morning?",
            options: ["Feeds Biscuit and walks him", "Reads a book", "Goes to school first"],
            correct: "Feeds Biscuit and walks him",
          },
        ],
      },
      fr: {
        text: "Tom a un chien qui s'appelle Biscuit. Chaque matin, Tom nourrit Biscuit et l'emmène se promener. Un jour, Biscuit a trouvé une balle dans le parc et l'a ramenée à la maison.",
        questions: [
          {
            prompt: "Qu'est-ce que Biscuit a trouvé dans le parc ?",
            options: ["Une balle", "Un bâton", "Un os"],
            correct: "Une balle",
          },
          {
            prompt: "Que fait Tom chaque matin ?",
            options: ["Il nourrit Biscuit et le promène", "Il lit un livre", "Il va d'abord à l'école"],
            correct: "Il nourrit Biscuit et le promène",
          },
        ],
      },
      ar: {
        text: "لدى توم كلب اسمه بسكويت. كل صباح، يطعم توم بسكويت ويأخذه في نزهة. في يوم من الأيام، وجد بسكويت كرة في الحديقة وأحضرها إلى المنزل.",
        questions: [
          {
            prompt: "ماذا وجد بسكويت في الحديقة؟",
            options: ["كرة", "عصا", "عظمة"],
            correct: "كرة",
          },
          {
            prompt: "ماذا يفعل توم كل صباح؟",
            options: ["يطعم بسكويت ويمشي معه", "يقرأ كتاباً", "يذهب إلى المدرسة أولاً"],
            correct: "يطعم بسكويت ويمشي معه",
          },
        ],
      },
    },
  },
  {
    id: "early-passage-b",
    content: {
      en: {
        text: "Mia loves to draw. She draws flowers, trees, and animals. Her teacher put one of her drawings on the classroom wall for everyone to see.",
        questions: [
          {
            prompt: "What did Mia's teacher do with her drawing?",
            options: ["Put it on the classroom wall", "Sent it home", "Put it in a book"],
            correct: "Put it on the classroom wall",
          },
          {
            prompt: "What does Mia love to do?",
            options: ["Draw", "Sing", "Run"],
            correct: "Draw",
          },
        ],
      },
      fr: {
        text: "Mia aime dessiner. Elle dessine des fleurs, des arbres et des animaux. Son professeur a mis l'un de ses dessins sur le mur de la classe pour que tout le monde le voie.",
        questions: [
          {
            prompt: "Qu'a fait le professeur de Mia avec son dessin ?",
            options: ["Il l'a mis sur le mur de la classe", "Il l'a envoyé à la maison", "Il l'a mis dans un livre"],
            correct: "Il l'a mis sur le mur de la classe",
          },
          {
            prompt: "Qu'est-ce que Mia aime faire ?",
            options: ["Dessiner", "Chanter", "Courir"],
            correct: "Dessiner",
          },
        ],
      },
      ar: {
        text: "تحب ميا الرسم. ترسم الزهور والأشجار والحيوانات. وضع معلمها أحد رسوماتها على جدار الفصل لكي يراها الجميع.",
        questions: [
          {
            prompt: "ماذا فعل معلم ميا برسمتها؟",
            options: ["وضعها على جدار الفصل", "أرسلها إلى المنزل", "وضعها في كتاب"],
            correct: "وضعها على جدار الفصل",
          },
          {
            prompt: "ماذا تحب ميا أن تفعل؟",
            options: ["الرسم", "الغناء", "الجري"],
            correct: "الرسم",
          },
        ],
      },
    },
  },
  {
    id: "early-passage-c",
    content: {
      en: {
        text: "Ben and his dad planted seeds in their garden. They watered the seeds every day. After two weeks, tiny green plants appeared.",
        questions: [
          {
            prompt: "What did Ben and his dad plant?",
            options: ["Seeds", "Flowers", "Trees"],
            correct: "Seeds",
          },
          {
            prompt: "What appeared after two weeks?",
            options: ["Tiny green plants", "Flowers", "Fruit"],
            correct: "Tiny green plants",
          },
        ],
      },
      fr: {
        text: "Ben et son papa ont planté des graines dans leur jardin. Ils ont arrosé les graines chaque jour. Après deux semaines, de petites plantes vertes sont apparues.",
        questions: [
          {
            prompt: "Qu'est-ce que Ben et son papa ont planté ?",
            options: ["Des graines", "Des fleurs", "Des arbres"],
            correct: "Des graines",
          },
          {
            prompt: "Qu'est-ce qui est apparu après deux semaines ?",
            options: ["De petites plantes vertes", "Des fleurs", "Des fruits"],
            correct: "De petites plantes vertes",
          },
        ],
      },
      ar: {
        text: "زرع بن ووالده بذوراً في حديقتهم. سقوا البذور كل يوم. بعد أسبوعين، ظهرت نباتات خضراء صغيرة.",
        questions: [
          {
            prompt: "ماذا زرع بن ووالده؟",
            options: ["بذوراً", "زهوراً", "أشجاراً"],
            correct: "بذوراً",
          },
          {
            prompt: "ماذا ظهر بعد أسبوعين؟",
            options: ["نباتات خضراء صغيرة", "زهور", "فاكهة"],
            correct: "نباتات خضراء صغيرة",
          },
        ],
      },
    },
  },
];

export const EARLY_RECONSTRUCTION_POOL = [
  {
    id: "early-reconstruction-a",
    content: {
      en: { words: ["The", "cat", "sat", "on", "the", "warm", "mat."] },
      fr: { words: ["Le", "chat", "est", "assis", "sur", "le", "tapis."] },
      ar: { words: ["جلس", "القط", "على", "الحصيرة", "الدافئة", "في", "البيت."] },
    },
  },
  {
    id: "early-reconstruction-b",
    content: {
      en: { words: ["She", "reads", "a", "book", "every", "single", "night."] },
      fr: { words: ["Elle", "lit", "un", "livre", "chaque", "soir", "tranquillement."] },
      ar: { words: ["تقرأ", "كتاباً", "كل", "ليلة", "قبل", "النوم", "هادئة."] },
    },
  },
  {
    id: "early-reconstruction-c",
    content: {
      en: { words: ["The", "dog", "ran", "fast", "across", "the", "field."] },
      fr: { words: ["Le", "chien", "a", "couru", "vite", "dans", "champ."] },
      ar: { words: ["ركض", "الكلب", "بسرعة", "عبر", "الحقل", "الواسع", "الأخضر."] },
    },
  },
];

export const EARLY_MODALITY_POOL = [
  {
    id: "early-modality-a",
    content: {
      en: {
        textOnly: {
          passage: "Ali read his favourite story and drew a picture of the main character.",
          question: {
            prompt: "What did Ali draw?",
            options: ["A picture of the main character", "His house", "A map"],
            correct: "A picture of the main character",
          },
        },
        audioSupported: {
          passage: "Sara listened to her teacher read a poem, then clapped to the rhythm.",
          question: {
            prompt: "What did Sara do after listening?",
            options: ["Clapped to the rhythm", "Fell asleep", "Wrote a sentence"],
            correct: "Clapped to the rhythm",
          },
        },
      },
      fr: {
        textOnly: {
          passage: "Ali a lu son histoire préférée et a dessiné le personnage principal.",
          question: {
            prompt: "Qu'est-ce qu'Ali a dessiné ?",
            options: ["Le personnage principal", "Sa maison", "Une carte"],
            correct: "Le personnage principal",
          },
        },
        audioSupported: {
          passage: "Sara a écouté son professeur lire un poème, puis a tapé dans ses mains sur le rythme.",
          question: {
            prompt: "Qu'a fait Sara après avoir écouté ?",
            options: ["Elle a tapé dans ses mains", "Elle s'est endormie", "Elle a écrit une phrase"],
            correct: "Elle a tapé dans ses mains",
          },
        },
      },
      ar: {
        textOnly: {
          passage: "قرأ علي قصته المفضلة ورسم صورة للشخصية الرئيسية.",
          question: {
            prompt: "ماذا رسم علي؟",
            options: ["صورة الشخصية الرئيسية", "منزله", "خريطة"],
            correct: "صورة الشخصية الرئيسية",
          },
        },
        audioSupported: {
          passage: "استمعت سارة لمعلمتها وهي تقرأ قصيدة، ثم صفّقت على الإيقاع.",
          question: {
            prompt: "ماذا فعلت سارة بعد الاستماع؟",
            options: ["صفّقت على الإيقاع", "نامت", "كتبت جملة"],
            correct: "صفّقت على الإيقاع",
          },
        },
      },
    },
  },
  {
    id: "early-modality-b",
    content: {
      en: {
        textOnly: {
          passage: "Nadia saw a rainbow after the rain and wrote three colours she noticed.",
          question: {
            prompt: "What did Nadia write?",
            options: ["Three colours she noticed", "A shopping list", "Her name"],
            correct: "Three colours she noticed",
          },
        },
        audioSupported: {
          passage: "Rami listened to the weather report and told his mum it would be sunny.",
          question: {
            prompt: "What did Rami tell his mum?",
            options: ["It would be sunny", "It would rain", "It would snow"],
            correct: "It would be sunny",
          },
        },
      },
      fr: {
        textOnly: {
          passage: "Nadia a vu un arc-en-ciel après la pluie et a écrit trois couleurs qu'elle a remarquées.",
          question: {
            prompt: "Qu'est-ce que Nadia a écrit ?",
            options: ["Trois couleurs qu'elle a remarquées", "Une liste de courses", "Son prénom"],
            correct: "Trois couleurs qu'elle a remarquées",
          },
        },
        audioSupported: {
          passage: "Rami a écouté la météo et a dit à sa maman qu'il ferait beau.",
          question: {
            prompt: "Qu'a dit Rami à sa maman ?",
            options: ["Qu'il ferait beau", "Qu'il pleuvrait", "Qu'il neigerait"],
            correct: "Qu'a dit Rami à sa maman ?",
          },
        },
      },
      ar: {
        textOnly: {
          passage: "رأت ناديا قوس قزح بعد المطر وكتبت ثلاثة ألوان لاحظتها.",
          question: {
            prompt: "ماذا كتبت ناديا؟",
            options: ["ثلاثة ألوان لاحظتها", "قائمة تسوق", "اسمها"],
            correct: "ثلاثة ألوان لاحظتها",
          },
        },
        audioSupported: {
          passage: "استمع رامي لنشرة الطقس وأخبر أمه بأن الجو سيكون مشمساً.",
          question: {
            prompt: "ماذا أخبر رامي أمه؟",
            options: ["أن الجو سيكون مشمساً", "أنه سيمطر", "أنه سيثلج"],
            correct: "أن الجو سيكون مشمساً",
          },
        },
      },
    },
  },
  {
    id: "early-modality-c",
    content: {
      en: {
        textOnly: {
          passage: "Jake counted 10 birds on the wire and wrote the number in his journal.",
          question: {
            prompt: "What did Jake write in his journal?",
            options: ["The number of birds", "A bird's name", "A song"],
            correct: "The number of birds",
          },
        },
        audioSupported: {
          passage: "Leila heard the bell ring and quickly packed her school bag.",
          question: {
            prompt: "What did Leila do when the bell rang?",
            options: ["Packed her school bag", "Ran outside", "Sat down"],
            correct: "Packed her school bag",
          },
        },
      },
      fr: {
        textOnly: {
          passage: "Jake a compté 10 oiseaux sur le fil et a écrit le nombre dans son journal.",
          question: {
            prompt: "Qu'a écrit Jake dans son journal ?",
            options: ["Le nombre d'oiseaux", "Le nom d'un oiseau", "Une chanson"],
            correct: "Le nombre d'oiseaux",
          },
        },
        audioSupported: {
          passage: "Leila a entendu sonner la cloche et a rapidement rangé son sac scolaire.",
          question: {
            prompt: "Qu'a fait Leila quand la cloche a sonné ?",
            options: ["Elle a rangé son sac", "Elle a couru dehors", "Elle s'est assise"],
            correct: "Elle a rangé son sac",
          },
        },
      },
      ar: {
        textOnly: {
          passage: "عدّ جاك 10 عصافير على السلك وكتب العدد في مجلته.",
          question: {
            prompt: "ماذا كتب جاك في مجلته؟",
            options: ["عدد العصافير", "اسم عصفور", "أغنية"],
            correct: "عدد العصافير",
          },
        },
        audioSupported: {
          passage: "سمعت ليلى الجرس يرن فحزمت حقيبتها المدرسية بسرعة.",
          question: {
            prompt: "ماذا فعلت ليلى حين رنّ الجرس؟",
            options: ["حزمت حقيبتها المدرسية", "جرت للخارج", "جلست"],
            correct: "حزمت حقيبتها المدرسية",
          },
        },
      },
    },
  },
];

// ─── SECONDARY LEVEL POOLS ───────────────────────────────────────────────────

export const SECONDARY_WORD_ITEMS_POOL = [
  {
    id: "sec-words-a",
    content: {
      en: {
        items: [
          {
            id: "ambiguous",
            sentence: "The instructions were ____, so students interpreted them differently.",
            options: ["ambiguous", "ambigous", "ambiguos", "ambiguious"],
            correct: "ambiguous",
            confusionType: "orthographic decoding",
          },
          {
            id: "coherent",
            sentence: "Her argument was clear and ____ throughout the essay.",
            options: ["coherent", "coherant", "coherrent", "coharent"],
            correct: "coherent",
            confusionType: "similar-looking word",
          },
          {
            id: "trajectory",
            sentence: "The team monitored the satellite's ____ from the ground station.",
            options: ["trajectory", "trajectery", "trajectorie", "trejectory"],
            correct: "trajectory",
            confusionType: "orthographic decoding",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "ambiguous",
            sentence: "Les instructions étaient ____, donc les élèves les ont interprétées différemment.",
            options: ["ambiguës", "ambigues", "ambiguès", "ambiguées"],
            correct: "ambiguës",
            confusionType: "décodage orthographique",
          },
          {
            id: "coherent",
            sentence: "Son argument était clair et ____ tout au long de l'essai.",
            options: ["cohérent", "coherent", "cohérant", "cohérrant"],
            correct: "cohérent",
            confusionType: "mot d'orthographe similaire",
          },
          {
            id: "trajectory",
            sentence: "L'équipe a surveillé la ____ du satellite depuis la station au sol.",
            options: ["trajectoire", "trajectoir", "trajectooire", "trajectoiree"],
            correct: "trajectoire",
            confusionType: "décodage orthographique",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "ambiguous",
            sentence: "كانت التعليمات ____ لذا فسّرها الطلاب بشكل مختلف.",
            options: ["غامضة", "غامضه", "غامضا", "غامضي"],
            correct: "غامضة",
            confusionType: "فك تشفير إملائي",
          },
          {
            id: "coherent",
            sentence: "كانت حجتها واضحة و____ طوال المقال.",
            options: ["متماسكة", "متماسكه", "متماسكا", "متماسكي"],
            correct: "متماسكة",
            confusionType: "كلمة بشكل مشابه",
          },
          {
            id: "trajectory",
            sentence: "راقب الفريق ____ القمر الصناعي من المحطة الأرضية.",
            options: ["مسار", "مسارر", "مسارا", "مسارو"],
            correct: "مسار",
            confusionType: "فك تشفير إملائي",
          },
        ],
      },
    },
  },
  {
    id: "sec-words-b",
    content: {
      en: {
        items: [
          {
            id: "phenomenon",
            sentence: "The northern lights are a natural ____ caused by solar winds.",
            options: ["phenomenon", "phenominon", "phenomonon", "phenomenom"],
            correct: "phenomenon",
            confusionType: "orthographic decoding",
          },
          {
            id: "hypothesis",
            sentence: "The scientist stated a clear ____ before beginning the experiment.",
            options: ["hypothesis", "hypothasis", "hypothisis", "hyopthesis"],
            correct: "hypothesis",
            confusionType: "similar-looking word",
          },
          {
            id: "synthesis",
            sentence: "The essay required a ____ of multiple research sources.",
            options: ["synthesis", "synthasis", "sythesis", "synthisis"],
            correct: "synthesis",
            confusionType: "orthographic decoding",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "phenomenon",
            sentence: "Les aurores boréales sont un ____ naturel causé par les vents solaires.",
            options: ["phénomène", "phenomene", "phénomène", "phénomène"],
            correct: "phénomène",
            confusionType: "décodage orthographique",
          },
          {
            id: "hypothesis",
            sentence: "Le scientifique a énoncé une ____ claire avant de commencer l'expérience.",
            options: ["hypothèse", "hypothese", "hypothèze", "hypothèsee"],
            correct: "hypothèse",
            confusionType: "mot d'orthographe similaire",
          },
          {
            id: "synthesis",
            sentence: "L'essai nécessitait une ____ de plusieurs sources de recherche.",
            options: ["synthèse", "synthese", "syntèse", "synthéze"],
            correct: "synthèse",
            confusionType: "décodage orthographique",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "phenomenon",
            sentence: "الشفق القطبي ____ طبيعي تسببه الرياح الشمسية.",
            options: ["ظاهرة", "ظاهره", "ظاهرا", "ظاهري"],
            correct: "ظاهرة",
            confusionType: "فك تشفير إملائي",
          },
          {
            id: "hypothesis",
            sentence: "صاغ العالم ____ واضحة قبل البدء بالتجربة.",
            options: ["فرضية", "فرضيه", "فرضيا", "فرضيو"],
            correct: "فرضية",
            confusionType: "كلمة بشكل مشابه",
          },
          {
            id: "synthesis",
            sentence: "تطلّب المقال ____ لمصادر بحثية متعددة.",
            options: ["تركيباً", "تركيبا", "تركيبً", "تركيبن"],
            correct: "تركيباً",
            confusionType: "فك تشفير إملائي",
          },
        ],
      },
    },
  },
  {
    id: "sec-words-c",
    content: {
      en: {
        items: [
          {
            id: "legislature",
            sentence: "The ____ passed a new law regulating online privacy.",
            options: ["legislature", "legistlature", "legislatuer", "legeslature"],
            correct: "legislature",
            confusionType: "orthographic decoding",
          },
          {
            id: "equilibrium",
            sentence: "The beam remained in ____ when both sides were equally weighted.",
            options: ["equilibrium", "equilbrium", "equilbirum", "equilibreum"],
            correct: "equilibrium",
            confusionType: "similar-looking word",
          },
          {
            id: "conscience",
            sentence: "He acted according to his ____ even when it was difficult.",
            options: ["conscience", "consciance", "consciense", "concience"],
            correct: "conscience",
            confusionType: "similar-sounding word",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "legislature",
            sentence: "Le ____ a adopté une nouvelle loi sur la vie privée en ligne.",
            options: ["parlement", "parlament", "parlèment", "parlemant"],
            correct: "parlement",
            confusionType: "décodage orthographique",
          },
          {
            id: "equilibrium",
            sentence: "La poutre est restée en ____ lorsque les deux côtés étaient également chargés.",
            options: ["équilibre", "equilibre", "équilabre", "équillbre"],
            correct: "équilibre",
            confusionType: "mot d'orthographe similaire",
          },
          {
            id: "conscience",
            sentence: "Il a agi selon sa ____ même si c'était difficile.",
            options: ["conscience", "concience", "consiance", "conscianse"],
            correct: "conscience",
            confusionType: "mot sonorité similaire",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "legislature",
            sentence: "أصدر ____ قانوناً جديداً ينظّم الخصوصية الإلكترونية.",
            options: ["البرلمان", "البرلمانن", "البرلماان", "البرلماني"],
            correct: "البرلمان",
            confusionType: "فك تشفير إملائي",
          },
          {
            id: "equilibrium",
            sentence: "ظل العارضة في ____ حين تساوت الأثقال على الجانبين.",
            options: ["توازن", "توزان", "توازان", "توازنن"],
            correct: "توازن",
            confusionType: "كلمة بشكل مشابه",
          },
          {
            id: "conscience",
            sentence: "تصرّف وفق ____ حتى حين كان الأمر صعباً.",
            options: ["ضميره", "ضميرو", "ضميرا", "ضميري"],
            correct: "ضميره",
            confusionType: "كلمة بصوت مشابه",
          },
        ],
      },
    },
  },
];

export const SECONDARY_PASSAGE_POOL = [
  {
    id: "sec-passage-a",
    content: {
      en: {
        text: "During the Industrial Revolution, rapid urbanisation changed the social fabric of European cities. Workers migrated from rural areas seeking employment in factories. This demographic shift strained housing, sanitation, and public services, eventually triggering social reform movements.",
        questions: [
          {
            prompt: "What did the demographic shift strain during the Industrial Revolution?",
            options: ["Housing, sanitation, and public services", "Factory production rates", "Agricultural output"],
            correct: "Housing, sanitation, and public services",
          },
          {
            prompt: "What did rapid urbanisation eventually trigger?",
            options: ["Social reform movements", "A decline in factory output", "Rural expansion"],
            correct: "Social reform movements",
          },
        ],
      },
      fr: {
        text: "Pendant la Révolution industrielle, l'urbanisation rapide a transformé le tissu social des villes européennes. Les travailleurs migraient des zones rurales à la recherche d'emplois dans les usines. Ce déplacement démographique a mis sous pression les logements, l'assainissement et les services publics, déclenchant finalement des mouvements de réforme sociale.",
        questions: [
          {
            prompt: "Qu'est-ce que le déplacement démographique a mis sous pression pendant la Révolution industrielle ?",
            options: ["Les logements, l'assainissement et les services publics", "Les taux de production des usines", "La production agricole"],
            correct: "Les logements, l'assainissement et les services publics",
          },
          {
            prompt: "Qu'est-ce que l'urbanisation rapide a finalement déclenché ?",
            options: ["Des mouvements de réforme sociale", "Un déclin de la production des usines", "L'expansion rurale"],
            correct: "Des mouvements de réforme sociale",
          },
        ],
      },
      ar: {
        text: "خلال الثورة الصناعية، غيّر التحضر السريع النسيج الاجتماعي للمدن الأوروبية. هاجر العمال من المناطق الريفية بحثاً عن عمل في المصانع. أدى هذا التحول الديموغرافي إلى الضغط على الإسكان والصرف الصحي والخدمات العامة، مما أشعل في نهاية المطاف حركات الإصلاح الاجتماعي.",
        questions: [
          {
            prompt: "على ماذا ضغط التحول الديموغرافي خلال الثورة الصناعية؟",
            options: ["الإسكان والصرف الصحي والخدمات العامة", "معدلات إنتاج المصانع", "الإنتاج الزراعي"],
            correct: "الإسكان والصرف الصحي والخدمات العامة",
          },
          {
            prompt: "ما الذي أشعله التحضر السريع في نهاية المطاف؟",
            options: ["حركات الإصلاح الاجتماعي", "تراجع إنتاج المصانع", "التوسع الريفي"],
            correct: "حركات الإصلاح الاجتماعي",
          },
        ],
      },
    },
  },
  {
    id: "sec-passage-b",
    content: {
      en: {
        text: "Photosynthesis converts light energy into chemical energy stored in glucose. This process occurs in the chloroplasts, using carbon dioxide from the air and water from the soil. Oxygen is released as a by-product, sustaining aerobic life on Earth.",
        questions: [
          {
            prompt: "Where does photosynthesis occur in plant cells?",
            options: ["In the chloroplasts", "In the nucleus", "In the cell wall"],
            correct: "In the chloroplasts",
          },
          {
            prompt: "What is released as a by-product of photosynthesis?",
            options: ["Oxygen", "Carbon dioxide", "Glucose"],
            correct: "Oxygen",
          },
        ],
      },
      fr: {
        text: "La photosynthèse convertit l'énergie lumineuse en énergie chimique stockée dans le glucose. Ce processus se déroule dans les chloroplastes, en utilisant le dioxyde de carbone de l'air et l'eau du sol. L'oxygène est libéré comme sous-produit, soutenant la vie aérobie sur Terre.",
        questions: [
          {
            prompt: "Où se déroule la photosynthèse dans les cellules végétales ?",
            options: ["Dans les chloroplastes", "Dans le noyau", "Dans la paroi cellulaire"],
            correct: "Dans les chloroplastes",
          },
          {
            prompt: "Qu'est-ce qui est libéré comme sous-produit de la photosynthèse ?",
            options: ["L'oxygène", "Le dioxyde de carbone", "Le glucose"],
            correct: "L'oxygène",
          },
        ],
      },
      ar: {
        text: "تحوّل عملية التمثيل الضوئي طاقة الضوء إلى طاقة كيميائية مخزنة في الجلوكوز. تجري هذه العملية في البلاستيدات الخضراء، مستخدمةً ثاني أكسيد الكربون من الهواء والماء من التربة. يُطلق الأكسجين كمنتج ثانوي مما يدعم الحياة الهوائية على الأرض.",
        questions: [
          {
            prompt: "أين تجري عملية التمثيل الضوئي في خلايا النبات؟",
            options: ["في البلاستيدات الخضراء", "في النواة", "في جدار الخلية"],
            correct: "في البلاستيدات الخضراء",
          },
          {
            prompt: "ما الذي يُطلق كمنتج ثانوي لعملية التمثيل الضوئي؟",
            options: ["الأكسجين", "ثاني أكسيد الكربون", "الجلوكوز"],
            correct: "الأكسجين",
          },
        ],
      },
    },
  },
  {
    id: "sec-passage-c",
    content: {
      en: {
        text: "Cognitive load theory suggests that working memory has a limited capacity. Instructional designers must balance the intrinsic load of the content, the extraneous load caused by poor presentation, and the germane load that builds long-term schemas.",
        questions: [
          {
            prompt: "According to the passage, what does cognitive load theory concern?",
            options: ["The limited capacity of working memory", "The speed of long-term memory retrieval", "The role of motivation in learning"],
            correct: "The limited capacity of working memory",
          },
          {
            prompt: "What type of load is caused by poor presentation?",
            options: ["Extraneous load", "Intrinsic load", "Germane load"],
            correct: "Extraneous load",
          },
        ],
      },
      fr: {
        text: "La théorie de la charge cognitive suggère que la mémoire de travail a une capacité limitée. Les concepteurs pédagogiques doivent équilibrer la charge intrinsèque du contenu, la charge extrinsèque causée par une mauvaise présentation, et la charge germinale qui construit des schémas à long terme.",
        questions: [
          {
            prompt: "Selon le texte, de quoi traite la théorie de la charge cognitive ?",
            options: ["La capacité limitée de la mémoire de travail", "La vitesse de récupération de la mémoire à long terme", "Le rôle de la motivation dans l'apprentissage"],
            correct: "La capacité limitée de la mémoire de travail",
          },
          {
            prompt: "Quel type de charge est causé par une mauvaise présentation ?",
            options: ["La charge extrinsèque", "La charge intrinsèque", "La charge germinale"],
            correct: "La charge extrinsèque",
          },
        ],
      },
      ar: {
        text: "تقترح نظرية العبء المعرفي أن الذاكرة العاملة لها طاقة استيعابية محدودة. يجب على مصممي التعليم الموازنة بين العبء الجوهري للمحتوى، والعبء الخارجي الناجم عن سوء العرض، والعبء الجرثومي الذي يبني مخططات طويلة الأمد.",
        questions: [
          {
            prompt: "وفقاً للمقطع، بم تتعلق نظرية العبء المعرفي؟",
            options: ["الطاقة الاستيعابية المحدودة للذاكرة العاملة", "سرعة استرجاع الذاكرة طويلة الأمد", "دور الدافعية في التعلم"],
            correct: "الطاقة الاستيعابية المحدودة للذاكرة العاملة",
          },
          {
            prompt: "ما نوع العبء الناجم عن سوء العرض؟",
            options: ["العبء الخارجي", "العبء الجوهري", "العبء الجرثومي"],
            correct: "العبء الخارجي",
          },
        ],
      },
    },
  },
];

export const SECONDARY_RECONSTRUCTION_POOL = [
  {
    id: "sec-reconstruction-a",
    content: {
      en: { words: ["Urbanisation", "strained", "housing", "and", "public", "service", "infrastructure."] },
      fr: { words: ["L'urbanisation", "a", "mis", "sous", "pression", "les", "services."] },
      ar: { words: ["أجهد", "التحضر", "البنية", "التحتية", "للإسكان", "والخدمات", "العامة."] },
    },
  },
  {
    id: "sec-reconstruction-b",
    content: {
      en: { words: ["Chloroplasts", "convert", "light", "energy", "into", "stored", "glucose."] },
      fr: { words: ["Les", "chloroplastes", "convertissent", "lumière", "en", "glucose", "stocké."] },
      ar: { words: ["تحوّل", "البلاستيدات", "الضوءَ", "إلى", "جلوكوز", "كيميائي", "مخزون."] },
    },
  },
  {
    id: "sec-reconstruction-c",
    content: {
      en: { words: ["Working", "memory", "capacity", "limits", "instructional", "design", "decisions."] },
      fr: { words: ["La", "capacité", "mémoire", "limite", "les", "décisions", "pédagogiques."] },
      ar: { words: ["تُقيّد", "طاقة", "الذاكرة", "العاملة", "قرارات", "التصميم", "التعليمي."] },
    },
  },
];

export const SECONDARY_MODALITY_POOL = [
  {
    id: "sec-modality-a",
    content: {
      en: {
        textOnly: {
          passage: "Hana read a chapter on supply and demand, then wrote a summary comparing equilibrium in two different markets.",
          question: {
            prompt: "What did Hana compare in her summary?",
            options: ["Equilibrium in two different markets", "Supply chains for two companies", "Demand curves for two products"],
            correct: "Equilibrium in two different markets",
          },
        },
        audioSupported: {
          passage: "Tariq listened to a lecture on climate policy and answered an exam question about carbon pricing.",
          question: {
            prompt: "What did Tariq answer after the lecture?",
            options: ["An exam question about carbon pricing", "A quiz on biodiversity", "A survey on energy use"],
            correct: "An exam question about carbon pricing",
          },
        },
      },
      fr: {
        textOnly: {
          passage: "Hana a lu un chapitre sur l'offre et la demande, puis a rédigé un résumé comparant l'équilibre dans deux marchés différents.",
          question: {
            prompt: "Qu'a comparé Hana dans son résumé ?",
            options: ["L'équilibre dans deux marchés différents", "Les chaînes d'approvisionnement de deux entreprises", "Les courbes de demande de deux produits"],
            correct: "L'équilibre dans deux marchés différents",
          },
        },
        audioSupported: {
          passage: "Tariq a écouté un cours sur la politique climatique et a répondu à une question d'examen sur la tarification du carbone.",
          question: {
            prompt: "À quoi Tariq a-t-il répondu après le cours ?",
            options: ["Une question d'examen sur la tarification du carbone", "Un quiz sur la biodiversité", "Une enquête sur la consommation d'énergie"],
            correct: "Une question d'examen sur la tarification du carbone",
          },
        },
      },
      ar: {
        textOnly: {
          passage: "قرأت هناء فصلاً حول العرض والطلب، ثم كتبت ملخصاً تقارن فيه التوازن في سوقين مختلفتين.",
          question: {
            prompt: "ماذا قارنت هناء في ملخصها؟",
            options: ["التوازن في سوقين مختلفتين", "سلاسل التوريد لشركتين", "منحنيات الطلب لمنتجين"],
            correct: "التوازن في سوقين مختلفتين",
          },
        },
        audioSupported: {
          passage: "استمع طارق لمحاضرة حول سياسة المناخ وأجاب على سؤال امتحان حول تسعير الكربون.",
          question: {
            prompt: "على ماذا أجاب طارق بعد المحاضرة؟",
            options: ["سؤال امتحان حول تسعير الكربون", "اختبار حول التنوع البيولوجي", "استبيان حول استهلاك الطاقة"],
            correct: "سؤال امتحان حول تسعير الكربون",
          },
        },
      },
    },
  },
  {
    id: "sec-modality-b",
    content: {
      en: {
        textOnly: {
          passage: "Dana annotated a poem, identifying metaphors and structural techniques the poet used to convey isolation.",
          question: {
            prompt: "What was Dana identifying in the poem?",
            options: ["Metaphors and structural techniques", "Rhyme schemes and syllable counts", "Historical references and dates"],
            correct: "Metaphors and structural techniques",
          },
        },
        audioSupported: {
          passage: "Faris listened to a documentary about neural networks and connected it to the machine learning unit he had studied.",
          question: {
            prompt: "What did Faris connect the documentary to?",
            options: ["The machine learning unit he had studied", "A biology experiment", "A software programming project"],
            correct: "The machine learning unit he had studied",
          },
        },
      },
      fr: {
        textOnly: {
          passage: "Dana a annoté un poème en identifiant les métaphores et les techniques structurelles utilisées pour transmettre l'isolement.",
          question: {
            prompt: "Qu'est-ce que Dana identifiait dans le poème ?",
            options: ["Les métaphores et les techniques structurelles", "Les schémas de rimes et les décomptes de syllabes", "Les références historiques et les dates"],
            correct: "Les métaphores et les techniques structurelles",
          },
        },
        audioSupported: {
          passage: "Faris a écouté un documentaire sur les réseaux de neurones et l'a lié au module d'apprentissage automatique qu'il avait étudié.",
          question: {
            prompt: "À quoi Faris a-t-il lié le documentaire ?",
            options: ["Au module d'apprentissage automatique qu'il avait étudié", "À une expérience de biologie", "À un projet de programmation logicielle"],
            correct: "Au module d'apprentissage automatique qu'il avait étudié",
          },
        },
      },
      ar: {
        textOnly: {
          passage: "علّقت دانا على قصيدة مُحدِّدةً الاستعارات والأساليب البنيوية التي استخدمها الشاعر للتعبير عن العزلة.",
          question: {
            prompt: "ما الذي كانت دانا تُحدّده في القصيدة؟",
            options: ["الاستعارات والأساليب البنيوية", "أنماط القافية وعدد المقاطع", "المراجع التاريخية والتواريخ"],
            correct: "الاستعارات والأساليب البنيوية",
          },
        },
        audioSupported: {
          passage: "استمع فارس لوثائقي حول الشبكات العصبية وربطه بوحدة التعلم الآلي التي درسها.",
          question: {
            prompt: "بم ربط فارس الوثائقي؟",
            options: ["وحدة التعلم الآلي التي درسها", "تجربة أحياء", "مشروع برمجة حاسوبية"],
            correct: "وحدة التعلم الآلي التي درسها",
          },
        },
      },
    },
  },
  {
    id: "sec-modality-c",
    content: {
      en: {
        textOnly: {
          passage: "Reem read the case study on organisational change and identified two root causes for the resistance to reform.",
          question: {
            prompt: "What did Reem identify in the case study?",
            options: ["Two root causes for the resistance to reform", "Two successful outcomes of change", "Two competitors of the organisation"],
            correct: "Two root causes for the resistance to reform",
          },
        },
        audioSupported: {
          passage: "Khalid listened to a podcast debate on renewable energy and noted the strongest counterargument presented.",
          question: {
            prompt: "What did Khalid note during the podcast?",
            options: ["The strongest counterargument", "The host's personal opinion", "A list of energy companies"],
            correct: "The strongest counterargument",
          },
        },
      },
      fr: {
        textOnly: {
          passage: "Reem a lu l'étude de cas sur le changement organisationnel et a identifié deux causes profondes de la résistance à la réforme.",
          question: {
            prompt: "Qu'est-ce que Reem a identifié dans l'étude de cas ?",
            options: ["Deux causes profondes de la résistance à la réforme", "Deux résultats positifs du changement", "Deux concurrents de l'organisation"],
            correct: "Deux causes profondes de la résistance à la réforme",
          },
        },
        audioSupported: {
          passage: "Khalid a écouté un débat de podcast sur les énergies renouvelables et a noté le contre-argument le plus fort présenté.",
          question: {
            prompt: "Qu'est-ce que Khalid a noté pendant le podcast ?",
            options: ["Le contre-argument le plus fort", "L'opinion personnelle de l'animateur", "Une liste d'entreprises énergétiques"],
            correct: "Le contre-argument le plus fort",
          },
        },
      },
      ar: {
        textOnly: {
          passage: "قرأت ريم دراسة الحالة حول التغيير التنظيمي وحدّدت سببين جذريين لمقاومة الإصلاح.",
          question: {
            prompt: "ماذا حدّدت ريم في دراسة الحالة؟",
            options: ["سببين جذريين لمقاومة الإصلاح", "نتيجتين ناجحتين للتغيير", "منافسين للمؤسسة"],
            correct: "سببين جذريين لمقاومة الإصلاح",
          },
        },
        audioSupported: {
          passage: "استمع خالد لنقاش بودكاست حول الطاقة المتجددة ودوّن أقوى حجة مضادة قُدّمت.",
          question: {
            prompt: "ماذا دوّن خالد أثناء البودكاست؟",
            options: ["أقوى حجة مضادة", "رأي المقدّم الشخصي", "قائمة بشركات الطاقة"],
            correct: "أقوى حجة مضادة",
          },
        },
      },
    },
  },
];

// ─── ADVANCED LEVEL POOLS ─────────────────────────────────────────────────────

export const ADVANCED_WORD_ITEMS_POOL = [
  {
    id: "adv-words-a",
    content: {
      en: {
        items: [
          {
            id: "epistemological",
            sentence: "The researcher raised an ____ question about the limits of empirical knowledge.",
            options: ["epistemological", "epistomological", "epistemologicle", "epistemologial"],
            correct: "epistemological",
            confusionType: "orthographic decoding",
          },
          {
            id: "exacerbate",
            sentence: "Poor infrastructure can ____ inequality in access to education.",
            options: ["exacerbate", "exaccerbate", "exaserbate", "exacerbait"],
            correct: "exacerbate",
            confusionType: "similar-looking word",
          },
          {
            id: "juxtaposition",
            sentence: "The author used ____ to highlight the contrast between wealth and poverty.",
            options: ["juxtaposition", "juxtapostion", "juxtaposision", "juxtoposition"],
            correct: "juxtaposition",
            confusionType: "orthographic decoding",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "epistemological",
            sentence: "Le chercheur a soulevé une question ____ sur les limites de la connaissance empirique.",
            options: ["épistémologique", "epistemologique", "épistémologicale", "épistémologigue"],
            correct: "épistémologique",
            confusionType: "décodage orthographique",
          },
          {
            id: "exacerbate",
            sentence: "Une mauvaise infrastructure peut ____ les inégalités d'accès à l'éducation.",
            options: ["exacerber", "exacébrer", "exasperber", "exacerebar"],
            correct: "exacerber",
            confusionType: "mot d'orthographe similaire",
          },
          {
            id: "juxtaposition",
            sentence: "L'auteur a utilisé la ____ pour souligner le contraste entre richesse et pauvreté.",
            options: ["juxtaposition", "juxtaposision", "juxtoposition", "juxtapositon"],
            correct: "juxtaposition",
            confusionType: "décodage orthographique",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "epistemological",
            sentence: "أثار الباحث سؤالاً ____ حول حدود المعرفة التجريبية.",
            options: ["إبستيمولوجياً", "إبستمولوجياً", "إبستيمولوجيا", "إبستيمولجياً"],
            correct: "إبستيمولوجياً",
            confusionType: "فك تشفير إملائي",
          },
          {
            id: "exacerbate",
            sentence: "يمكن للبنية التحتية السيئة أن ____ عدم المساواة في الوصول إلى التعليم.",
            options: ["تفاقم", "تفاقم", "تفاقمم", "تتفاقم"],
            correct: "تفاقم",
            confusionType: "كلمة بشكل مشابه",
          },
          {
            id: "juxtaposition",
            sentence: "استخدم المؤلف ____ لإبراز التناقض بين الثروة والفقر.",
            options: ["التقابل", "التقابلل", "التقابال", "التقابلو"],
            correct: "التقابل",
            confusionType: "فك تشفير إملائي",
          },
        ],
      },
    },
  },
  {
    id: "adv-words-b",
    content: {
      en: {
        items: [
          {
            id: "idiosyncratic",
            sentence: "Her ____ writing style was instantly recognisable among scholars.",
            options: ["idiosyncratic", "idiosincratic", "idiosyncratik", "idiosyncrattic"],
            correct: "idiosyncratic",
            confusionType: "orthographic decoding",
          },
          {
            id: "surreptitious",
            sentence: "He took a ____ glance at his notes during the oral presentation.",
            options: ["surreptitious", "sureptitious", "surreptious", "sureptious"],
            correct: "surreptitious",
            confusionType: "similar-looking word",
          },
          {
            id: "obfuscate",
            sentence: "Dense bureaucratic language can ____ the meaning of policy documents.",
            options: ["obfuscate", "obfuscait", "obfusicate", "obfustate"],
            correct: "obfuscate",
            confusionType: "orthographic decoding",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "idiosyncratic",
            sentence: "Son style d'écriture ____ était immédiatement reconnaissable parmi les chercheurs.",
            options: ["idiosyncrasique", "idiosincrasique", "idiosyncrasike", "idiosyncrasicque"],
            correct: "idiosyncrasique",
            confusionType: "décodage orthographique",
          },
          {
            id: "surreptitious",
            sentence: "Il a jeté un regard ____ à ses notes pendant la présentation orale.",
            options: ["furtif", "furtiv", "furtiff", "furtife"],
            correct: "furtif",
            confusionType: "mot d'orthographe similaire",
          },
          {
            id: "obfuscate",
            sentence: "Un langage bureaucratique dense peut ____ le sens des documents de politique.",
            options: ["obscurcir", "obscurcire", "obcscurcir", "obscursir"],
            correct: "obscurcir",
            confusionType: "décodage orthographique",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "idiosyncratic",
            sentence: "كان أسلوبها الكتابي ____ قابلاً للتعرف عليه فوراً بين العلماء.",
            options: ["المميز", "المميزز", "المميزا", "المميزو"],
            correct: "المميز",
            confusionType: "فك تشفير إملائي",
          },
          {
            id: "surreptitious",
            sentence: "ألقى نظرة ____ على ملاحظاته أثناء العرض الشفهي.",
            options: ["خاطفة", "خاطفه", "خاطفا", "خاطفي"],
            correct: "خاطفة",
            confusionType: "كلمة بشكل مشابه",
          },
          {
            id: "obfuscate",
            sentence: "يمكن للغة البيروقراطية الكثيفة أن ____ معنى وثائق السياسة.",
            options: ["تُعتّم", "تعتّم", "تعتّمم", "تُعتّمم"],
            correct: "تُعتّم",
            confusionType: "فك تشفير إملائي",
          },
        ],
      },
    },
  },
  {
    id: "adv-words-c",
    content: {
      en: {
        items: [
          {
            id: "hegemony",
            sentence: "The essay analysed the cultural ____ of Western media in developing nations.",
            options: ["hegemony", "hegimony", "hegemmony", "hegemoney"],
            correct: "hegemony",
            confusionType: "orthographic decoding",
          },
          {
            id: "proclivity",
            sentence: "Her ____ for empirical reasoning shaped her entire research methodology.",
            options: ["proclivity", "proclivity", "proclivity", "proclivity"],
            correct: "proclivity",
            confusionType: "similar-looking word",
          },
          {
            id: "ameliorate",
            sentence: "Targeted interventions can ____ the effects of poverty on academic achievement.",
            options: ["ameliorate", "amelorate", "amelioarete", "amleiorate"],
            correct: "ameliorate",
            confusionType: "orthographic decoding",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "hegemony",
            sentence: "L'essai analysait l'____ culturelle des médias occidentaux dans les pays en développement.",
            options: ["hégémonie", "hegémonie", "hégémoniee", "hégémonni"],
            correct: "hégémonie",
            confusionType: "décodage orthographique",
          },
          {
            id: "proclivity",
            sentence: "Sa ____ pour le raisonnement empirique a façonné toute sa méthodologie de recherche.",
            options: ["inclination", "inclinaison", "inclinacion", "inclinnation"],
            correct: "inclination",
            confusionType: "mot d'orthographe similaire",
          },
          {
            id: "ameliorate",
            sentence: "Des interventions ciblées peuvent ____ les effets de la pauvreté sur la réussite scolaire.",
            options: ["atténuer", "attenuer", "atténueer", "atténuerr"],
            correct: "atténuer",
            confusionType: "décodage orthographique",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "hegemony",
            sentence: "حلّل المقال ____ الثقافية لوسائل الإعلام الغربية في الدول النامية.",
            options: ["الهيمنة", "الهيمنه", "الهيمنا", "الهيمنو"],
            correct: "الهيمنة",
            confusionType: "فك تشفير إملائي",
          },
          {
            id: "proclivity",
            sentence: "شكّل ميلها ____ للتفكير التجريبي منهجية بحثها بأكملها.",
            options: ["الشديد", "الشديدد", "الشديدا", "الشديدو"],
            correct: "الشديد",
            confusionType: "كلمة بشكل مشابه",
          },
          {
            id: "ameliorate",
            sentence: "يمكن للتدخلات المستهدفة أن ____ آثار الفقر على التحصيل الأكاديمي.",
            options: ["تخفّف", "تخففف", "تخففا", "تخففو"],
            correct: "تخفّف",
            confusionType: "فك تشفير إملائي",
          },
        ],
      },
    },
  },
];

export const ADVANCED_PASSAGE_POOL = [
  {
    id: "adv-passage-a",
    content: {
      en: {
        text: "Post-structuralist thinkers challenged the notion that language transparently reflects reality. They argued that meaning is not inherent in words but is produced through difference — through what a word is not. This shift destabilised the assumption of a fixed, knowable truth accessible through rational discourse.",
        questions: [
          {
            prompt: "According to post-structuralists, how is meaning produced?",
            options: ["Through difference — what a word is not", "Through direct reference to external reality", "Through consensus among speakers"],
            correct: "Through difference — what a word is not",
          },
          {
            prompt: "What assumption did this shift destabilise?",
            options: ["The assumption of a fixed, knowable truth", "The assumption that grammar shapes thought", "The assumption that dictionaries define meaning"],
            correct: "The assumption of a fixed, knowable truth",
          },
        ],
      },
      fr: {
        text: "Les penseurs post-structuralistes ont remis en question l'idée que le langage reflète de manière transparente la réalité. Ils ont soutenu que le sens n'est pas inhérent aux mots, mais qu'il est produit par la différence — par ce qu'un mot n'est pas. Ce changement a déstabilisé l'hypothèse d'une vérité fixe et connaissable accessible par le discours rationnel.",
        questions: [
          {
            prompt: "Selon les post-structuralistes, comment le sens est-il produit ?",
            options: ["Par la différence — ce qu'un mot n'est pas", "Par référence directe à la réalité externe", "Par consensus entre les locuteurs"],
            correct: "Par la différence — ce qu'un mot n'est pas",
          },
          {
            prompt: "Quelle hypothèse ce changement a-t-il déstabilisée ?",
            options: ["L'hypothèse d'une vérité fixe et connaissable", "L'hypothèse que la grammaire façonne la pensée", "L'hypothèse que les dictionnaires définissent le sens"],
            correct: "L'hypothèse d'une vérité fixe et connaissable",
          },
        ],
      },
      ar: {
        text: "طعن المفكرون ما بعد البنيويون في فكرة أن اللغة تعكس الواقع بشفافية. جادلوا بأن المعنى ليس متأصلاً في الكلمات، بل يُنتَج من خلال الاختلاف — من خلال ما ليست عليه الكلمة. زعزع هذا التحول افتراض وجود حقيقة ثابتة وقابلة للمعرفة يمكن الوصول إليها عبر الخطاب العقلاني.",
        questions: [
          {
            prompt: "وفقاً لما بعد البنيويين، كيف يُنتَج المعنى؟",
            options: ["من خلال الاختلاف — ما ليست عليه الكلمة", "من خلال الإحالة المباشرة إلى الواقع الخارجي", "من خلال الإجماع بين المتحدثين"],
            correct: "من خلال الاختلاف — ما ليست عليه الكلمة",
          },
          {
            prompt: "ما الافتراض الذي زعزع هذا التحول؟",
            options: ["افتراض وجود حقيقة ثابتة وقابلة للمعرفة", "افتراض أن القواعد تُشكّل الفكر", "افتراض أن القواميس تُعرّف المعنى"],
            correct: "افتراض وجود حقيقة ثابتة وقابلة للمعرفة",
          },
        ],
      },
    },
  },
  {
    id: "adv-passage-b",
    content: {
      en: {
        text: "Prospect theory, developed by Kahneman and Tversky, demonstrates that people evaluate outcomes relative to a reference point rather than in absolute terms. Losses are weighted more heavily than equivalent gains, a phenomenon known as loss aversion. This has profound implications for decision-making under uncertainty in finance and policy design.",
        questions: [
          {
            prompt: "How do people evaluate outcomes according to prospect theory?",
            options: ["Relative to a reference point", "In absolute monetary terms", "Based on probability alone"],
            correct: "Relative to a reference point",
          },
          {
            prompt: "What is loss aversion?",
            options: ["Losses being weighted more heavily than equivalent gains", "Avoiding all risky decisions", "Preferring certain outcomes to uncertain ones"],
            correct: "Losses being weighted more heavily than equivalent gains",
          },
        ],
      },
      fr: {
        text: "La théorie des perspectives, développée par Kahneman et Tversky, montre que les gens évaluent les résultats par rapport à un point de référence plutôt qu'en termes absolus. Les pertes sont pondérées plus lourdement que les gains équivalents, un phénomène connu sous le nom d'aversion aux pertes. Cela a de profondes implications pour la prise de décision en situation d'incertitude en finance et dans la conception des politiques.",
        questions: [
          {
            prompt: "Comment les gens évaluent-ils les résultats selon la théorie des perspectives ?",
            options: ["Par rapport à un point de référence", "En termes monétaires absolus", "Uniquement sur la base de la probabilité"],
            correct: "Par rapport à un point de référence",
          },
          {
            prompt: "Qu'est-ce que l'aversion aux pertes ?",
            options: ["Les pertes sont pondérées plus lourdement que les gains équivalents", "Éviter toutes les décisions risquées", "Préférer les résultats certains aux résultats incertains"],
            correct: "Les pertes sont pondérées plus lourdement que les gains équivalents",
          },
        ],
      },
      ar: {
        text: "تُظهر نظرية الآفاق التي طوّرها كانيمان وتفيرسكي أن الناس يُقيّمون النتائج بالنسبة إلى نقطة مرجعية لا بمصطلحات مطلقة. تُوزن الخسائر بثقل أكبر من المكاسب المكافئة، وهو ما يُعرف بـ'نفور الخسارة'. لهذا انعكاسات عميقة على اتخاذ القرار في ظل عدم اليقين في مجال التمويل وتصميم السياسات.",
        questions: [
          {
            prompt: "كيف يُقيّم الناس النتائج وفق نظرية الآفاق؟",
            options: ["بالنسبة إلى نقطة مرجعية", "بمصطلحات نقدية مطلقة", "بناءً على الاحتمالية وحدها"],
            correct: "بالنسبة إلى نقطة مرجعية",
          },
          {
            prompt: "ما هو نفور الخسارة؟",
            options: ["توزين الخسائر بثقل أكبر من المكاسب المكافئة", "تجنب جميع القرارات المحفوفة بالمخاطر", "تفضيل النتائج المؤكدة على غير المؤكدة"],
            correct: "توزين الخسائر بثقل أكبر من المكاسب المكافئة",
          },
        ],
      },
    },
  },
  {
    id: "adv-passage-c",
    content: {
      en: {
        text: "CRISPR-Cas9 enables precise editing of the genome by using a guide RNA to direct the Cas9 enzyme to a specific DNA sequence, where it introduces a double-strand break. The cell's repair mechanisms then either disrupt the gene or incorporate a new sequence. While promising for therapeutic use, off-target effects remain a significant ethical and technical concern.",
        questions: [
          {
            prompt: "What does the guide RNA do in CRISPR-Cas9?",
            options: ["Directs the Cas9 enzyme to a specific DNA sequence", "Repairs the double-strand break", "Incorporates the new genetic sequence"],
            correct: "Directs the Cas9 enzyme to a specific DNA sequence",
          },
          {
            prompt: "What concern does the passage highlight about CRISPR?",
            options: ["Off-target effects as an ethical and technical concern", "The high cost of genome sequencing", "The difficulty of delivering guide RNA to cells"],
            correct: "Off-target effects as an ethical and technical concern",
          },
        ],
      },
      fr: {
        text: "CRISPR-Cas9 permet l'édition précise du génome en utilisant un ARN guide pour diriger l'enzyme Cas9 vers une séquence d'ADN spécifique, où elle introduit une coupure double brin. Les mécanismes de réparation cellulaire perturbent alors le gène ou incorporent une nouvelle séquence. Bien que prometteuse pour un usage thérapeutique, les effets hors cible restent une préoccupation éthique et technique importante.",
        questions: [
          {
            prompt: "Quel est le rôle de l'ARN guide dans CRISPR-Cas9 ?",
            options: ["Diriger l'enzyme Cas9 vers une séquence d'ADN spécifique", "Réparer la coupure double brin", "Incorporer la nouvelle séquence génétique"],
            correct: "Diriger l'enzyme Cas9 vers une séquence d'ADN spécifique",
          },
          {
            prompt: "Quelle préoccupation le texte soulève-t-il concernant CRISPR ?",
            options: ["Les effets hors cible comme préoccupation éthique et technique", "Le coût élevé du séquençage du génome", "La difficulté de livrer l'ARN guide aux cellules"],
            correct: "Les effets hors cible comme préoccupation éthique et technique",
          },
        ],
      },
      ar: {
        text: "تتيح تقنية CRISPR-Cas9 تحرير الجينوم بدقة باستخدام RNA موجّه لتوجيه إنزيم Cas9 إلى تسلسل DNA محدد حيث يُحدث كسراً مزدوجاً في الخيط. تقوم آليات إصلاح الخلية بعد ذلك إما بتعطيل الجين أو دمج تسلسل جديد. وعلى الرغم من إمكاناتها العلاجية الواعدة، تظل التأثيرات خارج الهدف قلقاً أخلاقياً وتقنياً بالغ الأهمية.",
        questions: [
          {
            prompt: "ما دور RNA الموجّه في تقنية CRISPR-Cas9؟",
            options: ["توجيه إنزيم Cas9 إلى تسلسل DNA محدد", "إصلاح الكسر المزدوج في الخيط", "دمج التسلسل الجيني الجديد"],
            correct: "توجيه إنزيم Cas9 إلى تسلسل DNA محدد",
          },
          {
            prompt: "ما القلق الذي يُثيره المقطع بشأن CRISPR؟",
            options: ["التأثيرات خارج الهدف كقلق أخلاقي وتقني", "التكلفة العالية لتسلسل الجينوم", "صعوبة إيصال RNA الموجّه إلى الخلايا"],
            correct: "التأثيرات خارج الهدف كقلق أخلاقي وتقني",
          },
        ],
      },
    },
  },
];

export const ADVANCED_RECONSTRUCTION_POOL = [
  {
    id: "adv-reconstruction-a",
    content: {
      en: { words: ["Meaning", "is", "produced", "through", "linguistic", "difference,", "not", "reference."] },
      fr: { words: ["Le", "sens", "est", "produit", "par", "la", "différence", "linguistique."] },
      ar: { words: ["يُنتَج", "المعنى", "من", "خلال", "الاختلاف", "اللغوي", "لا", "الإحالة."] },
    },
  },
  {
    id: "adv-reconstruction-b",
    content: {
      en: { words: ["Loss", "aversion", "distorts", "rational", "decision-making", "under", "uncertainty."] },
      fr: { words: ["L'aversion", "aux", "pertes", "fausse", "la", "prise", "de", "décision."] },
      ar: { words: ["يُشوّه", "نفور", "الخسارة", "اتخاذ", "القرار", "العقلاني", "في", "الغموض."] },
    },
  },
  {
    id: "adv-reconstruction-c",
    content: {
      en: { words: ["CRISPR", "off-target", "effects", "raise", "unresolved", "ethical", "concerns."] },
      fr: { words: ["Les", "effets", "hors", "cible", "de", "CRISPR", "soulèvent", "préoccupations."] },
      ar: { words: ["تُثير", "تأثيرات", "CRISPR", "خارج", "الهدف", "مخاوف", "أخلاقية", "مفتوحة."] },
    },
  },
];

export const ADVANCED_MODALITY_POOL = [
  {
    id: "adv-modality-a",
    content: {
      en: {
        textOnly: {
          passage: "Yasmin read a dense paper on Foucauldian discourse analysis and annotated where power relations were implied through word choice.",
          question: {
            prompt: "What was Yasmin annotating in the paper?",
            options: ["Where power relations were implied through word choice", "Where the author cited primary sources", "Where statistical data was presented"],
            correct: "Where power relations were implied through word choice",
          },
        },
        audioSupported: {
          passage: "Rashid listened to a seminar recording on behavioural economics and compared its claims to a paper he had already read.",
          question: {
            prompt: "What did Rashid compare the seminar claims to?",
            options: ["A paper he had already read", "A lecture from last semester", "His own field observations"],
            correct: "A paper he had already read",
          },
        },
      },
      fr: {
        textOnly: {
          passage: "Yasmin a lu un article dense sur l'analyse du discours foucaldien et a annoté les endroits où les relations de pouvoir étaient impliquées par le choix des mots.",
          question: {
            prompt: "Qu'annotait Yasmin dans l'article ?",
            options: ["Les endroits où les relations de pouvoir étaient impliquées par le choix des mots", "Les endroits où l'auteur citait des sources primaires", "Les endroits où des données statistiques étaient présentées"],
            correct: "Les endroits où les relations de pouvoir étaient impliquées par le choix des mots",
          },
        },
        audioSupported: {
          passage: "Rachid a écouté l'enregistrement d'un séminaire sur l'économie comportementale et a comparé ses affirmations à un article qu'il avait déjà lu.",
          question: {
            prompt: "À quoi Rachid a-t-il comparé les affirmations du séminaire ?",
            options: ["À un article qu'il avait déjà lu", "À un cours du semestre précédent", "À ses propres observations de terrain"],
            correct: "À un article qu'il avait déjà lu",
          },
        },
      },
      ar: {
        textOnly: {
          passage: "قرأت ياسمين ورقة بحثية كثيفة حول تحليل الخطاب الفوكوي وعلّقت على المواضع التي تتضمن علاقات قوة من خلال اختيار الكلمات.",
          question: {
            prompt: "ما الذي كانت ياسمين تُعلّق عليه في الورقة؟",
            options: ["المواضع التي تتضمن علاقات قوة من خلال اختيار الكلمات", "المواضع التي استشهد فيها المؤلف بمصادر أولية", "المواضع التي قُدّمت فيها بيانات إحصائية"],
            correct: "المواضع التي تتضمن علاقات قوة من خلال اختيار الكلمات",
          },
        },
        audioSupported: {
          passage: "استمع راشد لتسجيل ندوة حول الاقتصاد السلوكي وقارن ادعاءاتها بورقة بحثية قرأها مسبقاً.",
          question: {
            prompt: "بم قارن راشد ادعاءات الندوة؟",
            options: ["بورقة بحثية قرأها مسبقاً", "بمحاضرة من الفصل الماضي", "بملاحظاته الميدانية الخاصة"],
            correct: "بورقة بحثية قرأها مسبقاً",
          },
        },
      },
    },
  },
  {
    id: "adv-modality-b",
    content: {
      en: {
        textOnly: {
          passage: "The research team read conflicting studies on synaptic plasticity and synthesised a framework reconciling their methodological differences.",
          question: {
            prompt: "What did the research team synthesise?",
            options: ["A framework reconciling methodological differences", "A new experimental protocol", "A literature review on neuroscience history"],
            correct: "A framework reconciling methodological differences",
          },
        },
        audioSupported: {
          passage: "Dr Amara listened to a panel debate on universal basic income and critiqued the underlying assumptions of the strongest argument.",
          question: {
            prompt: "What did Dr Amara critique after the debate?",
            options: ["The underlying assumptions of the strongest argument", "The credentials of each panellist", "The moderator's framing of questions"],
            correct: "The underlying assumptions of the strongest argument",
          },
        },
      },
      fr: {
        textOnly: {
          passage: "L'équipe de recherche a lu des études contradictoires sur la plasticité synaptique et a synthétisé un cadre réconciliant leurs différences méthodologiques.",
          question: {
            prompt: "Qu'a synthétisé l'équipe de recherche ?",
            options: ["Un cadre réconciliant les différences méthodologiques", "Un nouveau protocole expérimental", "Une revue de littérature sur l'histoire des neurosciences"],
            correct: "Un cadre réconciliant les différences méthodologiques",
          },
        },
        audioSupported: {
          passage: "Le Dr Amara a écouté un débat de panel sur le revenu universel de base et a critiqué les hypothèses sous-jacentes de l'argument le plus fort.",
          question: {
            prompt: "Qu'a critiqué le Dr Amara après le débat ?",
            options: ["Les hypothèses sous-jacentes de l'argument le plus fort", "Les qualifications de chaque panéliste", "La formulation des questions par le modérateur"],
            correct: "Les hypothèses sous-jacentes de l'argument le plus fort",
          },
        },
      },
      ar: {
        textOnly: {
          passage: "قرأ فريق البحث دراسات متعارضة حول اللدونة التشابكية وصاغ إطاراً يُوفّق بين اختلافاتها المنهجية.",
          question: {
            prompt: "ما الذي صاغه فريق البحث؟",
            options: ["إطاراً يوفق بين الاختلافات المنهجية", "بروتوكولاً تجريبياً جديداً", "مراجعة أدبيات حول تاريخ علم الأعصاب"],
            correct: "إطاراً يوفق بين الاختلافات المنهجية",
          },
        },
        audioSupported: {
          passage: "استمعت الدكتورة أمارة لنقاش لجنة حول الدخل الأساسي الشامل وانتقدت الافتراضات الكامنة في أقوى حجة.",
          question: {
            prompt: "ما الذي انتقدته الدكتورة أمارة بعد النقاش؟",
            options: ["الافتراضات الكامنة في أقوى حجة", "مؤهلات كل عضو في اللجنة", "صياغة أسئلة المحاور"],
            correct: "الافتراضات الكامنة في أقوى حجة",
          },
        },
      },
    },
  },
  {
    id: "adv-modality-c",
    content: {
      en: {
        textOnly: {
          passage: "Nour read a comparative constitutional analysis and identified where judicial review provisions diverged across three national legal systems.",
          question: {
            prompt: "What did Nour identify in the comparative analysis?",
            options: ["Where judicial review provisions diverged across three national legal systems", "Where criminal codes overlapped in two countries", "Where parliamentary procedures were most efficient"],
            correct: "Where judicial review provisions diverged across three national legal systems",
          },
        },
        audioSupported: {
          passage: "Idris listened to a recorded lecture on quantum entanglement and formulated a question challenging the interpretation of non-locality.",
          question: {
            prompt: "What did Idris formulate after the lecture?",
            options: ["A question challenging the interpretation of non-locality", "A summary of quantum experiments", "A definition of wave-particle duality"],
            correct: "A question challenging the interpretation of non-locality",
          },
        },
      },
      fr: {
        textOnly: {
          passage: "Nour a lu une analyse constitutionnelle comparative et a identifié les endroits où les dispositions de contrôle judiciaire divergeaient dans trois systèmes juridiques nationaux.",
          question: {
            prompt: "Qu'a identifié Nour dans l'analyse comparative ?",
            options: ["Les endroits où les dispositions de contrôle judiciaire divergeaient dans trois systèmes juridiques nationaux", "Les endroits où les codes pénaux se chevauchaient dans deux pays", "Les endroits où les procédures parlementaires étaient les plus efficaces"],
            correct: "Les endroits où les dispositions de contrôle judiciaire divergeaient dans trois systèmes juridiques nationaux",
          },
        },
        audioSupported: {
          passage: "Idris a écouté un enregistrement de cours sur l'intrication quantique et a formulé une question remettant en cause l'interprétation de la non-localité.",
          question: {
            prompt: "Qu'a formulé Idris après le cours ?",
            options: ["Une question remettant en cause l'interprétation de la non-localité", "Un résumé des expériences quantiques", "Une définition de la dualité onde-corpuscule"],
            correct: "Une question remettant en cause l'interprétation de la non-localité",
          },
        },
      },
      ar: {
        textOnly: {
          passage: "قرأت نور تحليلاً دستورياً مقارناً وحدّدت المواضع التي تتباين فيها أحكام المراجعة القضائية في ثلاثة أنظمة قانونية وطنية.",
          question: {
            prompt: "ما الذي حدّدته نور في التحليل المقارن؟",
            options: ["المواضع التي تتباين فيها أحكام المراجعة القضائية في ثلاثة أنظمة قانونية وطنية", "المواضع التي تتداخل فيها القوانين الجنائية في بلدين", "المواضع التي كانت فيها الإجراءات البرلمانية أكثر كفاءة"],
            correct: "المواضع التي تتباين فيها أحكام المراجعة القضائية في ثلاثة أنظمة قانونية وطنية",
          },
        },
        audioSupported: {
          passage: "استمع إدريس لمحاضرة مسجّلة حول التشابك الكمي وصاغ سؤالاً يتحدى تفسير اللاموضعية.",
          question: {
            prompt: "ما الذي صاغه إدريس بعد المحاضرة؟",
            options: ["سؤالاً يتحدى تفسير اللاموضعية", "ملخصاً للتجارب الكمية", "تعريفاً لازدواجية الموجة والجسيم"],
            correct: "سؤالاً يتحدى تفسير اللاموضعية",
          },
        },
      },
    },
  },
];

// ─── MODALITY PAIRS (text-only + audio-supported) ────────────────────────────

export const MODALITY_POOL = [
  {
    id: "modality-a",
    content: {
      en: {
        textOnly: {
          passage: "Lina revised her notes before the quiz and marked each key term with a colored symbol.",
          question: {
            prompt: "What did Lina mark with a colored symbol?",
            options: ["Each key term", "The quiz date", "Her desk drawer"],
            correct: "Each key term",
          },
        },
        audioSupported: {
          passage: "Omar listened to the history summary, then reread the paragraph and chose the strongest title.",
          question: {
            prompt: "What did Omar do after listening to the summary?",
            options: ["He reread the paragraph", "He left the classroom", "He counted the chairs"],
            correct: "He reread the paragraph",
          },
        },
      },
      fr: {
        textOnly: {
          passage: "Lina a revu ses notes avant le quiz et a marqué chaque terme clé avec un symbole coloré.",
          question: {
            prompt: "Qu'est-ce que Lina a marqué avec un symbole coloré ?",
            options: ["Chaque terme clé", "La date du quiz", "Le tiroir de son bureau"],
            correct: "Chaque terme clé",
          },
        },
        audioSupported: {
          passage: "Omar a écouté le résumé historique, puis a relu le paragraphe et choisi le titre le plus fort.",
          question: {
            prompt: "Qu'a fait Omar après avoir écouté le résumé ?",
            options: ["Il a relu le paragraphe", "Il a quitté la classe", "Il a compté les chaises"],
            correct: "Il a relu le paragraphe",
          },
        },
      },
      ar: {
        textOnly: {
          passage: "راجعت لينا ملاحظاتها قبل الاختبار وعلّمت كل مصطلح رئيسي برمز ملوّن.",
          question: {
            prompt: "ماذا علّمت لينا برمز ملوّن؟",
            options: ["كل مصطلح رئيسي", "تاريخ الاختبار", "درج مكتبها"],
            correct: "كل مصطلح رئيسي",
          },
        },
        audioSupported: {
          passage: "استمع عمر إلى ملخص التاريخ، ثم أعاد قراءة الفقرة واختار العنوان الأقوى.",
          question: {
            prompt: "ماذا فعل عمر بعد الاستماع إلى الملخص؟",
            options: ["أعاد قراءة الفقرة", "غادر الفصل", "عدّ الكراسي"],
            correct: "أعاد قراءة الفقرة",
          },
        },
      },
    },
  },
  {
    id: "modality-b",
    content: {
      en: {
        textOnly: {
          passage: "Sana read the science article twice and underlined the three main causes of deforestation.",
          question: {
            prompt: "What did Sana underline in the article?",
            options: ["The three main causes of deforestation", "The title and author name", "The conclusion paragraph"],
            correct: "The three main causes of deforestation",
          },
        },
        audioSupported: {
          passage: "Yusuf listened to the podcast about space travel and then answered questions from memory.",
          question: {
            prompt: "What did Yusuf do after listening to the podcast?",
            options: ["He answered questions from memory", "He drew a diagram of a rocket", "He wrote a poem about space"],
            correct: "He answered questions from memory",
          },
        },
      },
      fr: {
        textOnly: {
          passage: "Sana a lu l'article scientifique deux fois et souligné les trois principales causes de la déforestation.",
          question: {
            prompt: "Qu'est-ce que Sana a souligné dans l'article ?",
            options: ["Les trois principales causes de la déforestation", "Le titre et le nom de l'auteur", "Le paragraphe de conclusion"],
            correct: "Les trois principales causes de la déforestation",
          },
        },
        audioSupported: {
          passage: "Yusuf a écouté le podcast sur les voyages spatiaux puis a répondu aux questions de mémoire.",
          question: {
            prompt: "Qu'a fait Yusuf après avoir écouté le podcast ?",
            options: ["Il a répondu aux questions de mémoire", "Il a dessiné un schéma de fusée", "Il a écrit un poème sur l'espace"],
            correct: "Il a répondu aux questions de mémoire",
          },
        },
      },
      ar: {
        textOnly: {
          passage: "قرأت سنا المقال العلمي مرتين وخطّت تحت الأسباب الرئيسية الثلاثة لإزالة الغابات.",
          question: {
            prompt: "ما الذي خطّت تحته سنا في المقال؟",
            options: ["الأسباب الرئيسية الثلاثة لإزالة الغابات", "العنوان واسم المؤلف", "فقرة الاستنتاج"],
            correct: "الأسباب الرئيسية الثلاثة لإزالة الغابات",
          },
        },
        audioSupported: {
          passage: "استمع يوسف إلى البودكاست حول السفر الفضائي ثم أجاب على الأسئلة من الذاكرة.",
          question: {
            prompt: "ماذا فعل يوسف بعد الاستماع إلى البودكاست؟",
            options: ["أجاب على الأسئلة من الذاكرة", "رسم مخططاً لصاروخ", "كتب قصيدة عن الفضاء"],
            correct: "أجاب على الأسئلة من الذاكرة",
          },
        },
      },
    },
  },
  {
    id: "modality-c",
    content: {
      en: {
        textOnly: {
          passage: "Dina read the instructions carefully and then sorted the materials into two groups before starting.",
          question: {
            prompt: "What did Dina do before starting the task?",
            options: ["Sorted the materials into two groups", "Asked the teacher for help", "Drew a table in her notebook"],
            correct: "Sorted the materials into two groups",
          },
        },
        audioSupported: {
          passage: "Nour listened to the teacher's explanation of fractions, then completed the worksheet without looking at notes.",
          question: {
            prompt: "What did Nour complete without looking at notes?",
            options: ["The worksheet", "The quiz", "The diagram"],
            correct: "The worksheet",
          },
        },
      },
      fr: {
        textOnly: {
          passage: "Dina a lu les instructions attentivement puis a trié les matériaux en deux groupes avant de commencer.",
          question: {
            prompt: "Qu'a fait Dina avant de commencer la tâche ?",
            options: ["Trié les matériaux en deux groupes", "Demandé de l'aide à l'enseignant", "Dessiné un tableau dans son cahier"],
            correct: "Trié les matériaux en deux groupes",
          },
        },
        audioSupported: {
          passage: "Nour a écouté l'explication de l'enseignant sur les fractions, puis a complété la fiche sans regarder ses notes.",
          question: {
            prompt: "Qu'est-ce que Nour a complété sans regarder ses notes ?",
            options: ["La fiche", "Le quiz", "Le schéma"],
            correct: "La fiche",
          },
        },
      },
      ar: {
        textOnly: {
          passage: "قرأت دينا التعليمات بعناية ثم صنّفت المواد إلى مجموعتين قبل البدء.",
          question: {
            prompt: "ماذا فعلت دينا قبل البدء بالمهمة؟",
            options: ["صنّفت المواد إلى مجموعتين", "طلبت المساعدة من المعلم", "رسمت جدولاً في دفترها"],
            correct: "صنّفت المواد إلى مجموعتين",
          },
        },
        audioSupported: {
          passage: "استمعت نور لشرح المعلم عن الكسور، ثم أكملت ورقة العمل دون النظر إلى الملاحظات.",
          question: {
            prompt: "ما الذي أكملته نور دون النظر إلى الملاحظات؟",
            options: ["ورقة العمل", "الاختبار", "المخطط"],
            correct: "ورقة العمل",
          },
        },
      },
    },
  },
];
