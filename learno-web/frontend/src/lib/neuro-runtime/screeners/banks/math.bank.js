/**
 * math.bank.js
 *
 * Item banks for the Math Check screener.
 * Each pool has 3 variants ensuring equivalent difficulty.
 *
 * Constraints:
 *  - VALUE_ITEMS_POOL: each set has exactly 4 comparison items
 *  - REPRESENTATION_ITEMS_POOL: each set has exactly 3 representation items
 *  - SEQUENCE_ITEMS_POOL: each set has exactly 3 sequence items
 *  - FLUENCY_ITEMS_POOL: each set has exactly 4 fluency items
 */

// ─── VALUE COMPARISON ITEMS ──────────────────────────────────────────────────

export const VALUE_ITEMS_POOL = [
  {
    id: "values-a",
    content: {
      en: {
        items: [
          {
            id: "decimal-percent",
            prompt: "Which value is greater?",
            options: ["0.45", "45%", "They are equal"],
            correct: "They are equal",
            confusionType: "decimal-percent equivalence",
          },
          {
            id: "fraction-decimal",
            prompt: "Which value is greater?",
            options: ["3/5", "0.55", "They are equal"],
            correct: "3/5",
            confusionType: "fraction-decimal comparison",
          },
          {
            id: "integer-decimal",
            prompt: "Which value is greater?",
            options: ["7.2", "7.18", "They are equal"],
            correct: "7.2",
            confusionType: "place-value comparison",
          },
          {
            id: "percent-fraction",
            prompt: "Which value is greater?",
            options: ["62%", "5/8", "They are equal"],
            correct: "62%",
            confusionType: "percent-fraction comparison",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "decimal-percent",
            prompt: "Quelle valeur est la plus grande ?",
            options: ["0,45", "45 %", "Elles sont égales"],
            correct: "Elles sont égales",
            confusionType: "équivalence décimal-pourcentage",
          },
          {
            id: "fraction-decimal",
            prompt: "Quelle valeur est la plus grande ?",
            options: ["3/5", "0,55", "Elles sont égales"],
            correct: "3/5",
            confusionType: "comparaison fraction-décimal",
          },
          {
            id: "integer-decimal",
            prompt: "Quelle valeur est la plus grande ?",
            options: ["7,2", "7,18", "Elles sont égales"],
            correct: "7,2",
            confusionType: "comparaison de valeur positionnelle",
          },
          {
            id: "percent-fraction",
            prompt: "Quelle valeur est la plus grande ?",
            options: ["62 %", "5/8", "Elles sont égales"],
            correct: "62 %",
            confusionType: "comparaison pourcentage-fraction",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "decimal-percent",
            prompt: "أيّ قيمة أكبر؟",
            options: ["0.45", "45%", "هما متساويتان"],
            correct: "هما متساويتان",
            confusionType: "تكافؤ عشري-نسبة مئوية",
          },
          {
            id: "fraction-decimal",
            prompt: "أيّ قيمة أكبر؟",
            options: ["3/5", "0.55", "هما متساويتان"],
            correct: "3/5",
            confusionType: "مقارنة كسر-عشري",
          },
          {
            id: "integer-decimal",
            prompt: "أيّ قيمة أكبر؟",
            options: ["7.2", "7.18", "هما متساويتان"],
            correct: "7.2",
            confusionType: "مقارنة قيمة موضعية",
          },
          {
            id: "percent-fraction",
            prompt: "أيّ قيمة أكبر؟",
            options: ["62%", "5/8", "هما متساويتان"],
            correct: "62%",
            confusionType: "مقارنة نسبة مئوية-كسر",
          },
        ],
      },
    },
  },
  {
    id: "values-b",
    content: {
      en: {
        items: [
          {
            id: "fraction-percent-b",
            prompt: "Which value is greater?",
            options: ["1/4", "25%", "They are equal"],
            correct: "They are equal",
            confusionType: "fraction-percent equivalence",
          },
          {
            id: "decimal-fraction-b",
            prompt: "Which value is greater?",
            options: ["0.7", "2/3", "They are equal"],
            correct: "0.7",
            confusionType: "decimal-fraction comparison",
          },
          {
            id: "place-value-b",
            prompt: "Which value is greater?",
            options: ["3.05", "3.5", "They are equal"],
            correct: "3.5",
            confusionType: "place-value comparison",
          },
          {
            id: "percent-decimal-b",
            prompt: "Which value is greater?",
            options: ["80%", "0.85", "They are equal"],
            correct: "0.85",
            confusionType: "percent-decimal comparison",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "fraction-percent-b",
            prompt: "Quelle valeur est la plus grande ?",
            options: ["1/4", "25 %", "Elles sont égales"],
            correct: "Elles sont égales",
            confusionType: "équivalence fraction-pourcentage",
          },
          {
            id: "decimal-fraction-b",
            prompt: "Quelle valeur est la plus grande ?",
            options: ["0,7", "2/3", "Elles sont égales"],
            correct: "0,7",
            confusionType: "comparaison décimal-fraction",
          },
          {
            id: "place-value-b",
            prompt: "Quelle valeur est la plus grande ?",
            options: ["3,05", "3,5", "Elles sont égales"],
            correct: "3,5",
            confusionType: "comparaison de valeur positionnelle",
          },
          {
            id: "percent-decimal-b",
            prompt: "Quelle valeur est la plus grande ?",
            options: ["80 %", "0,85", "Elles sont égales"],
            correct: "0,85",
            confusionType: "comparaison pourcentage-décimal",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "fraction-percent-b",
            prompt: "أيّ قيمة أكبر؟",
            options: ["1/4", "25%", "هما متساويتان"],
            correct: "هما متساويتان",
            confusionType: "تكافؤ كسر-نسبة مئوية",
          },
          {
            id: "decimal-fraction-b",
            prompt: "أيّ قيمة أكبر؟",
            options: ["0.7", "2/3", "هما متساويتان"],
            correct: "0.7",
            confusionType: "مقارنة عشري-كسر",
          },
          {
            id: "place-value-b",
            prompt: "أيّ قيمة أكبر؟",
            options: ["3.05", "3.5", "هما متساويتان"],
            correct: "3.5",
            confusionType: "مقارنة قيمة موضعية",
          },
          {
            id: "percent-decimal-b",
            prompt: "أيّ قيمة أكبر؟",
            options: ["80%", "0.85", "هما متساويتان"],
            correct: "0.85",
            confusionType: "مقارنة نسبة مئوية-عشري",
          },
        ],
      },
    },
  },
  {
    id: "values-c",
    content: {
      en: {
        items: [
          {
            id: "mixed-equiv-c",
            prompt: "Which value is greater?",
            options: ["0.5", "50%", "They are equal"],
            correct: "They are equal",
            confusionType: "decimal-percent equivalence",
          },
          {
            id: "fraction-decimal-c",
            prompt: "Which value is greater?",
            options: ["4/5", "0.75", "They are equal"],
            correct: "4/5",
            confusionType: "fraction-decimal comparison",
          },
          {
            id: "place-value-c",
            prompt: "Which value is greater?",
            options: ["12.09", "12.9", "They are equal"],
            correct: "12.9",
            confusionType: "place-value comparison",
          },
          {
            id: "percent-fraction-c",
            prompt: "Which value is greater?",
            options: ["30%", "1/3", "They are equal"],
            correct: "1/3",
            confusionType: "percent-fraction comparison",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "mixed-equiv-c",
            prompt: "Quelle valeur est la plus grande ?",
            options: ["0,5", "50 %", "Elles sont égales"],
            correct: "Elles sont égales",
            confusionType: "équivalence décimal-pourcentage",
          },
          {
            id: "fraction-decimal-c",
            prompt: "Quelle valeur est la plus grande ?",
            options: ["4/5", "0,75", "Elles sont égales"],
            correct: "4/5",
            confusionType: "comparaison fraction-décimal",
          },
          {
            id: "place-value-c",
            prompt: "Quelle valeur est la plus grande ?",
            options: ["12,09", "12,9", "Elles sont égales"],
            correct: "12,9",
            confusionType: "comparaison de valeur positionnelle",
          },
          {
            id: "percent-fraction-c",
            prompt: "Quelle valeur est la plus grande ?",
            options: ["30 %", "1/3", "Elles sont égales"],
            correct: "1/3",
            confusionType: "comparaison pourcentage-fraction",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "mixed-equiv-c",
            prompt: "أيّ قيمة أكبر؟",
            options: ["0.5", "50%", "هما متساويتان"],
            correct: "هما متساويتان",
            confusionType: "تكافؤ عشري-نسبة مئوية",
          },
          {
            id: "fraction-decimal-c",
            prompt: "أيّ قيمة أكبر؟",
            options: ["4/5", "0.75", "هما متساويتان"],
            correct: "4/5",
            confusionType: "مقارنة كسر-عشري",
          },
          {
            id: "place-value-c",
            prompt: "أيّ قيمة أكبر؟",
            options: ["12.09", "12.9", "هما متساويتان"],
            correct: "12.9",
            confusionType: "مقارنة قيمة موضعية",
          },
          {
            id: "percent-fraction-c",
            prompt: "أيّ قيمة أكبر؟",
            options: ["30%", "1/3", "هما متساويتان"],
            correct: "1/3",
            confusionType: "مقارنة نسبة مئوية-كسر",
          },
        ],
      },
    },
  },
];

// ─── REPRESENTATION ITEMS ────────────────────────────────────────────────────

export const REPRESENTATION_ITEMS_POOL = [
  {
    id: "representation-a",
    content: {
      en: {
        items: [
          {
            id: "bar-model",
            prompt: "Which value matches the shaded bar?",
            visual: `<div class="bar-visual"><span style="width:75%"></span></div>`,
            options: ["0.25", "0.75", "1.25"],
            correct: "0.75",
            errorType: "visual fraction mapping",
          },
          {
            id: "ratio-table",
            prompt: "Which ratio matches this table? 4 pencils for every 6 markers.",
            visual: `<div class="table-visual"><strong>4 : 6</strong></div>`,
            options: ["2 : 3", "4 : 10", "3 : 4"],
            correct: "2 : 3",
            errorType: "ratio simplification",
          },
          {
            id: "dot-array",
            prompt: "Which percentage matches 8 shaded dots out of 10?",
            visual: `<div class="dots-visual"><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot"></span><span class="dot"></span></div>`,
            options: ["60%", "70%", "80%"],
            correct: "80%",
            errorType: "symbol-quantity mapping",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "bar-model",
            prompt: "Quelle valeur correspond à la barre ombrée ?",
            visual: `<div class="bar-visual"><span style="width:75%"></span></div>`,
            options: ["0,25", "0,75", "1,25"],
            correct: "0,75",
            errorType: "mappage de fraction visuelle",
          },
          {
            id: "ratio-table",
            prompt: "Quel rapport correspond à ce tableau ? 4 crayons pour 6 marqueurs.",
            visual: `<div class="table-visual"><strong>4 : 6</strong></div>`,
            options: ["2 : 3", "4 : 10", "3 : 4"],
            correct: "2 : 3",
            errorType: "simplification de rapport",
          },
          {
            id: "dot-array",
            prompt: "Quel pourcentage correspond à 8 points ombrés sur 10 ?",
            visual: `<div class="dots-visual"><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot"></span><span class="dot"></span></div>`,
            options: ["60 %", "70 %", "80 %"],
            correct: "80 %",
            errorType: "mappage symbole-quantité",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "bar-model",
            prompt: "أيّ قيمة تطابق الشريط المظلل؟",
            visual: `<div class="bar-visual"><span style="width:75%"></span></div>`,
            options: ["0.25", "0.75", "1.25"],
            correct: "0.75",
            errorType: "رسم خرائط الكسر البصري",
          },
          {
            id: "ratio-table",
            prompt: "أيّ نسبة تطابق هذا الجدول؟ 4 أقلام لكل 6 أقلام تخطيط.",
            visual: `<div class="table-visual"><strong>4 : 6</strong></div>`,
            options: ["2 : 3", "4 : 10", "3 : 4"],
            correct: "2 : 3",
            errorType: "تبسيط النسبة",
          },
          {
            id: "dot-array",
            prompt: "أيّ نسبة مئوية تطابق 8 نقاط مظللة من أصل 10؟",
            visual: `<div class="dots-visual"><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot"></span><span class="dot"></span></div>`,
            options: ["60%", "70%", "80%"],
            correct: "80%",
            errorType: "رسم خرائط رمز-كمية",
          },
        ],
      },
    },
  },
  {
    id: "representation-b",
    content: {
      en: {
        items: [
          {
            id: "bar-model-b",
            prompt: "Which value matches the shaded bar?",
            visual: `<div class="bar-visual"><span style="width:40%"></span></div>`,
            options: ["0.40", "0.60", "0.14"],
            correct: "0.40",
            errorType: "visual fraction mapping",
          },
          {
            id: "ratio-table-b",
            prompt: "Which ratio matches this table? 6 apples for every 9 oranges.",
            visual: `<div class="table-visual"><strong>6 : 9</strong></div>`,
            options: ["3 : 4", "2 : 3", "6 : 3"],
            correct: "2 : 3",
            errorType: "ratio simplification",
          },
          {
            id: "dot-array-b",
            prompt: "Which percentage matches 3 shaded dots out of 10?",
            visual: `<div class="dots-visual"><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`,
            options: ["13%", "30%", "3%"],
            correct: "30%",
            errorType: "symbol-quantity mapping",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "bar-model-b",
            prompt: "Quelle valeur correspond à la barre ombrée ?",
            visual: `<div class="bar-visual"><span style="width:40%"></span></div>`,
            options: ["0,40", "0,60", "0,14"],
            correct: "0,40",
            errorType: "mappage de fraction visuelle",
          },
          {
            id: "ratio-table-b",
            prompt: "Quel rapport correspond à ce tableau ? 6 pommes pour 9 oranges.",
            visual: `<div class="table-visual"><strong>6 : 9</strong></div>`,
            options: ["3 : 4", "2 : 3", "6 : 3"],
            correct: "2 : 3",
            errorType: "simplification de rapport",
          },
          {
            id: "dot-array-b",
            prompt: "Quel pourcentage correspond à 3 points ombrés sur 10 ?",
            visual: `<div class="dots-visual"><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`,
            options: ["13 %", "30 %", "3 %"],
            correct: "30 %",
            errorType: "mappage symbole-quantité",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "bar-model-b",
            prompt: "أيّ قيمة تطابق الشريط المظلل؟",
            visual: `<div class="bar-visual"><span style="width:40%"></span></div>`,
            options: ["0.40", "0.60", "0.14"],
            correct: "0.40",
            errorType: "رسم خرائط الكسر البصري",
          },
          {
            id: "ratio-table-b",
            prompt: "أيّ نسبة تطابق هذا الجدول؟ 6 تفاحات لكل 9 برتقالات.",
            visual: `<div class="table-visual"><strong>6 : 9</strong></div>`,
            options: ["3 : 4", "2 : 3", "6 : 3"],
            correct: "2 : 3",
            errorType: "تبسيط النسبة",
          },
          {
            id: "dot-array-b",
            prompt: "أيّ نسبة مئوية تطابق 3 نقاط مظللة من أصل 10؟",
            visual: `<div class="dots-visual"><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`,
            options: ["13%", "30%", "3%"],
            correct: "30%",
            errorType: "رسم خرائط رمز-كمية",
          },
        ],
      },
    },
  },
  {
    id: "representation-c",
    content: {
      en: {
        items: [
          {
            id: "bar-model-c",
            prompt: "Which value matches the shaded bar?",
            visual: `<div class="bar-visual"><span style="width:60%"></span></div>`,
            options: ["0.16", "0.60", "0.06"],
            correct: "0.60",
            errorType: "visual fraction mapping",
          },
          {
            id: "ratio-table-c",
            prompt: "Which ratio matches this table? 10 chairs for every 4 tables.",
            visual: `<div class="table-visual"><strong>10 : 4</strong></div>`,
            options: ["5 : 2", "4 : 10", "10 : 2"],
            correct: "5 : 2",
            errorType: "ratio simplification",
          },
          {
            id: "dot-array-c",
            prompt: "Which percentage matches 6 shaded dots out of 10?",
            visual: `<div class="dots-visual"><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`,
            options: ["16%", "60%", "66%"],
            correct: "60%",
            errorType: "symbol-quantity mapping",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "bar-model-c",
            prompt: "Quelle valeur correspond à la barre ombrée ?",
            visual: `<div class="bar-visual"><span style="width:60%"></span></div>`,
            options: ["0,16", "0,60", "0,06"],
            correct: "0,60",
            errorType: "mappage de fraction visuelle",
          },
          {
            id: "ratio-table-c",
            prompt: "Quel rapport correspond à ce tableau ? 10 chaises pour 4 tables.",
            visual: `<div class="table-visual"><strong>10 : 4</strong></div>`,
            options: ["5 : 2", "4 : 10", "10 : 2"],
            correct: "5 : 2",
            errorType: "simplification de rapport",
          },
          {
            id: "dot-array-c",
            prompt: "Quel pourcentage correspond à 6 points ombrés sur 10 ?",
            visual: `<div class="dots-visual"><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`,
            options: ["16 %", "60 %", "66 %"],
            correct: "60 %",
            errorType: "mappage symbole-quantité",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "bar-model-c",
            prompt: "أيّ قيمة تطابق الشريط المظلل؟",
            visual: `<div class="bar-visual"><span style="width:60%"></span></div>`,
            options: ["0.16", "0.60", "0.06"],
            correct: "0.60",
            errorType: "رسم خرائط الكسر البصري",
          },
          {
            id: "ratio-table-c",
            prompt: "أيّ نسبة تطابق هذا الجدول؟ 10 كراسٍ لكل 4 طاولات.",
            visual: `<div class="table-visual"><strong>10 : 4</strong></div>`,
            options: ["5 : 2", "4 : 10", "10 : 2"],
            correct: "5 : 2",
            errorType: "تبسيط النسبة",
          },
          {
            id: "dot-array-c",
            prompt: "أيّ نسبة مئوية تطابق 6 نقاط مظللة من أصل 10؟",
            visual: `<div class="dots-visual"><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot filled"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`,
            options: ["16%", "60%", "66%"],
            correct: "60%",
            errorType: "رسم خرائط رمز-كمية",
          },
        ],
      },
    },
  },
];

// ─── SEQUENCE ITEMS ───────────────────────────────────────────────────────────

export const SEQUENCE_ITEMS_POOL = [
  {
    id: "sequences-a",
    content: {
      en: {
        items: [
          {
            id: "times-two-plus-one",
            prompt: "What comes next? 3, 7, 15, 31, ...",
            options: ["47", "63", "62"],
            correct: "63",
            errorType: "growth rule",
          },
          {
            id: "alternating-step",
            prompt: "What comes next? 14, 11, 13, 10, 12, ...",
            options: ["9", "11", "8"],
            correct: "9",
            errorType: "alternating pattern",
          },
          {
            id: "square-pattern",
            prompt: "Find the missing value: 1, 4, 9, 16, __",
            options: ["20", "25", "24"],
            correct: "25",
            errorType: "square sequence",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "times-two-plus-one",
            prompt: "Quel est le suivant ? 3, 7, 15, 31, ...",
            options: ["47", "63", "62"],
            correct: "63",
            errorType: "règle de croissance",
          },
          {
            id: "alternating-step",
            prompt: "Quel est le suivant ? 14, 11, 13, 10, 12, ...",
            options: ["9", "11", "8"],
            correct: "9",
            errorType: "modèle alterné",
          },
          {
            id: "square-pattern",
            prompt: "Trouvez la valeur manquante : 1, 4, 9, 16, __",
            options: ["20", "25", "24"],
            correct: "25",
            errorType: "suite de carrés",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "times-two-plus-one",
            prompt: "ما التالي؟ 3، 7، 15، 31، ...",
            options: ["47", "63", "62"],
            correct: "63",
            errorType: "قاعدة النمو",
          },
          {
            id: "alternating-step",
            prompt: "ما التالي؟ 14، 11، 13، 10، 12، ...",
            options: ["9", "11", "8"],
            correct: "9",
            errorType: "نمط متناوب",
          },
          {
            id: "square-pattern",
            prompt: "أوجد القيمة المفقودة: 1، 4، 9، 16، __",
            options: ["20", "25", "24"],
            correct: "25",
            errorType: "متتالية مربعات",
          },
        ],
      },
    },
  },
  {
    id: "sequences-b",
    content: {
      en: {
        items: [
          {
            id: "double-minus-one",
            prompt: "What comes next? 2, 3, 5, 9, 17, ...",
            options: ["25", "33", "34"],
            correct: "33",
            errorType: "growth rule",
          },
          {
            id: "skip-count-b",
            prompt: "What comes next? 5, 10, 20, 35, 55, ...",
            options: ["75", "80", "70"],
            correct: "80",
            errorType: "increasing skip",
          },
          {
            id: "cube-pattern",
            prompt: "Find the missing value: 1, 8, 27, 64, __",
            options: ["100", "125", "108"],
            correct: "125",
            errorType: "cube sequence",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "double-minus-one",
            prompt: "Quel est le suivant ? 2, 3, 5, 9, 17, ...",
            options: ["25", "33", "34"],
            correct: "33",
            errorType: "règle de croissance",
          },
          {
            id: "skip-count-b",
            prompt: "Quel est le suivant ? 5, 10, 20, 35, 55, ...",
            options: ["75", "80", "70"],
            correct: "80",
            errorType: "saut croissant",
          },
          {
            id: "cube-pattern",
            prompt: "Trouvez la valeur manquante : 1, 8, 27, 64, __",
            options: ["100", "125", "108"],
            correct: "125",
            errorType: "suite de cubes",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "double-minus-one",
            prompt: "ما التالي؟ 2، 3، 5، 9، 17، ...",
            options: ["25", "33", "34"],
            correct: "33",
            errorType: "قاعدة النمو",
          },
          {
            id: "skip-count-b",
            prompt: "ما التالي؟ 5، 10، 20، 35، 55، ...",
            options: ["75", "80", "70"],
            correct: "80",
            errorType: "تخطٍّ متزايد",
          },
          {
            id: "cube-pattern",
            prompt: "أوجد القيمة المفقودة: 1، 8، 27، 64، __",
            options: ["100", "125", "108"],
            correct: "125",
            errorType: "متتالية مكعبات",
          },
        ],
      },
    },
  },
  {
    id: "sequences-c",
    content: {
      en: {
        items: [
          {
            id: "add-five-c",
            prompt: "What comes next? 4, 9, 16, 25, 36, ...",
            options: ["42", "49", "46"],
            correct: "49",
            errorType: "square sequence",
          },
          {
            id: "subtract-pattern-c",
            prompt: "What comes next? 100, 91, 83, 76, 70, ...",
            options: ["65", "63", "64"],
            correct: "65",
            errorType: "decreasing pattern",
          },
          {
            id: "fibonacci-c",
            prompt: "Find the missing value: 1, 1, 2, 3, 5, 8, __",
            options: ["11", "12", "13"],
            correct: "13",
            errorType: "additive sequence",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "add-five-c",
            prompt: "Quel est le suivant ? 4, 9, 16, 25, 36, ...",
            options: ["42", "49", "46"],
            correct: "49",
            errorType: "suite de carrés",
          },
          {
            id: "subtract-pattern-c",
            prompt: "Quel est le suivant ? 100, 91, 83, 76, 70, ...",
            options: ["65", "63", "64"],
            correct: "65",
            errorType: "modèle décroissant",
          },
          {
            id: "fibonacci-c",
            prompt: "Trouvez la valeur manquante : 1, 1, 2, 3, 5, 8, __",
            options: ["11", "12", "13"],
            correct: "13",
            errorType: "suite additive",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "add-five-c",
            prompt: "ما التالي؟ 4، 9، 16، 25، 36، ...",
            options: ["42", "49", "46"],
            correct: "49",
            errorType: "متتالية مربعات",
          },
          {
            id: "subtract-pattern-c",
            prompt: "ما التالي؟ 100، 91، 83، 76، 70، ...",
            options: ["65", "63", "64"],
            correct: "65",
            errorType: "نمط تنازلي",
          },
          {
            id: "fibonacci-c",
            prompt: "أوجد القيمة المفقودة: 1، 1، 2، 3، 5، 8، __",
            options: ["11", "12", "13"],
            correct: "13",
            errorType: "متتالية جمعية",
          },
        ],
      },
    },
  },
];

// ─── FLUENCY ITEMS ────────────────────────────────────────────────────────────

export const FLUENCY_ITEMS_POOL = [
  {
    id: "fluency-a",
    content: {
      en: {
        items: [
          {
            id: "proportion",
            prompt: "If 3 notebooks cost 12 dinars, how much do 5 notebooks cost?",
            options: ["15", "18", "20"],
            correct: "20",
          },
          {
            id: "substitution",
            prompt: "If x = 4, what is 3x + 2?",
            options: ["10", "14", "16"],
            correct: "14",
          },
          {
            id: "fraction-sum",
            prompt: "What is 1/2 + 1/4?",
            options: ["3/4", "2/6", "1/6"],
            correct: "3/4",
          },
          {
            id: "percentage",
            prompt: "What is 25% of 80?",
            options: ["15", "20", "25"],
            correct: "20",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "proportion",
            prompt: "Si 3 cahiers coûtent 12 dinars, combien coûtent 5 cahiers ?",
            options: ["15", "18", "20"],
            correct: "20",
          },
          {
            id: "substitution",
            prompt: "Si x = 4, quelle est la valeur de 3x + 2 ?",
            options: ["10", "14", "16"],
            correct: "14",
          },
          {
            id: "fraction-sum",
            prompt: "Combien fait 1/2 + 1/4 ?",
            options: ["3/4", "2/6", "1/6"],
            correct: "3/4",
          },
          {
            id: "percentage",
            prompt: "Combien fait 25 % de 80 ?",
            options: ["15", "20", "25"],
            correct: "20",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "proportion",
            prompt: "إذا كانت 3 دفاتر تكلف 12 ديناراً، فكم تكلف 5 دفاتر؟",
            options: ["15", "18", "20"],
            correct: "20",
          },
          {
            id: "substitution",
            prompt: "إذا كان x = 4، فما قيمة 3x + 2؟",
            options: ["10", "14", "16"],
            correct: "14",
          },
          {
            id: "fraction-sum",
            prompt: "ما ناتج 1/2 + 1/4؟",
            options: ["3/4", "2/6", "1/6"],
            correct: "3/4",
          },
          {
            id: "percentage",
            prompt: "ما هو 25% من 80؟",
            options: ["15", "20", "25"],
            correct: "20",
          },
        ],
      },
    },
  },
  {
    id: "fluency-b",
    content: {
      en: {
        items: [
          {
            id: "ratio-b",
            prompt: "A recipe uses 2 cups of flour for 12 cookies. How many cups for 30 cookies?",
            options: ["4", "5", "6"],
            correct: "5",
          },
          {
            id: "substitution-b",
            prompt: "If y = 3, what is 4y - 1?",
            options: ["11", "12", "13"],
            correct: "11",
          },
          {
            id: "fraction-diff",
            prompt: "What is 3/4 - 1/2?",
            options: ["1/4", "2/4", "1/8"],
            correct: "1/4",
          },
          {
            id: "percentage-b",
            prompt: "What is 10% of 150?",
            options: ["10", "15", "20"],
            correct: "15",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "ratio-b",
            prompt: "Une recette utilise 2 tasses de farine pour 12 biscuits. Combien de tasses pour 30 biscuits ?",
            options: ["4", "5", "6"],
            correct: "5",
          },
          {
            id: "substitution-b",
            prompt: "Si y = 3, quelle est la valeur de 4y - 1 ?",
            options: ["11", "12", "13"],
            correct: "11",
          },
          {
            id: "fraction-diff",
            prompt: "Combien fait 3/4 - 1/2 ?",
            options: ["1/4", "2/4", "1/8"],
            correct: "1/4",
          },
          {
            id: "percentage-b",
            prompt: "Combien fait 10 % de 150 ?",
            options: ["10", "15", "20"],
            correct: "15",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "ratio-b",
            prompt: "تستخدم وصفة 2 كوب دقيق لـ 12 كعكة. كم كوباً تحتاج لـ 30 كعكة؟",
            options: ["4", "5", "6"],
            correct: "5",
          },
          {
            id: "substitution-b",
            prompt: "إذا كان y = 3، فما قيمة 4y - 1؟",
            options: ["11", "12", "13"],
            correct: "11",
          },
          {
            id: "fraction-diff",
            prompt: "ما ناتج 3/4 - 1/2؟",
            options: ["1/4", "2/4", "1/8"],
            correct: "1/4",
          },
          {
            id: "percentage-b",
            prompt: "ما هو 10% من 150؟",
            options: ["10", "15", "20"],
            correct: "15",
          },
        ],
      },
    },
  },
  {
    id: "fluency-c",
    content: {
      en: {
        items: [
          {
            id: "proportion-c",
            prompt: "If 4 pens cost 8 dirhams, how much do 7 pens cost?",
            options: ["12", "14", "16"],
            correct: "14",
          },
          {
            id: "substitution-c",
            prompt: "If z = 5, what is 2z + 3?",
            options: ["11", "13", "15"],
            correct: "13",
          },
          {
            id: "fraction-sum-c",
            prompt: "What is 2/3 + 1/6?",
            options: ["3/9", "5/6", "3/6"],
            correct: "5/6",
          },
          {
            id: "percentage-c",
            prompt: "What is 50% of 46?",
            options: ["20", "23", "25"],
            correct: "23",
          },
        ],
      },
      fr: {
        items: [
          {
            id: "proportion-c",
            prompt: "Si 4 stylos coûtent 8 dirhams, combien coûtent 7 stylos ?",
            options: ["12", "14", "16"],
            correct: "14",
          },
          {
            id: "substitution-c",
            prompt: "Si z = 5, quelle est la valeur de 2z + 3 ?",
            options: ["11", "13", "15"],
            correct: "13",
          },
          {
            id: "fraction-sum-c",
            prompt: "Combien fait 2/3 + 1/6 ?",
            options: ["3/9", "5/6", "3/6"],
            correct: "5/6",
          },
          {
            id: "percentage-c",
            prompt: "Combien fait 50 % de 46 ?",
            options: ["20", "23", "25"],
            correct: "23",
          },
        ],
      },
      ar: {
        items: [
          {
            id: "proportion-c",
            prompt: "إذا كانت 4 أقلام تكلف 8 دراهم، فكم تكلف 7 أقلام؟",
            options: ["12", "14", "16"],
            correct: "14",
          },
          {
            id: "substitution-c",
            prompt: "إذا كان z = 5، فما قيمة 2z + 3؟",
            options: ["11", "13", "15"],
            correct: "13",
          },
          {
            id: "fraction-sum-c",
            prompt: "ما ناتج 2/3 + 1/6؟",
            options: ["3/9", "5/6", "3/6"],
            correct: "5/6",
          },
          {
            id: "percentage-c",
            prompt: "ما هو 50% من 46؟",
            options: ["20", "23", "25"],
            correct: "23",
          },
        ],
      },
    },
  },
];

// ─── EARLY LEVEL POOLS ────────────────────────────────────────────────────────

export const EARLY_VALUE_ITEMS_POOL = [
  {
    id: "early-values-a",
    content: {
      en: {
        items: [
          { id: "compare-1", prompt: "Which number is greater?", options: ["5", "8", "They are equal"], correct: "8", confusionType: "whole number comparison" },
          { id: "compare-2", prompt: "Which number is greater?", options: ["12", "9", "They are equal"], correct: "12", confusionType: "whole number comparison" },
          { id: "compare-3", prompt: "Which number is greater?", options: ["1/2", "1/4", "They are equal"], correct: "1/2", confusionType: "simple fraction comparison" },
          { id: "compare-4", prompt: "Which number is greater?", options: ["3", "3.0", "They are equal"], correct: "They are equal", confusionType: "integer-decimal equivalence" },
        ],
      },
      fr: {
        items: [
          { id: "compare-1", prompt: "Quel nombre est plus grand ?", options: ["5", "8", "Ils sont égaux"], correct: "8", confusionType: "comparaison de nombres entiers" },
          { id: "compare-2", prompt: "Quel nombre est plus grand ?", options: ["12", "9", "Ils sont égaux"], correct: "12", confusionType: "comparaison de nombres entiers" },
          { id: "compare-3", prompt: "Quel nombre est plus grand ?", options: ["1/2", "1/4", "Ils sont égaux"], correct: "1/2", confusionType: "comparaison de fractions simples" },
          { id: "compare-4", prompt: "Quel nombre est plus grand ?", options: ["3", "3.0", "Ils sont égaux"], correct: "Ils sont égaux", confusionType: "équivalence entier-décimal" },
        ],
      },
      ar: {
        items: [
          { id: "compare-1", prompt: "أي رقم أكبر؟", options: ["5", "8", "هما متساويان"], correct: "8", confusionType: "مقارنة أعداد صحيحة" },
          { id: "compare-2", prompt: "أي رقم أكبر؟", options: ["12", "9", "هما متساويان"], correct: "12", confusionType: "مقارنة أعداد صحيحة" },
          { id: "compare-3", prompt: "أي رقم أكبر؟", options: ["1/2", "1/4", "هما متساويان"], correct: "1/2", confusionType: "مقارنة كسور بسيطة" },
          { id: "compare-4", prompt: "أي رقم أكبر؟", options: ["3", "3.0", "هما متساويان"], correct: "هما متساويان", confusionType: "تكافؤ الصحيح والعشري" },
        ],
      },
    },
  },
  {
    id: "early-values-b",
    content: {
      en: {
        items: [
          { id: "compare-1", prompt: "Which number is greater?", options: ["7", "4", "They are equal"], correct: "7", confusionType: "whole number comparison" },
          { id: "compare-2", prompt: "Which number is greater?", options: ["20", "15", "They are equal"], correct: "20", confusionType: "whole number comparison" },
          { id: "compare-3", prompt: "Which number is greater?", options: ["1/3", "1/2", "They are equal"], correct: "1/2", confusionType: "simple fraction comparison" },
          { id: "compare-4", prompt: "Which number is greater?", options: ["5", "5.0", "They are equal"], correct: "They are equal", confusionType: "integer-decimal equivalence" },
        ],
      },
      fr: {
        items: [
          { id: "compare-1", prompt: "Quel nombre est plus grand ?", options: ["7", "4", "Ils sont égaux"], correct: "7", confusionType: "comparaison de nombres entiers" },
          { id: "compare-2", prompt: "Quel nombre est plus grand ?", options: ["20", "15", "Ils sont égaux"], correct: "20", confusionType: "comparaison de nombres entiers" },
          { id: "compare-3", prompt: "Quel nombre est plus grand ?", options: ["1/3", "1/2", "Ils sont égaux"], correct: "1/2", confusionType: "comparaison de fractions simples" },
          { id: "compare-4", prompt: "Quel nombre est plus grand ?", options: ["5", "5.0", "Ils sont égaux"], correct: "Ils sont égaux", confusionType: "équivalence entier-décimal" },
        ],
      },
      ar: {
        items: [
          { id: "compare-1", prompt: "أي رقم أكبر؟", options: ["7", "4", "هما متساويان"], correct: "7", confusionType: "مقارنة أعداد صحيحة" },
          { id: "compare-2", prompt: "أي رقم أكبر؟", options: ["20", "15", "هما متساويان"], correct: "20", confusionType: "مقارنة أعداد صحيحة" },
          { id: "compare-3", prompt: "أي رقم أكبر؟", options: ["1/3", "1/2", "هما متساويان"], correct: "1/2", confusionType: "مقارنة كسور بسيطة" },
          { id: "compare-4", prompt: "أي رقم أكبر؟", options: ["5", "5.0", "هما متساويان"], correct: "هما متساويان", confusionType: "تكافؤ الصحيح والعشري" },
        ],
      },
    },
  },
  {
    id: "early-values-c",
    content: {
      en: {
        items: [
          { id: "compare-1", prompt: "Which number is greater?", options: ["6", "10", "They are equal"], correct: "10", confusionType: "whole number comparison" },
          { id: "compare-2", prompt: "Which number is greater?", options: ["11", "18", "They are equal"], correct: "18", confusionType: "whole number comparison" },
          { id: "compare-3", prompt: "Which number is greater?", options: ["2/4", "1/2", "They are equal"], correct: "They are equal", confusionType: "equivalent fractions" },
          { id: "compare-4", prompt: "Which number is greater?", options: ["9", "9.0", "They are equal"], correct: "They are equal", confusionType: "integer-decimal equivalence" },
        ],
      },
      fr: {
        items: [
          { id: "compare-1", prompt: "Quel nombre est plus grand ?", options: ["6", "10", "Ils sont égaux"], correct: "10", confusionType: "comparaison de nombres entiers" },
          { id: "compare-2", prompt: "Quel nombre est plus grand ?", options: ["11", "18", "Ils sont égaux"], correct: "18", confusionType: "comparaison de nombres entiers" },
          { id: "compare-3", prompt: "Quel nombre est plus grand ?", options: ["2/4", "1/2", "Ils sont égaux"], correct: "Ils sont égaux", confusionType: "fractions équivalentes" },
          { id: "compare-4", prompt: "Quel nombre est plus grand ?", options: ["9", "9.0", "Ils sont égaux"], correct: "Ils sont égaux", confusionType: "équivalence entier-décimal" },
        ],
      },
      ar: {
        items: [
          { id: "compare-1", prompt: "أي رقم أكبر؟", options: ["6", "10", "هما متساويان"], correct: "10", confusionType: "مقارنة أعداد صحيحة" },
          { id: "compare-2", prompt: "أي رقم أكبر؟", options: ["11", "18", "هما متساويان"], correct: "18", confusionType: "مقارنة أعداد صحيحة" },
          { id: "compare-3", prompt: "أي رقم أكبر؟", options: ["2/4", "1/2", "هما متساويان"], correct: "هما متساويان", confusionType: "كسور مكافئة" },
          { id: "compare-4", prompt: "أي رقم أكبر؟", options: ["9", "9.0", "هما متساويان"], correct: "هما متساويان", confusionType: "تكافؤ الصحيح والعشري" },
        ],
      },
    },
  },
];

export const EARLY_REPRESENTATION_ITEMS_POOL = [
  {
    id: "early-rep-a",
    content: {
      en: {
        items: [
          { id: "bar-model-1", prompt: "A bar shows 3 filled parts out of 5. What fraction is filled?", options: ["3/5", "2/5", "5/3"], correct: "3/5", representationType: "bar model" },
          { id: "count-array-1", prompt: "An array shows 2 rows of 4 dots. How many dots total?", options: ["6", "8", "10"], correct: "8", representationType: "counting array" },
          { id: "bar-model-2", prompt: "A bar shows 4 equal parts, 2 are shaded. What fraction is shaded?", options: ["1/4", "1/2", "2/4 and 1/2 are both correct"], correct: "2/4 and 1/2 are both correct", representationType: "equivalent fractions" },
        ],
      },
      fr: {
        items: [
          { id: "bar-model-1", prompt: "Une barre montre 3 parties remplies sur 5. Quelle fraction est remplie ?", options: ["3/5", "2/5", "5/3"], correct: "3/5", representationType: "modèle en barre" },
          { id: "count-array-1", prompt: "Un tableau montre 2 rangées de 4 points. Combien de points au total ?", options: ["6", "8", "10"], correct: "8", representationType: "réseau de comptage" },
          { id: "bar-model-2", prompt: "Une barre montre 4 parties égales, 2 sont ombrées. Quelle fraction est ombrée ?", options: ["1/4", "1/2", "2/4 et 1/2 sont toutes les deux correctes"], correct: "2/4 et 1/2 sont toutes les deux correctes", representationType: "fractions équivalentes" },
        ],
      },
      ar: {
        items: [
          { id: "bar-model-1", prompt: "يُظهر شريط 3 أجزاء مملوءة من أصل 5. ما الكسر الممثَّل؟", options: ["3/5", "2/5", "5/3"], correct: "3/5", representationType: "نموذج الشريط" },
          { id: "count-array-1", prompt: "يُظهر مصفوفة صفّين من 4 نقاط. كم عدد النقاط الإجمالي؟", options: ["6", "8", "10"], correct: "8", representationType: "مصفوفة العد" },
          { id: "bar-model-2", prompt: "يُظهر شريط 4 أجزاء متساوية، 2 منها مظللة. ما الكسر المظلل؟", options: ["1/4", "1/2", "2/4 و 1/2 كلاهما صحيح"], correct: "2/4 و 1/2 كلاهما صحيح", representationType: "كسور مكافئة" },
        ],
      },
    },
  },
  {
    id: "early-rep-b",
    content: {
      en: {
        items: [
          { id: "bar-model-1", prompt: "A bar shows 1 filled part out of 4. What fraction is filled?", options: ["1/4", "3/4", "4/1"], correct: "1/4", representationType: "bar model" },
          { id: "count-array-1", prompt: "An array shows 3 rows of 3 dots. How many dots total?", options: ["6", "9", "12"], correct: "9", representationType: "counting array" },
          { id: "bar-model-2", prompt: "A bar shows 6 equal parts, 3 are shaded. What fraction is shaded?", options: ["1/3", "1/2", "3/4"], correct: "1/2", representationType: "equivalent fractions" },
        ],
      },
      fr: {
        items: [
          { id: "bar-model-1", prompt: "Une barre montre 1 partie remplie sur 4. Quelle fraction est remplie ?", options: ["1/4", "3/4", "4/1"], correct: "1/4", representationType: "modèle en barre" },
          { id: "count-array-1", prompt: "Un tableau montre 3 rangées de 3 points. Combien de points au total ?", options: ["6", "9", "12"], correct: "9", representationType: "réseau de comptage" },
          { id: "bar-model-2", prompt: "Une barre montre 6 parties égales, 3 sont ombrées. Quelle fraction est ombrée ?", options: ["1/3", "1/2", "3/4"], correct: "1/2", representationType: "fractions équivalentes" },
        ],
      },
      ar: {
        items: [
          { id: "bar-model-1", prompt: "يُظهر شريط جزءاً واحداً مملوءاً من أصل 4. ما الكسر الممثَّل؟", options: ["1/4", "3/4", "4/1"], correct: "1/4", representationType: "نموذج الشريط" },
          { id: "count-array-1", prompt: "تُظهر المصفوفة 3 صفوف من 3 نقاط. كم عدد النقاط الإجمالي؟", options: ["6", "9", "12"], correct: "9", representationType: "مصفوفة العد" },
          { id: "bar-model-2", prompt: "يُظهر شريط 6 أجزاء متساوية، 3 منها مظللة. ما الكسر المظلل؟", options: ["1/3", "1/2", "3/4"], correct: "1/2", representationType: "كسور مكافئة" },
        ],
      },
    },
  },
  {
    id: "early-rep-c",
    content: {
      en: {
        items: [
          { id: "bar-model-1", prompt: "A bar shows 2 filled parts out of 6. What fraction is filled?", options: ["1/3", "2/6", "Both 1/3 and 2/6 are correct"], correct: "Both 1/3 and 2/6 are correct", representationType: "equivalent fractions" },
          { id: "count-array-1", prompt: "An array shows 4 rows of 2 dots. How many dots total?", options: ["6", "8", "10"], correct: "8", representationType: "counting array" },
          { id: "bar-model-2", prompt: "A bar shows 8 equal parts, 4 are shaded. What fraction is shaded?", options: ["4/8", "1/2", "Both are correct"], correct: "Both are correct", representationType: "equivalent fractions" },
        ],
      },
      fr: {
        items: [
          { id: "bar-model-1", prompt: "Une barre montre 2 parties remplies sur 6. Quelle fraction est remplie ?", options: ["1/3", "2/6", "1/3 et 2/6 sont toutes les deux correctes"], correct: "1/3 et 2/6 sont toutes les deux correctes", representationType: "fractions équivalentes" },
          { id: "count-array-1", prompt: "Un tableau montre 4 rangées de 2 points. Combien de points au total ?", options: ["6", "8", "10"], correct: "8", representationType: "réseau de comptage" },
          { id: "bar-model-2", prompt: "Une barre montre 8 parties égales, 4 sont ombrées. Quelle fraction est ombrée ?", options: ["4/8", "1/2", "Les deux sont correctes"], correct: "Les deux sont correctes", representationType: "fractions équivalentes" },
        ],
      },
      ar: {
        items: [
          { id: "bar-model-1", prompt: "يُظهر شريط جزأين مملوءين من أصل 6. ما الكسر الممثَّل؟", options: ["1/3", "2/6", "كلاهما صحيح"], correct: "كلاهما صحيح", representationType: "كسور مكافئة" },
          { id: "count-array-1", prompt: "تُظهر المصفوفة 4 صفوف من 2 نقطة. كم عدد النقاط الإجمالي؟", options: ["6", "8", "10"], correct: "8", representationType: "مصفوفة العد" },
          { id: "bar-model-2", prompt: "يُظهر شريط 8 أجزاء متساوية، 4 منها مظللة. ما الكسر المظلل؟", options: ["4/8", "1/2", "كلاهما صحيح"], correct: "كلاهما صحيح", representationType: "كسور مكافئة" },
        ],
      },
    },
  },
];

export const EARLY_SEQUENCE_ITEMS_POOL = [
  {
    id: "early-seq-a",
    content: {
      en: {
        items: [
          { id: "skip-2", prompt: "What comes next? 2, 4, 6, 8, ___", options: ["9", "10", "12"], correct: "10", patternType: "skip counting by 2" },
          { id: "skip-5", prompt: "What comes next? 5, 10, 15, 20, ___", options: ["22", "25", "30"], correct: "25", patternType: "skip counting by 5" },
          { id: "skip-10", prompt: "What comes next? 10, 20, 30, 40, ___", options: ["45", "50", "60"], correct: "50", patternType: "skip counting by 10" },
        ],
      },
      fr: {
        items: [
          { id: "skip-2", prompt: "Qu'est-ce qui vient ensuite ? 2, 4, 6, 8, ___", options: ["9", "10", "12"], correct: "10", patternType: "compter de 2 en 2" },
          { id: "skip-5", prompt: "Qu'est-ce qui vient ensuite ? 5, 10, 15, 20, ___", options: ["22", "25", "30"], correct: "25", patternType: "compter de 5 en 5" },
          { id: "skip-10", prompt: "Qu'est-ce qui vient ensuite ? 10, 20, 30, 40, ___", options: ["45", "50", "60"], correct: "50", patternType: "compter de 10 en 10" },
        ],
      },
      ar: {
        items: [
          { id: "skip-2", prompt: "ما الرقم التالي؟ 2، 4، 6، 8، ___", options: ["9", "10", "12"], correct: "10", patternType: "العد بمقدار 2" },
          { id: "skip-5", prompt: "ما الرقم التالي؟ 5، 10، 15، 20، ___", options: ["22", "25", "30"], correct: "25", patternType: "العد بمقدار 5" },
          { id: "skip-10", prompt: "ما الرقم التالي؟ 10، 20، 30، 40، ___", options: ["45", "50", "60"], correct: "50", patternType: "العد بمقدار 10" },
        ],
      },
    },
  },
  {
    id: "early-seq-b",
    content: {
      en: {
        items: [
          { id: "skip-3", prompt: "What comes next? 3, 6, 9, 12, ___", options: ["13", "15", "18"], correct: "15", patternType: "skip counting by 3" },
          { id: "skip-4", prompt: "What comes next? 4, 8, 12, 16, ___", options: ["18", "20", "24"], correct: "20", patternType: "skip counting by 4" },
          { id: "skip-2b", prompt: "What comes next? 12, 14, 16, 18, ___", options: ["19", "20", "22"], correct: "20", patternType: "skip counting by 2" },
        ],
      },
      fr: {
        items: [
          { id: "skip-3", prompt: "Qu'est-ce qui vient ensuite ? 3, 6, 9, 12, ___", options: ["13", "15", "18"], correct: "15", patternType: "compter de 3 en 3" },
          { id: "skip-4", prompt: "Qu'est-ce qui vient ensuite ? 4, 8, 12, 16, ___", options: ["18", "20", "24"], correct: "20", patternType: "compter de 4 en 4" },
          { id: "skip-2b", prompt: "Qu'est-ce qui vient ensuite ? 12, 14, 16, 18, ___", options: ["19", "20", "22"], correct: "20", patternType: "compter de 2 en 2" },
        ],
      },
      ar: {
        items: [
          { id: "skip-3", prompt: "ما الرقم التالي؟ 3، 6، 9، 12، ___", options: ["13", "15", "18"], correct: "15", patternType: "العد بمقدار 3" },
          { id: "skip-4", prompt: "ما الرقم التالي؟ 4، 8، 12، 16، ___", options: ["18", "20", "24"], correct: "20", patternType: "العد بمقدار 4" },
          { id: "skip-2b", prompt: "ما الرقم التالي؟ 12، 14، 16، 18، ___", options: ["19", "20", "22"], correct: "20", patternType: "العد بمقدار 2" },
        ],
      },
    },
  },
  {
    id: "early-seq-c",
    content: {
      en: {
        items: [
          { id: "skip-5b", prompt: "What comes next? 15, 20, 25, 30, ___", options: ["32", "35", "40"], correct: "35", patternType: "skip counting by 5" },
          { id: "skip-10b", prompt: "What comes next? 20, 30, 40, 50, ___", options: ["55", "60", "70"], correct: "60", patternType: "skip counting by 10" },
          { id: "skip-2c", prompt: "What comes next? 16, 18, 20, 22, ___", options: ["23", "24", "26"], correct: "24", patternType: "skip counting by 2" },
        ],
      },
      fr: {
        items: [
          { id: "skip-5b", prompt: "Qu'est-ce qui vient ensuite ? 15, 20, 25, 30, ___", options: ["32", "35", "40"], correct: "35", patternType: "compter de 5 en 5" },
          { id: "skip-10b", prompt: "Qu'est-ce qui vient ensuite ? 20, 30, 40, 50, ___", options: ["55", "60", "70"], correct: "60", patternType: "compter de 10 en 10" },
          { id: "skip-2c", prompt: "Qu'est-ce qui vient ensuite ? 16, 18, 20, 22, ___", options: ["23", "24", "26"], correct: "24", patternType: "compter de 2 en 2" },
        ],
      },
      ar: {
        items: [
          { id: "skip-5b", prompt: "ما الرقم التالي؟ 15، 20، 25، 30، ___", options: ["32", "35", "40"], correct: "35", patternType: "العد بمقدار 5" },
          { id: "skip-10b", prompt: "ما الرقم التالي؟ 20، 30، 40، 50، ___", options: ["55", "60", "70"], correct: "60", patternType: "العد بمقدار 10" },
          { id: "skip-2c", prompt: "ما الرقم التالي؟ 16، 18، 20، 22، ___", options: ["23", "24", "26"], correct: "24", patternType: "العد بمقدار 2" },
        ],
      },
    },
  },
];

export const EARLY_FLUENCY_ITEMS_POOL = [
  {
    id: "early-fluency-a",
    content: {
      en: {
        items: [
          { id: "add-1", prompt: "What is 6 + 7?", options: ["12", "13", "14"], correct: "13", fluencyType: "basic addition" },
          { id: "sub-1", prompt: "What is 15 - 8?", options: ["6", "7", "8"], correct: "7", fluencyType: "basic subtraction" },
          { id: "mul-1", prompt: "What is 3 × 4?", options: ["7", "12", "16"], correct: "12", fluencyType: "basic multiplication" },
          { id: "add-2", prompt: "What is 9 + 6?", options: ["14", "15", "16"], correct: "15", fluencyType: "basic addition" },
        ],
      },
      fr: {
        items: [
          { id: "add-1", prompt: "Combien font 6 + 7 ?", options: ["12", "13", "14"], correct: "13", fluencyType: "addition de base" },
          { id: "sub-1", prompt: "Combien font 15 - 8 ?", options: ["6", "7", "8"], correct: "7", fluencyType: "soustraction de base" },
          { id: "mul-1", prompt: "Combien font 3 × 4 ?", options: ["7", "12", "16"], correct: "12", fluencyType: "multiplication de base" },
          { id: "add-2", prompt: "Combien font 9 + 6 ?", options: ["14", "15", "16"], correct: "15", fluencyType: "addition de base" },
        ],
      },
      ar: {
        items: [
          { id: "add-1", prompt: "ما ناتج 6 + 7؟", options: ["12", "13", "14"], correct: "13", fluencyType: "جمع أساسي" },
          { id: "sub-1", prompt: "ما ناتج 15 - 8؟", options: ["6", "7", "8"], correct: "7", fluencyType: "طرح أساسي" },
          { id: "mul-1", prompt: "ما ناتج 3 × 4؟", options: ["7", "12", "16"], correct: "12", fluencyType: "ضرب أساسي" },
          { id: "add-2", prompt: "ما ناتج 9 + 6؟", options: ["14", "15", "16"], correct: "15", fluencyType: "جمع أساسي" },
        ],
      },
    },
  },
  {
    id: "early-fluency-b",
    content: {
      en: {
        items: [
          { id: "add-1", prompt: "What is 8 + 5?", options: ["12", "13", "14"], correct: "13", fluencyType: "basic addition" },
          { id: "sub-1", prompt: "What is 12 - 7?", options: ["4", "5", "6"], correct: "5", fluencyType: "basic subtraction" },
          { id: "mul-1", prompt: "What is 2 × 6?", options: ["8", "10", "12"], correct: "12", fluencyType: "basic multiplication" },
          { id: "add-2", prompt: "What is 7 + 8?", options: ["14", "15", "16"], correct: "15", fluencyType: "basic addition" },
        ],
      },
      fr: {
        items: [
          { id: "add-1", prompt: "Combien font 8 + 5 ?", options: ["12", "13", "14"], correct: "13", fluencyType: "addition de base" },
          { id: "sub-1", prompt: "Combien font 12 - 7 ?", options: ["4", "5", "6"], correct: "5", fluencyType: "soustraction de base" },
          { id: "mul-1", prompt: "Combien font 2 × 6 ?", options: ["8", "10", "12"], correct: "12", fluencyType: "multiplication de base" },
          { id: "add-2", prompt: "Combien font 7 + 8 ?", options: ["14", "15", "16"], correct: "15", fluencyType: "addition de base" },
        ],
      },
      ar: {
        items: [
          { id: "add-1", prompt: "ما ناتج 8 + 5؟", options: ["12", "13", "14"], correct: "13", fluencyType: "جمع أساسي" },
          { id: "sub-1", prompt: "ما ناتج 12 - 7؟", options: ["4", "5", "6"], correct: "5", fluencyType: "طرح أساسي" },
          { id: "mul-1", prompt: "ما ناتج 2 × 6؟", options: ["8", "10", "12"], correct: "12", fluencyType: "ضرب أساسي" },
          { id: "add-2", prompt: "ما ناتج 7 + 8؟", options: ["14", "15", "16"], correct: "15", fluencyType: "جمع أساسي" },
        ],
      },
    },
  },
  {
    id: "early-fluency-c",
    content: {
      en: {
        items: [
          { id: "add-1", prompt: "What is 4 + 9?", options: ["12", "13", "14"], correct: "13", fluencyType: "basic addition" },
          { id: "sub-1", prompt: "What is 17 - 9?", options: ["7", "8", "9"], correct: "8", fluencyType: "basic subtraction" },
          { id: "mul-1", prompt: "What is 5 × 3?", options: ["12", "15", "18"], correct: "15", fluencyType: "basic multiplication" },
          { id: "add-2", prompt: "What is 6 + 8?", options: ["13", "14", "15"], correct: "14", fluencyType: "basic addition" },
        ],
      },
      fr: {
        items: [
          { id: "add-1", prompt: "Combien font 4 + 9 ?", options: ["12", "13", "14"], correct: "13", fluencyType: "addition de base" },
          { id: "sub-1", prompt: "Combien font 17 - 9 ?", options: ["7", "8", "9"], correct: "8", fluencyType: "soustraction de base" },
          { id: "mul-1", prompt: "Combien font 5 × 3 ?", options: ["12", "15", "18"], correct: "15", fluencyType: "multiplication de base" },
          { id: "add-2", prompt: "Combien font 6 + 8 ?", options: ["13", "14", "15"], correct: "14", fluencyType: "addition de base" },
        ],
      },
      ar: {
        items: [
          { id: "add-1", prompt: "ما ناتج 4 + 9؟", options: ["12", "13", "14"], correct: "13", fluencyType: "جمع أساسي" },
          { id: "sub-1", prompt: "ما ناتج 17 - 9؟", options: ["7", "8", "9"], correct: "8", fluencyType: "طرح أساسي" },
          { id: "mul-1", prompt: "ما ناتج 5 × 3؟", options: ["12", "15", "18"], correct: "15", fluencyType: "ضرب أساسي" },
          { id: "add-2", prompt: "ما ناتج 6 + 8؟", options: ["13", "14", "15"], correct: "14", fluencyType: "جمع أساسي" },
        ],
      },
    },
  },
];

// ─── SECONDARY LEVEL POOLS ────────────────────────────────────────────────────

export const SECONDARY_VALUE_ITEMS_POOL = [
  {
    id: "sec-values-a",
    content: {
      en: {
        items: [
          { id: "algebra-1", prompt: "Which is greater?", options: ["2x when x=3", "x² when x=2", "They are equal"], correct: "2x when x=3", confusionType: "algebraic value comparison" },
          { id: "ratio-1", prompt: "Which ratio is greater?", options: ["3:4", "5:7", "They are equal"], correct: "3:4", confusionType: "ratio comparison" },
          { id: "negative-1", prompt: "Which is greater?", options: ["-3", "-5", "They are equal"], correct: "-3", confusionType: "negative number comparison" },
          { id: "root-1", prompt: "Which is greater?", options: ["√16", "3.9", "They are equal"], correct: "They are equal", confusionType: "square root comparison" },
        ],
      },
      fr: {
        items: [
          { id: "algebra-1", prompt: "Lequel est plus grand ?", options: ["2x quand x=3", "x² quand x=2", "Ils sont égaux"], correct: "2x quand x=3", confusionType: "comparaison algébrique" },
          { id: "ratio-1", prompt: "Quel rapport est plus grand ?", options: ["3:4", "5:7", "Ils sont égaux"], correct: "3:4", confusionType: "comparaison de rapports" },
          { id: "negative-1", prompt: "Lequel est plus grand ?", options: ["-3", "-5", "Ils sont égaux"], correct: "-3", confusionType: "comparaison de nombres négatifs" },
          { id: "root-1", prompt: "Lequel est plus grand ?", options: ["√16", "3.9", "Ils sont égaux"], correct: "Ils sont égaux", confusionType: "comparaison de racines carrées" },
        ],
      },
      ar: {
        items: [
          { id: "algebra-1", prompt: "أيهما أكبر؟", options: ["2x عندما x=3", "x² عندما x=2", "هما متساويان"], correct: "2x عندما x=3", confusionType: "مقارنة جبرية" },
          { id: "ratio-1", prompt: "أي نسبة أكبر؟", options: ["3:4", "5:7", "هما متساويان"], correct: "3:4", confusionType: "مقارنة نسب" },
          { id: "negative-1", prompt: "أيهما أكبر؟", options: ["-3", "-5", "هما متساويان"], correct: "-3", confusionType: "مقارنة أعداد سالبة" },
          { id: "root-1", prompt: "أيهما أكبر؟", options: ["√16", "3.9", "هما متساويان"], correct: "هما متساويان", confusionType: "مقارنة جذور تربيعية" },
        ],
      },
    },
  },
  {
    id: "sec-values-b",
    content: {
      en: {
        items: [
          { id: "algebra-1", prompt: "Which is greater?", options: ["3x when x=4", "x³ when x=2", "They are equal"], correct: "3x when x=4", confusionType: "algebraic value comparison" },
          { id: "ratio-1", prompt: "Which ratio is greater?", options: ["2:3", "3:5", "They are equal"], correct: "2:3", confusionType: "ratio comparison" },
          { id: "negative-1", prompt: "Which is greater?", options: ["-1", "-2", "They are equal"], correct: "-1", confusionType: "negative number comparison" },
          { id: "root-1", prompt: "Which is greater?", options: ["√25", "4.9", "They are equal"], correct: "√25", confusionType: "square root comparison" },
        ],
      },
      fr: {
        items: [
          { id: "algebra-1", prompt: "Lequel est plus grand ?", options: ["3x quand x=4", "x³ quand x=2", "Ils sont égaux"], correct: "3x quand x=4", confusionType: "comparaison algébrique" },
          { id: "ratio-1", prompt: "Quel rapport est plus grand ?", options: ["2:3", "3:5", "Ils sont égaux"], correct: "2:3", confusionType: "comparaison de rapports" },
          { id: "negative-1", prompt: "Lequel est plus grand ?", options: ["-1", "-2", "Ils sont égaux"], correct: "-1", confusionType: "comparaison de nombres négatifs" },
          { id: "root-1", prompt: "Lequel est plus grand ?", options: ["√25", "4.9", "Ils sont égaux"], correct: "√25", confusionType: "comparaison de racines carrées" },
        ],
      },
      ar: {
        items: [
          { id: "algebra-1", prompt: "أيهما أكبر؟", options: ["3x عندما x=4", "x³ عندما x=2", "هما متساويان"], correct: "3x عندما x=4", confusionType: "مقارنة جبرية" },
          { id: "ratio-1", prompt: "أي نسبة أكبر؟", options: ["2:3", "3:5", "هما متساويان"], correct: "2:3", confusionType: "مقارنة نسب" },
          { id: "negative-1", prompt: "أيهما أكبر؟", options: ["-1", "-2", "هما متساويان"], correct: "-1", confusionType: "مقارنة أعداد سالبة" },
          { id: "root-1", prompt: "أيهما أكبر؟", options: ["√25", "4.9", "هما متساويان"], correct: "√25", confusionType: "مقارنة جذور تربيعية" },
        ],
      },
    },
  },
  {
    id: "sec-values-c",
    content: {
      en: {
        items: [
          { id: "algebra-1", prompt: "Which is greater?", options: ["4x when x=2", "x² when x=4", "They are equal"], correct: "x² when x=4", confusionType: "algebraic value comparison" },
          { id: "ratio-1", prompt: "Which ratio is greater?", options: ["4:5", "7:9", "They are equal"], correct: "4:5", confusionType: "ratio comparison" },
          { id: "negative-1", prompt: "Which is greater?", options: ["-4", "-2", "They are equal"], correct: "-2", confusionType: "negative number comparison" },
          { id: "root-1", prompt: "Which is greater?", options: ["√9", "2.9", "They are equal"], correct: "√9", confusionType: "square root comparison" },
        ],
      },
      fr: {
        items: [
          { id: "algebra-1", prompt: "Lequel est plus grand ?", options: ["4x quand x=2", "x² quand x=4", "Ils sont égaux"], correct: "x² quand x=4", confusionType: "comparaison algébrique" },
          { id: "ratio-1", prompt: "Quel rapport est plus grand ?", options: ["4:5", "7:9", "Ils sont égaux"], correct: "4:5", confusionType: "comparaison de rapports" },
          { id: "negative-1", prompt: "Lequel est plus grand ?", options: ["-4", "-2", "Ils sont égaux"], correct: "-2", confusionType: "comparaison de nombres négatifs" },
          { id: "root-1", prompt: "Lequel est plus grand ?", options: ["√9", "2.9", "Ils sont égaux"], correct: "√9", confusionType: "comparaison de racines carrées" },
        ],
      },
      ar: {
        items: [
          { id: "algebra-1", prompt: "أيهما أكبر؟", options: ["4x عندما x=2", "x² عندما x=4", "هما متساويان"], correct: "x² عندما x=4", confusionType: "مقارنة جبرية" },
          { id: "ratio-1", prompt: "أي نسبة أكبر؟", options: ["4:5", "7:9", "هما متساويان"], correct: "4:5", confusionType: "مقارنة نسب" },
          { id: "negative-1", prompt: "أيهما أكبر؟", options: ["-4", "-2", "هما متساويان"], correct: "-2", confusionType: "مقارنة أعداد سالبة" },
          { id: "root-1", prompt: "أيهما أكبر؟", options: ["√9", "2.9", "هما متساويان"], correct: "√9", confusionType: "مقارنة جذور تربيعية" },
        ],
      },
    },
  },
];

export const SECONDARY_REPRESENTATION_ITEMS_POOL = [
  {
    id: "sec-rep-a",
    content: {
      en: {
        items: [
          { id: "coord-1", prompt: "Point A is at (2, 3) on a coordinate plane. Which quadrant is it in?", options: ["Quadrant I", "Quadrant II", "Quadrant III"], correct: "Quadrant I", representationType: "coordinate graph" },
          { id: "area-1", prompt: "A rectangle has length 5 cm and width 3 cm. What is its area?", options: ["8 cm²", "15 cm²", "16 cm²"], correct: "15 cm²", representationType: "area model" },
          { id: "coord-2", prompt: "Point B is at (-1, 4). Which quadrant is it in?", options: ["Quadrant I", "Quadrant II", "Quadrant IV"], correct: "Quadrant II", representationType: "coordinate graph" },
        ],
      },
      fr: {
        items: [
          { id: "coord-1", prompt: "Le point A est en (2, 3) sur un plan de coordonnées. Dans quel quadrant se trouve-t-il ?", options: ["Quadrant I", "Quadrant II", "Quadrant III"], correct: "Quadrant I", representationType: "graphique de coordonnées" },
          { id: "area-1", prompt: "Un rectangle a une longueur de 5 cm et une largeur de 3 cm. Quelle est son aire ?", options: ["8 cm²", "15 cm²", "16 cm²"], correct: "15 cm²", representationType: "modèle d'aire" },
          { id: "coord-2", prompt: "Le point B est en (-1, 4). Dans quel quadrant se trouve-t-il ?", options: ["Quadrant I", "Quadrant II", "Quadrant IV"], correct: "Quadrant II", representationType: "graphique de coordonnées" },
        ],
      },
      ar: {
        items: [
          { id: "coord-1", prompt: "النقطة A في (2، 3) على مستوى إحداثي. في أي ربع تقع؟", options: ["الربع الأول", "الربع الثاني", "الربع الثالث"], correct: "الربع الأول", representationType: "رسم بياني إحداثي" },
          { id: "area-1", prompt: "مستطيل طوله 5 سم وعرضه 3 سم. ما مساحته؟", options: ["8 سم²", "15 سم²", "16 سم²"], correct: "15 سم²", representationType: "نموذج المساحة" },
          { id: "coord-2", prompt: "النقطة B في (-1، 4). في أي ربع تقع؟", options: ["الربع الأول", "الربع الثاني", "الربع الرابع"], correct: "الربع الثاني", representationType: "رسم بياني إحداثي" },
        ],
      },
    },
  },
  {
    id: "sec-rep-b",
    content: {
      en: {
        items: [
          { id: "coord-1", prompt: "Point C is at (-3, -2). Which quadrant is it in?", options: ["Quadrant II", "Quadrant III", "Quadrant IV"], correct: "Quadrant III", representationType: "coordinate graph" },
          { id: "area-1", prompt: "A triangle has base 6 cm and height 4 cm. What is its area?", options: ["10 cm²", "12 cm²", "24 cm²"], correct: "12 cm²", representationType: "area model" },
          { id: "coord-2", prompt: "Point D is at (4, -1). Which quadrant is it in?", options: ["Quadrant I", "Quadrant II", "Quadrant IV"], correct: "Quadrant IV", representationType: "coordinate graph" },
        ],
      },
      fr: {
        items: [
          { id: "coord-1", prompt: "Le point C est en (-3, -2). Dans quel quadrant se trouve-t-il ?", options: ["Quadrant II", "Quadrant III", "Quadrant IV"], correct: "Quadrant III", representationType: "graphique de coordonnées" },
          { id: "area-1", prompt: "Un triangle a une base de 6 cm et une hauteur de 4 cm. Quelle est son aire ?", options: ["10 cm²", "12 cm²", "24 cm²"], correct: "12 cm²", representationType: "modèle d'aire" },
          { id: "coord-2", prompt: "Le point D est en (4, -1). Dans quel quadrant se trouve-t-il ?", options: ["Quadrant I", "Quadrant II", "Quadrant IV"], correct: "Quadrant IV", representationType: "graphique de coordonnées" },
        ],
      },
      ar: {
        items: [
          { id: "coord-1", prompt: "النقطة C في (-3، -2). في أي ربع تقع؟", options: ["الربع الثاني", "الربع الثالث", "الربع الرابع"], correct: "الربع الثالث", representationType: "رسم بياني إحداثي" },
          { id: "area-1", prompt: "مثلث قاعدته 6 سم وارتفاعه 4 سم. ما مساحته؟", options: ["10 سم²", "12 سم²", "24 سم²"], correct: "12 سم²", representationType: "نموذج المساحة" },
          { id: "coord-2", prompt: "النقطة D في (4، -1). في أي ربع تقع؟", options: ["الربع الأول", "الربع الثاني", "الربع الرابع"], correct: "الربع الرابع", representationType: "رسم بياني إحداثي" },
        ],
      },
    },
  },
  {
    id: "sec-rep-c",
    content: {
      en: {
        items: [
          { id: "coord-1", prompt: "Point E is at (0, 5). Where does it lie?", options: ["Quadrant I", "On the y-axis", "On the x-axis"], correct: "On the y-axis", representationType: "coordinate graph" },
          { id: "area-1", prompt: "A parallelogram has base 8 cm and height 3 cm. What is its area?", options: ["11 cm²", "24 cm²", "22 cm²"], correct: "24 cm²", representationType: "area model" },
          { id: "coord-2", prompt: "Point F is at (3, 0). Where does it lie?", options: ["Quadrant I", "On the y-axis", "On the x-axis"], correct: "On the x-axis", representationType: "coordinate graph" },
        ],
      },
      fr: {
        items: [
          { id: "coord-1", prompt: "Le point E est en (0, 5). Où se trouve-t-il ?", options: ["Quadrant I", "Sur l'axe des y", "Sur l'axe des x"], correct: "Sur l'axe des y", representationType: "graphique de coordonnées" },
          { id: "area-1", prompt: "Un parallélogramme a une base de 8 cm et une hauteur de 3 cm. Quelle est son aire ?", options: ["11 cm²", "24 cm²", "22 cm²"], correct: "24 cm²", representationType: "modèle d'aire" },
          { id: "coord-2", prompt: "Le point F est en (3, 0). Où se trouve-t-il ?", options: ["Quadrant I", "Sur l'axe des y", "Sur l'axe des x"], correct: "Sur l'axe des x", representationType: "graphique de coordonnées" },
        ],
      },
      ar: {
        items: [
          { id: "coord-1", prompt: "النقطة E في (0، 5). أين تقع؟", options: ["الربع الأول", "على محور y", "على محور x"], correct: "على محور y", representationType: "رسم بياني إحداثي" },
          { id: "area-1", prompt: "متوازي أضلاع قاعدته 8 سم وارتفاعه 3 سم. ما مساحته؟", options: ["11 سم²", "24 سم²", "22 سم²"], correct: "24 سم²", representationType: "نموذج المساحة" },
          { id: "coord-2", prompt: "النقطة F في (3، 0). أين تقع؟", options: ["الربع الأول", "على محور y", "على محور x"], correct: "على محور x", representationType: "رسم بياني إحداثي" },
        ],
      },
    },
  },
];

export const SECONDARY_SEQUENCE_ITEMS_POOL = [
  {
    id: "sec-seq-a",
    content: {
      en: {
        items: [
          { id: "quadratic-1", prompt: "What comes next? 1, 4, 9, 16, ___", options: ["20", "25", "36"], correct: "25", patternType: "perfect squares" },
          { id: "geometric-1", prompt: "What comes next? 2, 6, 18, 54, ___", options: ["108", "162", "216"], correct: "162", patternType: "geometric sequence x3" },
          { id: "linear-1", prompt: "What comes next? 3, 7, 11, 15, ___", options: ["17", "19", "21"], correct: "19", patternType: "arithmetic sequence +4" },
        ],
      },
      fr: {
        items: [
          { id: "quadratic-1", prompt: "Qu'est-ce qui vient ensuite ? 1, 4, 9, 16, ___", options: ["20", "25", "36"], correct: "25", patternType: "carrés parfaits" },
          { id: "geometric-1", prompt: "Qu'est-ce qui vient ensuite ? 2, 6, 18, 54, ___", options: ["108", "162", "216"], correct: "162", patternType: "suite géométrique x3" },
          { id: "linear-1", prompt: "Qu'est-ce qui vient ensuite ? 3, 7, 11, 15, ___", options: ["17", "19", "21"], correct: "19", patternType: "suite arithmétique +4" },
        ],
      },
      ar: {
        items: [
          { id: "quadratic-1", prompt: "ما الرقم التالي؟ 1، 4، 9، 16، ___", options: ["20", "25", "36"], correct: "25", patternType: "مربعات تامة" },
          { id: "geometric-1", prompt: "ما الرقم التالي؟ 2، 6، 18، 54، ___", options: ["108", "162", "216"], correct: "162", patternType: "متتالية هندسية x3" },
          { id: "linear-1", prompt: "ما الرقم التالي؟ 3، 7، 11، 15، ___", options: ["17", "19", "21"], correct: "19", patternType: "متتالية حسابية +4" },
        ],
      },
    },
  },
  {
    id: "sec-seq-b",
    content: {
      en: {
        items: [
          { id: "quadratic-1", prompt: "What comes next? 0, 1, 4, 9, ___", options: ["12", "16", "25"], correct: "16", patternType: "perfect squares" },
          { id: "geometric-1", prompt: "What comes next? 3, 6, 12, 24, ___", options: ["36", "48", "72"], correct: "48", patternType: "geometric sequence x2" },
          { id: "linear-1", prompt: "What comes next? 5, 9, 13, 17, ___", options: ["19", "21", "23"], correct: "21", patternType: "arithmetic sequence +4" },
        ],
      },
      fr: {
        items: [
          { id: "quadratic-1", prompt: "Qu'est-ce qui vient ensuite ? 0, 1, 4, 9, ___", options: ["12", "16", "25"], correct: "16", patternType: "carrés parfaits" },
          { id: "geometric-1", prompt: "Qu'est-ce qui vient ensuite ? 3, 6, 12, 24, ___", options: ["36", "48", "72"], correct: "48", patternType: "suite géométrique x2" },
          { id: "linear-1", prompt: "Qu'est-ce qui vient ensuite ? 5, 9, 13, 17, ___", options: ["19", "21", "23"], correct: "21", patternType: "suite arithmétique +4" },
        ],
      },
      ar: {
        items: [
          { id: "quadratic-1", prompt: "ما الرقم التالي؟ 0، 1، 4، 9، ___", options: ["12", "16", "25"], correct: "16", patternType: "مربعات تامة" },
          { id: "geometric-1", prompt: "ما الرقم التالي؟ 3، 6، 12، 24، ___", options: ["36", "48", "72"], correct: "48", patternType: "متتالية هندسية x2" },
          { id: "linear-1", prompt: "ما الرقم التالي؟ 5، 9، 13، 17، ___", options: ["19", "21", "23"], correct: "21", patternType: "متتالية حسابية +4" },
        ],
      },
    },
  },
  {
    id: "sec-seq-c",
    content: {
      en: {
        items: [
          { id: "fibonacci-1", prompt: "What comes next? 1, 1, 2, 3, 5, ___", options: ["7", "8", "9"], correct: "8", patternType: "Fibonacci sequence" },
          { id: "geometric-1", prompt: "What comes next? 1, 2, 4, 8, ___", options: ["12", "16", "32"], correct: "16", patternType: "geometric sequence x2" },
          { id: "linear-1", prompt: "What comes next? 100, 90, 80, 70, ___", options: ["55", "60", "65"], correct: "60", patternType: "arithmetic sequence -10" },
        ],
      },
      fr: {
        items: [
          { id: "fibonacci-1", prompt: "Qu'est-ce qui vient ensuite ? 1, 1, 2, 3, 5, ___", options: ["7", "8", "9"], correct: "8", patternType: "suite de Fibonacci" },
          { id: "geometric-1", prompt: "Qu'est-ce qui vient ensuite ? 1, 2, 4, 8, ___", options: ["12", "16", "32"], correct: "16", patternType: "suite géométrique x2" },
          { id: "linear-1", prompt: "Qu'est-ce qui vient ensuite ? 100, 90, 80, 70, ___", options: ["55", "60", "65"], correct: "60", patternType: "suite arithmétique -10" },
        ],
      },
      ar: {
        items: [
          { id: "fibonacci-1", prompt: "ما الرقم التالي؟ 1، 1، 2، 3، 5، ___", options: ["7", "8", "9"], correct: "8", patternType: "متتالية فيبوناتشي" },
          { id: "geometric-1", prompt: "ما الرقم التالي؟ 1، 2، 4، 8، ___", options: ["12", "16", "32"], correct: "16", patternType: "متتالية هندسية x2" },
          { id: "linear-1", prompt: "ما الرقم التالي؟ 100، 90، 80، 70، ___", options: ["55", "60", "65"], correct: "60", patternType: "متتالية حسابية -10" },
        ],
      },
    },
  },
];

export const SECONDARY_FLUENCY_ITEMS_POOL = [
  {
    id: "sec-fluency-a",
    content: {
      en: {
        items: [
          { id: "algebra-1", prompt: "Solve for x: 2x + 5 = 13", options: ["3", "4", "5"], correct: "4", fluencyType: "linear equation" },
          { id: "algebra-2", prompt: "Simplify: 3(x + 2) - x", options: ["2x + 6", "2x + 2", "4x + 6"], correct: "2x + 6", fluencyType: "algebraic simplification" },
          { id: "percent-1", prompt: "What is 30% of 90?", options: ["24", "27", "30"], correct: "27", fluencyType: "percentage calculation" },
          { id: "ratio-1", prompt: "If 3 pens cost $1.50, how much do 7 pens cost?", options: ["$3.00", "$3.50", "$4.00"], correct: "$3.50", fluencyType: "ratio and proportion" },
        ],
      },
      fr: {
        items: [
          { id: "algebra-1", prompt: "Résoudre pour x : 2x + 5 = 13", options: ["3", "4", "5"], correct: "4", fluencyType: "équation linéaire" },
          { id: "algebra-2", prompt: "Simplifier : 3(x + 2) - x", options: ["2x + 6", "2x + 2", "4x + 6"], correct: "2x + 6", fluencyType: "simplification algébrique" },
          { id: "percent-1", prompt: "Combien font 30% de 90 ?", options: ["24", "27", "30"], correct: "27", fluencyType: "calcul de pourcentage" },
          { id: "ratio-1", prompt: "Si 3 stylos coûtent 1,50 €, combien coûtent 7 stylos ?", options: ["3,00 €", "3,50 €", "4,00 €"], correct: "3,50 €", fluencyType: "rapport et proportion" },
        ],
      },
      ar: {
        items: [
          { id: "algebra-1", prompt: "حل من أجل x: 2x + 5 = 13", options: ["3", "4", "5"], correct: "4", fluencyType: "معادلة خطية" },
          { id: "algebra-2", prompt: "بسّط: 3(x + 2) - x", options: ["2x + 6", "2x + 2", "4x + 6"], correct: "2x + 6", fluencyType: "تبسيط جبري" },
          { id: "percent-1", prompt: "ما هو 30% من 90؟", options: ["24", "27", "30"], correct: "27", fluencyType: "حساب النسبة المئوية" },
          { id: "ratio-1", prompt: "إذا كانت 3 أقلام تكلف 1.50 درهم، كم تكلف 7 أقلام؟", options: ["3.00", "3.50", "4.00"], correct: "3.50", fluencyType: "النسبة والتناسب" },
        ],
      },
    },
  },
  {
    id: "sec-fluency-b",
    content: {
      en: {
        items: [
          { id: "algebra-1", prompt: "Solve for x: 3x - 4 = 11", options: ["4", "5", "6"], correct: "5", fluencyType: "linear equation" },
          { id: "algebra-2", prompt: "Simplify: 4(2x - 1) + 3", options: ["8x - 1", "8x + 7", "6x - 1"], correct: "8x - 1", fluencyType: "algebraic simplification" },
          { id: "percent-1", prompt: "What is 25% of 80?", options: ["15", "20", "25"], correct: "20", fluencyType: "percentage calculation" },
          { id: "ratio-1", prompt: "If 5 notebooks cost $7.50, how much do 8 notebooks cost?", options: ["$10.00", "$12.00", "$14.00"], correct: "$12.00", fluencyType: "ratio and proportion" },
        ],
      },
      fr: {
        items: [
          { id: "algebra-1", prompt: "Résoudre pour x : 3x - 4 = 11", options: ["4", "5", "6"], correct: "5", fluencyType: "équation linéaire" },
          { id: "algebra-2", prompt: "Simplifier : 4(2x - 1) + 3", options: ["8x - 1", "8x + 7", "6x - 1"], correct: "8x - 1", fluencyType: "simplification algébrique" },
          { id: "percent-1", prompt: "Combien font 25% de 80 ?", options: ["15", "20", "25"], correct: "20", fluencyType: "calcul de pourcentage" },
          { id: "ratio-1", prompt: "Si 5 cahiers coûtent 7,50 €, combien coûtent 8 cahiers ?", options: ["10,00 €", "12,00 €", "14,00 €"], correct: "12,00 €", fluencyType: "rapport et proportion" },
        ],
      },
      ar: {
        items: [
          { id: "algebra-1", prompt: "حل من أجل x: 3x - 4 = 11", options: ["4", "5", "6"], correct: "5", fluencyType: "معادلة خطية" },
          { id: "algebra-2", prompt: "بسّط: 4(2x - 1) + 3", options: ["8x - 1", "8x + 7", "6x - 1"], correct: "8x - 1", fluencyType: "تبسيط جبري" },
          { id: "percent-1", prompt: "ما هو 25% من 80؟", options: ["15", "20", "25"], correct: "20", fluencyType: "حساب النسبة المئوية" },
          { id: "ratio-1", prompt: "إذا كانت 5 دفاتر تكلف 7.50 درهم، كم تكلف 8 دفاتر؟", options: ["10.00", "12.00", "14.00"], correct: "12.00", fluencyType: "النسبة والتناسب" },
        ],
      },
    },
  },
  {
    id: "sec-fluency-c",
    content: {
      en: {
        items: [
          { id: "algebra-1", prompt: "Solve for x: 5x + 1 = 21", options: ["3", "4", "5"], correct: "4", fluencyType: "linear equation" },
          { id: "algebra-2", prompt: "Expand: (x + 3)(x - 2)", options: ["x² + x - 6", "x² - x - 6", "x² + x + 6"], correct: "x² + x - 6", fluencyType: "polynomial expansion" },
          { id: "percent-1", prompt: "What is 15% of 60?", options: ["6", "9", "12"], correct: "9", fluencyType: "percentage calculation" },
          { id: "ratio-1", prompt: "A recipe uses 2 cups of flour for 12 cookies. How many cups for 30 cookies?", options: ["4", "5", "6"], correct: "5", fluencyType: "ratio and proportion" },
        ],
      },
      fr: {
        items: [
          { id: "algebra-1", prompt: "Résoudre pour x : 5x + 1 = 21", options: ["3", "4", "5"], correct: "4", fluencyType: "équation linéaire" },
          { id: "algebra-2", prompt: "Développer : (x + 3)(x - 2)", options: ["x² + x - 6", "x² - x - 6", "x² + x + 6"], correct: "x² + x - 6", fluencyType: "développement de polynôme" },
          { id: "percent-1", prompt: "Combien font 15% de 60 ?", options: ["6", "9", "12"], correct: "9", fluencyType: "calcul de pourcentage" },
          { id: "ratio-1", prompt: "Une recette utilise 2 tasses de farine pour 12 biscuits. Combien de tasses pour 30 biscuits ?", options: ["4", "5", "6"], correct: "5", fluencyType: "rapport et proportion" },
        ],
      },
      ar: {
        items: [
          { id: "algebra-1", prompt: "حل من أجل x: 5x + 1 = 21", options: ["3", "4", "5"], correct: "4", fluencyType: "معادلة خطية" },
          { id: "algebra-2", prompt: "وسّع: (x + 3)(x - 2)", options: ["x² + x - 6", "x² - x - 6", "x² + x + 6"], correct: "x² + x - 6", fluencyType: "توسيع متعدد الحدود" },
          { id: "percent-1", prompt: "ما هو 15% من 60؟", options: ["6", "9", "12"], correct: "9", fluencyType: "حساب النسبة المئوية" },
          { id: "ratio-1", prompt: "وصفة تستخدم 2 كوب دقيق لـ 12 بسكويت. كم كوباً لـ 30 بسكويت؟", options: ["4", "5", "6"], correct: "5", fluencyType: "النسبة والتناسب" },
        ],
      },
    },
  },
];

// ─── ADVANCED LEVEL POOLS ─────────────────────────────────────────────────────

export const ADVANCED_VALUE_ITEMS_POOL = [
  {
    id: "adv-values-a",
    content: {
      en: {
        items: [
          { id: "limit-1", prompt: "Which limit is greater as x grows without bound?", options: ["ln(x)", "sqrt(x)", "They grow at the same rate"], correct: "sqrt(x)", confusionType: "limit comparison" },
          { id: "log-1", prompt: "Which is greater?", options: ["log base 2 of 8", "log base 3 of 9", "They are equal"], correct: "log base 2 of 8", confusionType: "logarithm comparison" },
          { id: "vector-1", prompt: "Which vector has greater magnitude?", options: ["(3, 4)", "(2, 5)", "They are equal"], correct: "They are equal", confusionType: "vector magnitude" },
          { id: "integral-1", prompt: "Which definite integral is greater over [0,1]?", options: ["integral of x", "integral of x squared", "They are equal"], correct: "integral of x", confusionType: "definite integral comparison" },
        ],
      },
      fr: {
        items: [
          { id: "limit-1", prompt: "Quelle limite est plus grande quand x croît sans limite ?", options: ["ln(x)", "racine(x)", "Elles croissent au même rythme"], correct: "racine(x)", confusionType: "comparaison de limites" },
          { id: "log-1", prompt: "Lequel est plus grand ?", options: ["log base 2 de 8", "log base 3 de 9", "Ils sont égaux"], correct: "log base 2 de 8", confusionType: "comparaison de logarithmes" },
          { id: "vector-1", prompt: "Quel vecteur a la plus grande magnitude ?", options: ["(3, 4)", "(2, 5)", "Ils sont égaux"], correct: "Ils sont égaux", confusionType: "magnitude vectorielle" },
          { id: "integral-1", prompt: "Quelle intégrale définie est plus grande sur [0,1] ?", options: ["intégrale de x", "intégrale de x au carré", "Elles sont égales"], correct: "intégrale de x", confusionType: "comparaison d'intégrales définies" },
        ],
      },
      ar: {
        items: [
          { id: "limit-1", prompt: "أي نهاية أكبر عندما تنمو x بلا حدود؟", options: ["ln(x)", "جذر(x)", "كلتاهما تنمو بنفس المعدل"], correct: "جذر(x)", confusionType: "مقارنة النهايات" },
          { id: "log-1", prompt: "أيهما أكبر؟", options: ["لوغاريتم 8 بأساس 2", "لوغاريتم 9 بأساس 3", "هما متساويان"], correct: "لوغاريتم 8 بأساس 2", confusionType: "مقارنة اللوغاريتمات" },
          { id: "vector-1", prompt: "أي متجه له مقدار أكبر؟", options: ["(3, 4)", "(2, 5)", "هما متساويان"], correct: "هما متساويان", confusionType: "مقدار المتجه" },
          { id: "integral-1", prompt: "أي تكامل محدد أكبر على [0,1]؟", options: ["تكامل x", "تكامل x تربيع", "هما متساويان"], correct: "تكامل x", confusionType: "مقارنة التكاملات المحددة" },
        ],
      },
    },
  },
  {
    id: "adv-values-b",
    content: {
      en: {
        items: [
          { id: "limit-1", prompt: "Which grows faster as n grows without bound?", options: ["n squared", "2 to the power n", "They grow at the same rate"], correct: "2 to the power n", confusionType: "growth rate comparison" },
          { id: "log-1", prompt: "Which is greater?", options: ["log base 10 of 100", "natural log of e squared", "They are equal"], correct: "They are equal", confusionType: "logarithm comparison" },
          { id: "vector-1", prompt: "Which 3D vector has greater magnitude?", options: ["(1, 0, 1)", "(0, 1, 1)", "They are equal"], correct: "They are equal", confusionType: "3D vector magnitude" },
          { id: "integral-1", prompt: "Which definite integral is greater over [0,2]?", options: ["integral of x squared", "integral of 2x", "They are equal"], correct: "integral of 2x", confusionType: "definite integral comparison" },
        ],
      },
      fr: {
        items: [
          { id: "limit-1", prompt: "Lequel croît plus vite quand n croît sans limite ?", options: ["n au carré", "2 puissance n", "Ils croissent au même rythme"], correct: "2 puissance n", confusionType: "comparaison de taux de croissance" },
          { id: "log-1", prompt: "Lequel est plus grand ?", options: ["log base 10 de 100", "logarithme naturel de e au carré", "Ils sont égaux"], correct: "Ils sont égaux", confusionType: "comparaison de logarithmes" },
          { id: "vector-1", prompt: "Quel vecteur 3D a la plus grande magnitude ?", options: ["(1, 0, 1)", "(0, 1, 1)", "Ils sont égaux"], correct: "Ils sont égaux", confusionType: "magnitude vectorielle 3D" },
          { id: "integral-1", prompt: "Quelle intégrale définie est plus grande sur [0,2] ?", options: ["intégrale de x au carré", "intégrale de 2x", "Elles sont égales"], correct: "intégrale de 2x", confusionType: "comparaison d'intégrales définies" },
        ],
      },
      ar: {
        items: [
          { id: "limit-1", prompt: "أيهما ينمو أسرع عندما تنمو n بلا حدود؟", options: ["n تربيع", "2 أس n", "كلاهما ينمو بنفس المعدل"], correct: "2 أس n", confusionType: "مقارنة معدلات النمو" },
          { id: "log-1", prompt: "أيهما أكبر؟", options: ["لوغاريتم 100 بأساس 10", "اللوغاريتم الطبيعي لـ e تربيع", "هما متساويان"], correct: "هما متساويان", confusionType: "مقارنة اللوغاريتمات" },
          { id: "vector-1", prompt: "أي متجه ثلاثي الأبعاد له مقدار أكبر؟", options: ["(1, 0, 1)", "(0, 1, 1)", "هما متساويان"], correct: "هما متساويان", confusionType: "مقدار المتجه ثلاثي الأبعاد" },
          { id: "integral-1", prompt: "أي تكامل محدد أكبر على [0,2]؟", options: ["تكامل x تربيع", "تكامل 2x", "هما متساويان"], correct: "تكامل 2x", confusionType: "مقارنة التكاملات المحددة" },
        ],
      },
    },
  },
  {
    id: "adv-values-c",
    content: {
      en: {
        items: [
          { id: "limit-1", prompt: "What is the limit of sin(x)/x as x approaches 0?", options: ["0", "1", "undefined"], correct: "1", confusionType: "classic limit" },
          { id: "log-1", prompt: "Which is greater?", options: ["log base 2 of 32", "log base 5 of 125", "They are equal"], correct: "They are equal", confusionType: "logarithm comparison" },
          { id: "vector-1", prompt: "What is the dot product of (1,0) and (0,1)?", options: ["0", "1", "2"], correct: "0", confusionType: "dot product" },
          { id: "integral-1", prompt: "Which definite integral is greater?", options: ["integral of x from -1 to 1", "integral of x from 0 to 2", "They are equal"], correct: "integral of x from 0 to 2", confusionType: "definite integral comparison" },
        ],
      },
      fr: {
        items: [
          { id: "limit-1", prompt: "Quelle est la limite de sin(x)/x quand x tend vers 0 ?", options: ["0", "1", "indéfinie"], correct: "1", confusionType: "limite classique" },
          { id: "log-1", prompt: "Lequel est plus grand ?", options: ["log base 2 de 32", "log base 5 de 125", "Ils sont égaux"], correct: "Ils sont égaux", confusionType: "comparaison de logarithmes" },
          { id: "vector-1", prompt: "Quel est le produit scalaire de (1,0) et (0,1) ?", options: ["0", "1", "2"], correct: "0", confusionType: "produit scalaire" },
          { id: "integral-1", prompt: "Quelle intégrale définie est plus grande ?", options: ["intégrale de x de -1 à 1", "intégrale de x de 0 à 2", "Elles sont égales"], correct: "intégrale de x de 0 à 2", confusionType: "comparaison d'intégrales définies" },
        ],
      },
      ar: {
        items: [
          { id: "limit-1", prompt: "ما نهاية sin(x)/x عندما يقترب x من 0؟", options: ["0", "1", "غير محددة"], correct: "1", confusionType: "نهاية كلاسيكية" },
          { id: "log-1", prompt: "أيهما أكبر؟", options: ["لوغاريتم 32 بأساس 2", "لوغاريتم 125 بأساس 5", "هما متساويان"], correct: "هما متساويان", confusionType: "مقارنة اللوغاريتمات" },
          { id: "vector-1", prompt: "ما حاصل الضرب النقطي لـ (1,0) و (0,1)؟", options: ["0", "1", "2"], correct: "0", confusionType: "حاصل الضرب النقطي" },
          { id: "integral-1", prompt: "أي تكامل محدد أكبر؟", options: ["تكامل x من -1 إلى 1", "تكامل x من 0 إلى 2", "هما متساويان"], correct: "تكامل x من 0 إلى 2", confusionType: "مقارنة التكاملات المحددة" },
        ],
      },
    },
  },
];

export const ADVANCED_REPRESENTATION_ITEMS_POOL = [
  {
    id: "adv-rep-a",
    content: {
      en: {
        items: [
          { id: "function-1", prompt: "The graph of f(x) = x squared is best described as:", options: ["A straight line through the origin", "A parabola opening upward", "An exponential curve"], correct: "A parabola opening upward", representationType: "function graph" },
          { id: "stats-1", prompt: "A normal distribution curve is:", options: ["Skewed to the right", "Symmetric and bell-shaped", "Uniform and flat"], correct: "Symmetric and bell-shaped", representationType: "statistical distribution" },
          { id: "function-2", prompt: "The graph of f(x) = 1/x has:", options: ["Two branches in opposite quadrants", "A single branch", "A vertical line of symmetry"], correct: "Two branches in opposite quadrants", representationType: "rational function" },
        ],
      },
      fr: {
        items: [
          { id: "function-1", prompt: "Le graphe de f(x) = x au carré est mieux décrit comme :", options: ["Une droite passant par l'origine", "Une parabole s'ouvrant vers le haut", "Une courbe exponentielle"], correct: "Une parabole s'ouvrant vers le haut", representationType: "graphe de fonction" },
          { id: "stats-1", prompt: "Une courbe de distribution normale est :", options: ["Asymétrique à droite", "Symétrique en forme de cloche", "Uniforme et plate"], correct: "Symétrique en forme de cloche", representationType: "distribution statistique" },
          { id: "function-2", prompt: "Le graphe de f(x) = 1/x a :", options: ["Deux branches dans des quadrants opposés", "Une seule branche", "Un axe vertical de symétrie"], correct: "Deux branches dans des quadrants opposés", representationType: "fonction rationnelle" },
        ],
      },
      ar: {
        items: [
          { id: "function-1", prompt: "رسم f(x) = x تربيع يوصف بأنه:", options: ["خط مستقيم يمر بالأصل", "قطع مكافئ يفتح للأعلى", "منحنى أسي"], correct: "قطع مكافئ يفتح للأعلى", representationType: "رسم الدالة" },
          { id: "stats-1", prompt: "منحنى التوزيع الطبيعي:", options: ["منحرف لليمين", "متماثل وعلى شكل جرس", "منتظم ومسطح"], correct: "متماثل وعلى شكل جرس", representationType: "التوزيع الإحصائي" },
          { id: "function-2", prompt: "رسم f(x) = 1/x له:", options: ["فرعان في ربعين متقابلين", "فرع واحد فقط", "محور تماثل رأسي"], correct: "فرعان في ربعين متقابلين", representationType: "الدالة الكسرية" },
        ],
      },
    },
  },
  {
    id: "adv-rep-b",
    content: {
      en: {
        items: [
          { id: "function-1", prompt: "The graph of f(x) = e to the power x:", options: ["Passes through (0,0)", "Passes through (0,1) and is always positive", "Has a maximum at x=0"], correct: "Passes through (0,1) and is always positive", representationType: "exponential function" },
          { id: "stats-1", prompt: "A box plot shows:", options: ["Mean and standard deviation only", "Median, quartiles, and range", "Individual data points"], correct: "Median, quartiles, and range", representationType: "statistical plot" },
          { id: "function-2", prompt: "The derivative of a function at a point represents:", options: ["The area under the curve", "The slope of the tangent line", "The average value of the function"], correct: "The slope of the tangent line", representationType: "calculus concept" },
        ],
      },
      fr: {
        items: [
          { id: "function-1", prompt: "Le graphe de f(x) = e puissance x :", options: ["Passe par (0,0)", "Passe par (0,1) et est toujours positif", "A un maximum en x=0"], correct: "Passe par (0,1) et est toujours positif", representationType: "fonction exponentielle" },
          { id: "stats-1", prompt: "Un diagramme en boîte montre :", options: ["Uniquement la moyenne et l'écart type", "La médiane, les quartiles et l'étendue", "Les points de données individuels"], correct: "La médiane, les quartiles et l'étendue", representationType: "graphique statistique" },
          { id: "function-2", prompt: "La dérivée d'une fonction en un point représente :", options: ["L'aire sous la courbe", "La pente de la tangente", "La valeur moyenne de la fonction"], correct: "La pente de la tangente", representationType: "concept de calcul" },
        ],
      },
      ar: {
        items: [
          { id: "function-1", prompt: "رسم f(x) = e أس x:", options: ["يمر بـ (0,0)", "يمر بـ (0,1) وهو دائماً موجب", "له قيمة قصوى عند x=0"], correct: "يمر بـ (0,1) وهو دائماً موجب", representationType: "الدالة الأسية" },
          { id: "stats-1", prompt: "المخطط الصندوقي يُظهر:", options: ["المتوسط والانحراف المعياري فقط", "الوسيط والربيعات والمدى", "نقاط البيانات الفردية"], correct: "الوسيط والربيعات والمدى", representationType: "رسم إحصائي" },
          { id: "function-2", prompt: "مشتقة دالة عند نقطة تمثل:", options: ["المساحة تحت المنحنى", "ميل المماس", "القيمة المتوسطة للدالة"], correct: "ميل المماس", representationType: "مفهوم التفاضل" },
        ],
      },
    },
  },
  {
    id: "adv-rep-c",
    content: {
      en: {
        items: [
          { id: "function-1", prompt: "The graph of f(x) = sin(x) has a period of:", options: ["pi", "2 pi", "4 pi"], correct: "2 pi", representationType: "trigonometric function" },
          { id: "stats-1", prompt: "A scatter plot with points trending upward-right shows:", options: ["Negative correlation", "Positive correlation", "No correlation"], correct: "Positive correlation", representationType: "statistical correlation" },
          { id: "function-2", prompt: "The integral of f(x) geometrically represents:", options: ["The slope of f at any point", "The area between f and the x-axis", "The inverse of f"], correct: "The area between f and the x-axis", representationType: "integral interpretation" },
        ],
      },
      fr: {
        items: [
          { id: "function-1", prompt: "Le graphe de f(x) = sin(x) a une période de :", options: ["pi", "2 pi", "4 pi"], correct: "2 pi", representationType: "fonction trigonométrique" },
          { id: "stats-1", prompt: "Un nuage de points avec des points tendant vers le haut-droit montre :", options: ["Corrélation négative", "Corrélation positive", "Aucune corrélation"], correct: "Corrélation positive", representationType: "corrélation statistique" },
          { id: "function-2", prompt: "L'intégrale de f(x) représente géométriquement :", options: ["La pente de f en un point quelconque", "L'aire entre f et l'axe des x", "L'inverse de f"], correct: "L'aire entre f et l'axe des x", representationType: "interprétation de l'intégrale" },
        ],
      },
      ar: {
        items: [
          { id: "function-1", prompt: "دورة رسم f(x) = sin(x) هي:", options: ["باي", "2 باي", "4 باي"], correct: "2 باي", representationType: "الدالة المثلثية" },
          { id: "stats-1", prompt: "مخطط انتشار بنقاط تتجه نحو الأعلى-اليمين يُظهر:", options: ["ارتباطاً سلبياً", "ارتباطاً إيجابياً", "لا ارتباط"], correct: "ارتباطاً إيجابياً", representationType: "الارتباط الإحصائي" },
          { id: "function-2", prompt: "تكامل f(x) يمثل هندسياً:", options: ["ميل f عند أي نقطة", "المساحة بين f ومحور x", "مقلوب f"], correct: "المساحة بين f ومحور x", representationType: "تفسير التكامل" },
        ],
      },
    },
  },
];

export const ADVANCED_SEQUENCE_ITEMS_POOL = [
  {
    id: "adv-seq-a",
    content: {
      en: {
        items: [
          { id: "series-1", prompt: "Does the series 1 + 1/2 + 1/4 + 1/8 + ... converge?", options: ["No, it diverges", "Yes, to 2", "Yes, to 1"], correct: "Yes, to 2", patternType: "geometric series convergence" },
          { id: "recursive-1", prompt: "If a1 = 1 and an = 2 times the previous term, what is a4?", options: ["6", "8", "16"], correct: "8", patternType: "recursive sequence" },
          { id: "series-2", prompt: "For an = n squared - n + 1: a1=1, a2=3, a3=7, what is a4?", options: ["11", "13", "15"], correct: "13", patternType: "polynomial sequence" },
        ],
      },
      fr: {
        items: [
          { id: "series-1", prompt: "La série 1 + 1/2 + 1/4 + 1/8 + ... converge-t-elle ?", options: ["Non, elle diverge", "Oui, vers 2", "Oui, vers 1"], correct: "Oui, vers 2", patternType: "convergence de série géométrique" },
          { id: "recursive-1", prompt: "Si a1 = 1 et an = 2 fois le terme précédent, quelle est a4 ?", options: ["6", "8", "16"], correct: "8", patternType: "suite récursive" },
          { id: "series-2", prompt: "Pour an = n au carré - n + 1 : a1=1, a2=3, a3=7, quelle est a4 ?", options: ["11", "13", "15"], correct: "13", patternType: "suite polynomiale" },
        ],
      },
      ar: {
        items: [
          { id: "series-1", prompt: "هل المتسلسلة 1 + 1/2 + 1/4 + 1/8 + ... تتقارب؟", options: ["لا، تتباعد", "نعم، إلى 2", "نعم، إلى 1"], correct: "نعم، إلى 2", patternType: "تقارب المتسلسلة الهندسية" },
          { id: "recursive-1", prompt: "إذا كان a1 = 1 و an = 2 ضعف الحد السابق، ما قيمة a4؟", options: ["6", "8", "16"], correct: "8", patternType: "متتالية تعاودية" },
          { id: "series-2", prompt: "لـ an = n تربيع - n + 1: a1=1، a2=3، a3=7، ما قيمة a4؟", options: ["11", "13", "15"], correct: "13", patternType: "متتالية كثيرة الحدود" },
        ],
      },
    },
  },
  {
    id: "adv-seq-b",
    content: {
      en: {
        items: [
          { id: "series-1", prompt: "Does the harmonic series 1 + 1/2 + 1/3 + 1/4 + ... converge?", options: ["Yes, to ln(2)", "No, it diverges", "Yes, to pi"], correct: "No, it diverges", patternType: "harmonic series divergence" },
          { id: "recursive-1", prompt: "If a1 = 3 and each term is previous + 4, what is a5?", options: ["15", "17", "19"], correct: "19", patternType: "arithmetic recursive sequence" },
          { id: "series-2", prompt: "What is the sum of the first 5 terms of 1, -1, 1, -1, 1, ...?", options: ["-1", "0", "1"], correct: "1", patternType: "alternating series" },
        ],
      },
      fr: {
        items: [
          { id: "series-1", prompt: "La série harmonique 1 + 1/2 + 1/3 + 1/4 + ... converge-t-elle ?", options: ["Oui, vers ln(2)", "Non, elle diverge", "Oui, vers pi"], correct: "Non, elle diverge", patternType: "divergence de la série harmonique" },
          { id: "recursive-1", prompt: "Si a1 = 3 et chaque terme est précédent + 4, quelle est a5 ?", options: ["15", "17", "19"], correct: "19", patternType: "suite récursive arithmétique" },
          { id: "series-2", prompt: "Quelle est la somme des 5 premiers termes de 1, -1, 1, -1, 1, ... ?", options: ["-1", "0", "1"], correct: "1", patternType: "série alternée" },
        ],
      },
      ar: {
        items: [
          { id: "series-1", prompt: "هل المتسلسلة التوافقية 1 + 1/2 + 1/3 + 1/4 + ... تتقارب؟", options: ["نعم، إلى ln(2)", "لا، تتباعد", "نعم، إلى باي"], correct: "لا، تتباعد", patternType: "تباعد المتسلسلة التوافقية" },
          { id: "recursive-1", prompt: "إذا كان a1 = 3 وكل حد = السابق + 4، ما قيمة a5؟", options: ["15", "17", "19"], correct: "19", patternType: "متتالية تعاودية حسابية" },
          { id: "series-2", prompt: "ما مجموع أول 5 حدود من 1، -1، 1، -1، 1، ...؟", options: ["-1", "0", "1"], correct: "1", patternType: "متسلسلة متناوبة" },
        ],
      },
    },
  },
  {
    id: "adv-seq-c",
    content: {
      en: {
        items: [
          { id: "series-1", prompt: "The Taylor series for e to the x around x=0 starts:", options: ["1 + x + x^2/2! + x^3/3! + ...", "1 + x + x^2 + x^3 + ...", "x + x^2/2 + x^3/3 + ..."], correct: "1 + x + x^2/2! + x^3/3! + ...", patternType: "Taylor series" },
          { id: "recursive-1", prompt: "If a1 = 2, a2 = 5, and each term = sum of two previous, what is a4?", options: ["10", "12", "14"], correct: "12", patternType: "generalized Fibonacci" },
          { id: "series-2", prompt: "What is the limit of (1 + 1/n) to the power n as n grows without bound?", options: ["1", "e", "infinity"], correct: "e", patternType: "limit definition of e" },
        ],
      },
      fr: {
        items: [
          { id: "series-1", prompt: "La série de Taylor pour e puissance x autour de x=0 commence par :", options: ["1 + x + x^2/2! + x^3/3! + ...", "1 + x + x^2 + x^3 + ...", "x + x^2/2 + x^3/3 + ..."], correct: "1 + x + x^2/2! + x^3/3! + ...", patternType: "série de Taylor" },
          { id: "recursive-1", prompt: "Si a1 = 2, a2 = 5, et chaque terme = somme des deux précédents, quelle est a4 ?", options: ["10", "12", "14"], correct: "12", patternType: "Fibonacci généralisé" },
          { id: "series-2", prompt: "Quelle est la limite de (1 + 1/n) puissance n quand n croît sans limite ?", options: ["1", "e", "infini"], correct: "e", patternType: "définition de e par la limite" },
        ],
      },
      ar: {
        items: [
          { id: "series-1", prompt: "متسلسلة تايلور لـ e أس x حول x=0 تبدأ بـ:", options: ["1 + x + x^2/2! + x^3/3! + ...", "1 + x + x^2 + x^3 + ...", "x + x^2/2 + x^3/3 + ..."], correct: "1 + x + x^2/2! + x^3/3! + ...", patternType: "متسلسلة تايلور" },
          { id: "recursive-1", prompt: "إذا كان a1 = 2، a2 = 5، وكل حد = مجموع الحدين السابقين، ما قيمة a4؟", options: ["10", "12", "14"], correct: "12", patternType: "فيبوناتشي المعمّم" },
          { id: "series-2", prompt: "ما نهاية (1 + 1/n) أس n عندما تنمو n بلا حدود؟", options: ["1", "e", "لا نهاية"], correct: "e", patternType: "تعريف e بالنهاية" },
        ],
      },
    },
  },
];

export const ADVANCED_FLUENCY_ITEMS_POOL = [
  {
    id: "adv-fluency-a",
    content: {
      en: {
        items: [
          { id: "calculus-1", prompt: "What is the derivative of f(x) = x cubed + 2x?", options: ["3x squared + 2", "x squared + 2", "3x squared + 2x"], correct: "3x squared + 2", fluencyType: "differentiation" },
          { id: "calculus-2", prompt: "What is the integral of (2x + 3)?", options: ["x squared + 3x + C", "2x squared + 3 + C", "x squared + 3 + C"], correct: "x squared + 3x + C", fluencyType: "integration" },
          { id: "proof-1", prompt: "To prove that the square root of 2 is irrational, the best method is:", options: ["Direct proof", "Proof by contradiction", "Proof by induction"], correct: "Proof by contradiction", fluencyType: "proof strategy" },
          { id: "calculus-3", prompt: "What is the critical point of f(x) = x squared - 4x + 3?", options: ["x = 1", "x = 2", "x = 3"], correct: "x = 2", fluencyType: "optimization" },
        ],
      },
      fr: {
        items: [
          { id: "calculus-1", prompt: "Quelle est la dérivée de f(x) = x au cube + 2x ?", options: ["3x au carré + 2", "x au carré + 2", "3x au carré + 2x"], correct: "3x au carré + 2", fluencyType: "différentiation" },
          { id: "calculus-2", prompt: "Quelle est l'intégrale de (2x + 3) ?", options: ["x au carré + 3x + C", "2x au carré + 3 + C", "x au carré + 3 + C"], correct: "x au carré + 3x + C", fluencyType: "intégration" },
          { id: "proof-1", prompt: "Pour prouver que la racine carrée de 2 est irrationnelle, la meilleure méthode est :", options: ["Preuve directe", "Preuve par contradiction", "Preuve par récurrence"], correct: "Preuve par contradiction", fluencyType: "stratégie de preuve" },
          { id: "calculus-3", prompt: "Quel est le point critique de f(x) = x au carré - 4x + 3 ?", options: ["x = 1", "x = 2", "x = 3"], correct: "x = 2", fluencyType: "optimisation" },
        ],
      },
      ar: {
        items: [
          { id: "calculus-1", prompt: "ما مشتقة f(x) = x مكعب + 2x؟", options: ["3x تربيع + 2", "x تربيع + 2", "3x تربيع + 2x"], correct: "3x تربيع + 2", fluencyType: "التفاضل" },
          { id: "calculus-2", prompt: "ما تكامل (2x + 3)؟", options: ["x تربيع + 3x + C", "2x تربيع + 3 + C", "x تربيع + 3 + C"], correct: "x تربيع + 3x + C", fluencyType: "التكامل" },
          { id: "proof-1", prompt: "لإثبات أن الجذر التربيعي لـ 2 عدد غير نسبي، أفضل طريقة هي:", options: ["البرهان المباشر", "البرهان بالتناقض", "البرهان بالاستقراء"], correct: "البرهان بالتناقض", fluencyType: "استراتيجية الإثبات" },
          { id: "calculus-3", prompt: "ما النقطة الحرجة لـ f(x) = x تربيع - 4x + 3؟", options: ["x = 1", "x = 2", "x = 3"], correct: "x = 2", fluencyType: "التحسين" },
        ],
      },
    },
  },
  {
    id: "adv-fluency-b",
    content: {
      en: {
        items: [
          { id: "calculus-1", prompt: "What is the derivative of f(x) = sin(x) + cos(x)?", options: ["cos(x) - sin(x)", "-cos(x) + sin(x)", "cos(x) + sin(x)"], correct: "cos(x) - sin(x)", fluencyType: "differentiation" },
          { id: "calculus-2", prompt: "What is the integral of sin(x)?", options: ["cos(x) + C", "-cos(x) + C", "sin(x) + C"], correct: "-cos(x) + C", fluencyType: "integration" },
          { id: "proof-1", prompt: "To prove P(n) holds for all positive integers, the correct approach is:", options: ["Prove P(1) and show P(k) implies P(k+1)", "Prove P(1) and P(n-1) implies P(n) for all n", "Both are equivalent"], correct: "Both are equivalent", fluencyType: "proof by induction" },
          { id: "calculus-3", prompt: "What is the second derivative of f(x) = x to the 4th power?", options: ["4x cubed", "12x squared", "24x"], correct: "12x squared", fluencyType: "higher-order differentiation" },
        ],
      },
      fr: {
        items: [
          { id: "calculus-1", prompt: "Quelle est la dérivée de f(x) = sin(x) + cos(x) ?", options: ["cos(x) - sin(x)", "-cos(x) + sin(x)", "cos(x) + sin(x)"], correct: "cos(x) - sin(x)", fluencyType: "différentiation" },
          { id: "calculus-2", prompt: "Quelle est l'intégrale de sin(x) ?", options: ["cos(x) + C", "-cos(x) + C", "sin(x) + C"], correct: "-cos(x) + C", fluencyType: "intégration" },
          { id: "proof-1", prompt: "Pour prouver P(n) pour tous les entiers positifs, la bonne approche est :", options: ["Prouver P(1) et montrer que P(k) implique P(k+1)", "Prouver P(1) et P(n-1) implique P(n) pour tout n", "Les deux sont équivalentes"], correct: "Les deux sont équivalentes", fluencyType: "récurrence" },
          { id: "calculus-3", prompt: "Quelle est la dérivée seconde de f(x) = x à la puissance 4 ?", options: ["4x au cube", "12x au carré", "24x"], correct: "12x au carré", fluencyType: "dérivation d'ordre supérieur" },
        ],
      },
      ar: {
        items: [
          { id: "calculus-1", prompt: "ما مشتقة f(x) = sin(x) + cos(x)؟", options: ["cos(x) - sin(x)", "-cos(x) + sin(x)", "cos(x) + sin(x)"], correct: "cos(x) - sin(x)", fluencyType: "التفاضل" },
          { id: "calculus-2", prompt: "ما تكامل sin(x)؟", options: ["cos(x) + C", "-cos(x) + C", "sin(x) + C"], correct: "-cos(x) + C", fluencyType: "التكامل" },
          { id: "proof-1", prompt: "لإثبات P(n) لجميع الأعداد الصحيحة الموجبة، الطريقة الصحيحة هي:", options: ["إثبات P(1) وإظهار أن P(k) تستلزم P(k+1)", "إثبات P(1) و P(n-1) تستلزم P(n) لكل n", "كلاهما متكافئ"], correct: "كلاهما متكافئ", fluencyType: "الاستقراء الرياضي" },
          { id: "calculus-3", prompt: "ما المشتقة الثانية لـ f(x) = x للقوة 4؟", options: ["4x مكعب", "12x تربيع", "24x"], correct: "12x تربيع", fluencyType: "التفاضل عالي الرتبة" },
        ],
      },
    },
  },
  {
    id: "adv-fluency-c",
    content: {
      en: {
        items: [
          { id: "calculus-1", prompt: "Using the chain rule, what is the derivative of sin(x squared)?", options: ["cos(x squared)", "2x times cos(x squared)", "2x times sin(x squared)"], correct: "2x times cos(x squared)", fluencyType: "chain rule" },
          { id: "calculus-2", prompt: "What is the definite integral of sin(x) from 0 to pi?", options: ["0", "1", "2"], correct: "2", fluencyType: "definite integration" },
          { id: "proof-1", prompt: "Which is the contrapositive of 'If P then Q'?", options: ["If Q then P", "If not P then not Q", "If not Q then not P"], correct: "If not Q then not P", fluencyType: "logical reasoning" },
          { id: "calculus-3", prompt: "What is the local minimum of f(x) = x cubed - 3x?", options: ["x = -1", "x = 0", "x = 1"], correct: "x = 1", fluencyType: "optimization" },
        ],
      },
      fr: {
        items: [
          { id: "calculus-1", prompt: "En utilisant la règle de la chaîne, quelle est la dérivée de sin(x au carré) ?", options: ["cos(x au carré)", "2x fois cos(x au carré)", "2x fois sin(x au carré)"], correct: "2x fois cos(x au carré)", fluencyType: "règle de la chaîne" },
          { id: "calculus-2", prompt: "Quelle est l'intégrale définie de sin(x) de 0 à pi ?", options: ["0", "1", "2"], correct: "2", fluencyType: "intégration définie" },
          { id: "proof-1", prompt: "Quelle est la contraposée de 'Si P alors Q' ?", options: ["Si Q alors P", "Si non P alors non Q", "Si non Q alors non P"], correct: "Si non Q alors non P", fluencyType: "raisonnement logique" },
          { id: "calculus-3", prompt: "Quel est le minimum local de f(x) = x au cube - 3x ?", options: ["x = -1", "x = 0", "x = 1"], correct: "x = 1", fluencyType: "optimisation" },
        ],
      },
      ar: {
        items: [
          { id: "calculus-1", prompt: "باستخدام قاعدة السلسلة، ما مشتقة sin(x تربيع)؟", options: ["cos(x تربيع)", "2x ضرب cos(x تربيع)", "2x ضرب sin(x تربيع)"], correct: "2x ضرب cos(x تربيع)", fluencyType: "قاعدة السلسلة" },
          { id: "calculus-2", prompt: "ما التكامل المحدد لـ sin(x) من 0 إلى باي؟", options: ["0", "1", "2"], correct: "2", fluencyType: "تكامل محدد" },
          { id: "proof-1", prompt: "ما نقيض القضية 'إذا P إذن Q'؟", options: ["إذا Q إذن P", "إذا لا P إذن لا Q", "إذا لا Q إذن لا P"], correct: "إذا لا Q إذن لا P", fluencyType: "الاستدلال المنطقي" },
          { id: "calculus-3", prompt: "ما الحد الأدنى المحلي لـ f(x) = x مكعب - 3x؟", options: ["x = -1", "x = 0", "x = 1"], correct: "x = 1", fluencyType: "التحسين" },
        ],
      },
    },
  },
];
