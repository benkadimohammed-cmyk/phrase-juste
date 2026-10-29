import { Exercise, Lesson } from "../types/learning";

export const LESSONS_DATA: Lesson[] = [
  {
    id: "les-grammar-articles",
    title: {
      fr: "Articles partitifs et adverbes de quantité",
      en: "Partitive Articles & Expressions of Quantity",
      ar: "أدوات التبعيض وظروف الكمية (du, de la, beaucoup de)",
    },
    FrenchSubtitle: "Du, de la, des → beaucoup de, pas de",
    category: "grammar",
    level: "A1",
    durationMinutes: 6,
    summary: {
      fr: "Savoir quand utiliser « du / de la / des » et quand les remplacer par « de » après une négation ou une quantité.",
      en: "Learn when to use 'du / de la / des' and why they reduce to bare 'de' after negation or quantity expressions.",
      ar: "تعلّم متى تستخدم du / de la / des ومتى تتحول إلى de فقط بعد النفي أو ظروف الكمية.",
    },
    rules: [
      {
        heading: {
          fr: "1. L'article partitif pour une quantité non comptable",
          en: "1. Partitive articles for uncountable quantities",
          ar: "١. أدوات التبعيض للكميات غير المعدودة",
        },
        explanation: {
          fr: "Devant un nom non comptable, le français exige un article partitif : du (masculin), de la (féminin), de l' (voyelle), des (pluriel).",
          en: "Before uncountable or unspecified quantities, French requires 'du', 'de la', 'de l'', or 'des'.",
          ar: "قبل الأسماء غير المعدودة، تتطلب الفرنسية أداة تبعيض: du للمذكر، de la للمؤنث، و des للجمع.",
        },
        exampleFrench: "Je prends du café et de la confiture le matin.",
        exampleTranslation: {
          fr: "Quantité indéterminée (masculin : du, féminin : de la).",
          en: "I have (some) coffee and jam in the morning.",
          ar: "أتناول القهوة والمربى في الصباح.",
        },
      },
      {
        heading: {
          fr: "2. Réduction à « de / d' » après une quantité ou une négation",
          en: "2. Reduction to 'de / d'' after quantity or negation",
          ar: "٢. التحول إلى de بعد ظروف الكمية أو النفي",
        },
        explanation: {
          fr: "Après beaucoup, trop, peu, assez, ou après « ne ... pas », l'article partitif devient toujours « de » ou « d' ».",
          en: "After adverbs of quantity (beaucoup, trop, peu, assez) or negation (ne...pas), always use 'de' instead of 'des/du/de la'.",
          ar: "بعد ظروف الكمية مثل beaucoup أو بعد النفي ne...pas نستخدم de فقط بدون أداة تعريف.",
        },
        exampleFrench: "Il a beaucoup d'amis, mais il n'a pas de patience.",
        exampleTranslation: {
          fr: "Jamais « beaucoup des amis » ni « pas de la patience ».",
          en: "He has many friends, but he has no patience.",
          ar: "لديه الكثير من الأصدقاء، لكن ليس لديه صبر.",
        },
      },
    ],
    commonMistakes: [
      {
        wrong: "J'ai beaucoup des problèmes à résoudre.",
        right: "J'ai beaucoup de problèmes à résoudre.",
        why: {
          fr: "Après « beaucoup », on emploie toujours « de » sans article défini.",
          en: "After 'beaucoup', use 'de' rather than 'des'.",
          ar: "بعد كلمة beaucoup نستخدم de دائماً وليس des.",
        },
      },
      {
        wrong: "Je ne bois pas du lait.",
        right: "Je ne bois pas de lait.",
        why: {
          fr: "Dans une phrase négative, « du / de la / des » se transforment en « de ».",
          en: "In negative sentences, partitive articles become 'de'.",
          ar: "في الجملة المنفية تتحول du و de la و des إلى de.",
        },
      },
    ],
  },
  {
    id: "les-mistakes-visiter",
    title: {
      fr: "Faux amis et collocations essentielles",
      en: "Precision Verbs: Visiter, Prendre, Avoir",
      ar: "الأفعال الدقيقة والأخطاء الشائعة (Visiter, Prendre, Avoir)",
    },
    FrenchSubtitle: "Rendre visite à, prendre une décision, avoir faim",
    category: "mistakes",
    level: "A2",
    durationMinutes: 7,
    summary: {
      fr: "Évitez les calques directs : distinguez « visiter un lieu » et « rendre visite à une personne », ou encore « prendre une décision ».",
      en: "Avoid direct English/Arabic calques: master 'rendre visite à', 'prendre une décision', and physical states with 'avoir'.",
      ar: "تجنب الترجمة الحرفية الخاطئة: فرّق بين زيارة مكان وزيارة شخص، وتعبيرات الفعل avoir.",
    },
    rules: [
      {
        heading: {
          fr: "1. Visiter un lieu vs. Rendre visite à quelqu'un",
          en: "1. Visiter (a place) vs. Rendre visite à (a person)",
          ar: "١. زيارة مكان (visiter) مقابل زيارة شخص (rendre visite à)",
        },
        explanation: {
          fr: "Le verbe « visiter » s'utilise uniquement pour les musées, villes ou monuments. Pour une personne, dites « rendre visite à » ou « aller voir ».",
          en: "Never use 'visiter' with people. Use 'rendre visite à quelqu'un' or 'aller voir quelqu'un'.",
          ar: "الفعل visiter يُستخدم للأماكن فقط. أما مع الأشخاص فنقول rendre visite à.",
        },
        exampleFrench: "Nous avons visité Lyon et nous avons rendu visite à notre oncle.",
        exampleTranslation: {
          fr: "Visiter + ville / Rendre visite à + personne.",
          en: "We visited Lyon and we visited our uncle.",
          ar: "زرنا مدينة ليون وزرنا عمنا.",
        },
      },
      {
        heading: {
          fr: "2. Les états physiques et l'âge avec « avoir »",
          en: "2. Physical states and age take 'avoir', never 'être'",
          ar: "٢. الحالات الجسدية والعمر تُستخدم مع الفعل avoir",
        },
        explanation: {
          fr: "On dit : avoir faim, avoir soif, avoir froid, avoir chaud, avoir peur, avoir raison, avoir 25 ans.",
          en: "French expresses hunger, thirst, cold, fear, being right, and age with 'avoir' (to have).",
          ar: "في الفرنسية نعبر عن الجوع والعطش والبرد والخوف والعمر باستخدام الفعل avoir.",
        },
        exampleFrench: "J'ai froid et j'ai très faim après cette longue marche.",
        exampleTranslation: {
          fr: "Auxiliaire avoir + nom sans article.",
          en: "I am cold and very hungry after this long walk.",
          ar: "أشعر بالبرد والجوع الشديد بعد هذا المشي الطويل.",
        },
      },
    ],
    commonMistakes: [
      {
        wrong: "Hier, j'ai visité mes grands-parents.",
        right: "Hier, j'ai rendu visite à mes grands-parents.",
        why: {
          fr: "On ne « visite » pas une personne comme un monument.",
          en: "Use 'rendre visite à' when visiting people.",
          ar: "مع الأشخاص نستخدم rendre visite à وليس visiter.",
        },
      },
      {
        wrong: "Il faut faire une décision rapidement.",
        right: "Il faut prendre une décision rapidement.",
        why: {
          fr: "En français, une décision se « prend », elle ne se « fait » pas.",
          en: "French uses 'prendre une décision', never 'faire une décision'.",
          ar: "في الفرنسية نقول prendre une décision (اتخاذ قرار).",
        },
      },
    ],
  },
  {
    id: "les-conjugation-past",
    title: {
      fr: "Passé composé et Imparfait : l'équilibre du récit",
      en: "Passé Composé vs. Imparfait in Storytelling",
      ar: "الفرق بين الماضي المركب (Passé composé) والماضي الناقص (Imparfait)",
    },
    FrenchSubtitle: "Action ponctuelle vs. description et habitude",
    category: "conjugation",
    level: "A2",
    durationMinutes: 9,
    summary: {
      fr: "Choisissez avec justesse entre l'action qui fait avancer l'histoire (passé composé) et le décor ou l'habitude (imparfait).",
      en: "Distinguish foreground completed events (passé composé) from background descriptions and habits (imparfait).",
      ar: "ميّز بدقة بين الحدث المكتمل والمحدد (Passé composé) وبين الوصف والعادات المستمرة في الماضي (Imparfait).",
    },
    rules: [
      {
        heading: {
          fr: "1. Le passé composé : événement délimité et premier plan",
          en: "1. Passé composé: Completed, bounded events",
          ar: "١. الماضي المركب للأحداث المحددة والمكتملة",
        },
        explanation: {
          fr: "Utilisez le passé composé pour une action soudaine, datée ou achevée dans le passé.",
          en: "Use passé composé for actions with a clear beginning/end or a sudden interruption.",
          ar: "يُستخدم للحدث الذي وقع وانتهى في وقت محدد أو قطع حدثاً آخر.",
        },
        exampleFrench: "Tout à coup, la lumière s'est éteinte.",
        exampleTranslation: {
          fr: "Action soudaine et achevée.",
          en: "Suddenly, the light went out.",
          ar: "فجأة، انطفأ الضوء.",
        },
      },
      {
        heading: {
          fr: "2. L'imparfait : arrière-plan, description et habitude",
          en: "2. Imparfait: Background, weather, and past habits",
          ar: "٢. الماضي الناقص للوصف، الخلفية، والعادات المتكررة",
        },
        explanation: {
          fr: "L'imparfait peint le décor (météo, état d'esprit, action en cours) ou exprime une habitude (« tous les étés », « autrefois »).",
          en: "Use imparfait for ongoing states ('was doing') and repeated habits ('used to do').",
          ar: "يُستخدم لوصف المشهد أو حالة الطقس أو فعل كان مستمراً حين قاطعه حدث آخر.",
        },
        exampleFrench: "Il neigeait fort quand le train est arrivé en gare.",
        exampleTranslation: {
          fr: "Il neigeait (décor à l'imparfait) + est arrivé (événement au passé composé).",
          en: "It was snowing hard when the train arrived at the station.",
          ar: "كانت تثلج بغزارة عندما وصل القطار إلى المحطة.",
        },
      },
    ],
    commonMistakes: [
      {
        wrong: "Hier, elle est arrivée en retard parce qu'il a plu toute la matinée.",
        right: "Hier, elle est arrivée en retard parce qu'il pleuvait.",
        why: {
          fr: "La météo qui sert de circonstance ou de décor s'exprime à l'imparfait.",
          en: "Ongoing background weather conditions take the imparfait.",
          ar: "وصف حالة الجو كخلفية للحدث يكون في زمن Imparfait.",
        },
      },
    ],
  },
  {
    id: "les-vocabulary-prepositions",
    title: {
      fr: "Verbes et prépositions : à, de ou rien ?",
      en: "Verb + Preposition Mastery (à, de, or zero)",
      ar: "الأفعال وحروف الجر المناسبة لها (à / de / بدون حرف جر)",
    },
    FrenchSubtitle: "Penser à, décider de, chercher quelque chose",
    category: "vocabulary",
    level: "B1",
    durationMinutes: 8,
    summary: {
      fr: "Maîtrisez la construction des verbes courants pour éviter les prépositions superflues ou erronées.",
      en: "Learn which French verbs require 'à', which take 'de', and which take a direct object with no preposition.",
      ar: "تعرّف على الأفعال التي تتطلب حرف الجر à أو de، والأفعال التي تأخذ مفعولاً مباشراً بدون حرف جر.",
    },
    rules: [
      {
        heading: {
          fr: "1. Verbes directs en français (sans préposition)",
          en: "1. Direct transitive verbs in French (no preposition!)",
          ar: "١. أفعال لا تأخذ حرف جر في الفرنسية",
        },
        explanation: {
          fr: "Contrairement à l'anglais, « chercher » (look for), « attendre » (wait for), « écouter » (listen to) et « regarder » (look at) s'utilisent SANS préposition.",
          en: "Unlike English, 'chercher', 'attendre', 'écouter', and 'regarder' never take a preposition before their object.",
          ar: "الأفعال chercher (يبحث عن)، attendre (ينتظر)، écouter (يستمع إلى) لا تأخذ حرف جر في الفرنسية.",
        },
        exampleFrench: "J'attends le bus en écoutant la radio.",
        exampleTranslation: {
          fr: "Jamais « attendre pour le bus » ni « écouter à la radio ».",
          en: "I am waiting for the bus while listening to the radio.",
          ar: "أنتظر الحافلة وأنا أستمع إلى المذياع.",
        },
      },
      {
        heading: {
          fr: "2. Décider de, essayer de, réussir à, aider à",
          en: "2. Infinitive linkers: 'de' vs. 'à'",
          ar: "٢. الربط مع المصدر باستخدام de أو à",
        },
        explanation: {
          fr: "On dit : décider de faire, essayer de faire, oublier de faire — mais : réussir à faire, aider quelqu'un à faire, commencer à faire.",
          en: "Memorize the verb alongside its linker: 'décider de + inf', 'réussir à + inf'.",
          ar: "نقول décider de + مصدر، بينما نقول réussir à + مصدر و aider à + مصدر.",
        },
        exampleFrench: "Elle a enfin réussi à résoudre ce problème complexe.",
        exampleTranslation: {
          fr: "Réussir à + infinitif.",
          en: "She finally succeeded in solving this complex problem.",
          ar: "نجحت أخيراً في حل هذه المشكلة المعقدة.",
        },
      },
    ],
    commonMistakes: [
      {
        wrong: "Je cherche pour mes clés depuis dix minutes.",
        right: "Je cherche mes clés depuis dix minutes.",
        why: {
          fr: "Le verbe « chercher » inclut déjà l'idée de « pour ».",
          en: "'Chercher' means 'to look for'—never add 'pour'.",
          ar: "الفعل chercher يتضمن معنى «عن» ولا نضع بعده pour.",
        },
      },
    ],
  },
  {
    id: "les-construction-subjonctif",
    title: {
      fr: "Concession et Subjonctif : Bien que vs Malgré",
      en: "Subjunctive & Concession: Bien que vs. Malgré",
      ar: "التعبير عن التنازل وصيغة المنصوب (Bien que مقابل Malgré)",
    },
    FrenchSubtitle: "Bien qu'il soit tard / Malgré le retard",
    category: "construction",
    level: "B2",
    durationMinutes: 10,
    summary: {
      fr: "Structurez vos phrases complexes avec élégance en distinguant « malgré + nom » et « bien que + subjonctif ».",
      en: "Build sophisticated complex sentences by pairing 'malgré' with nouns and 'bien que' with the subjunctive mood.",
      ar: "صِغ جملاً متقدمة وأنيقة بالتفريق بين malgré المتبوعة باسم و bien que المتبوعة بصيغة المنصوب (Subjonctif).",
    },
    rules: [
      {
        heading: {
          fr: "1. « Malgré » est suivi d'un nom ou d'un pronom",
          en: "1. 'Malgré' is followed strictly by a noun phrase",
          ar: "١. كلمة Malgré يتبعها اسم دائماً",
        },
        explanation: {
          fr: "En français soigné, n'utilisez jamais « malgré que ». Placez un groupe nominal directement après « malgré ».",
          en: "Never write 'malgré que' in standard French. Follow 'malgré' with a noun.",
          ar: "تجنب قول malgré que في الفرنسية الفصيحة؛ ضع اسماً مباشرة بعد malgré.",
        },
        exampleFrench: "Malgré la fatigue, il a terminé sa présentation.",
        exampleTranslation: {
          fr: "Malgré + nom (la fatigue).",
          en: "Despite the fatigue, he finished his presentation.",
          ar: "رغم التعب، أنهى عرضه التقديمي.",
        },
      },
      {
        heading: {
          fr: "2. « Bien que » et « Quoique » exigent le subjonctif",
          en: "2. 'Bien que' and 'Quoique' require the subjunctive",
          ar: "٢. عبارة Bien que تتطلب دائماً صيغة Subjonctif",
        },
        explanation: {
          fr: "Pour introduire un verbe conjugué exprimant une concession, utilisez « bien que » suivi du subjonctif.",
          en: "When followed by a subject and verb, use 'bien que' + subjunctive mood.",
          ar: "عند وجود فاعل وفعل، نستخدم bien que مع تصريف الفعل في الـ Subjonctif.",
        },
        exampleFrench: "Bien qu'il fasse froid, la terrasse du café est pleine.",
        exampleTranslation: {
          fr: "Faire au subjonctif présent : qu'il fasse.",
          en: "Although it is cold, the café terrace is full.",
          ar: "رغم أن الجو بارد، فإن شرفة المقهى ممتلئة.",
        },
      },
    ],
    commonMistakes: [
      {
        wrong: "Malgré qu'il pleut, nous sortons.",
        right: "Bien qu'il pleuve, nous sortons.",
        why: {
          fr: "Remplacez « malgré que » par « bien que » + subjonctif (« pleuve »).",
          en: "Replace 'malgré que' with 'bien que' + subjunctive ('pleuve').",
          ar: "استبدل malgré que بـ bien que مع تصريف الفعل في المنصوب (pleuve).",
        },
      },
    ],
  },
];

export const EXERCISES_DATA: Exercise[] = [
  {
    id: "ex-mc-1",
    lessonId: "les-grammar-articles",
    category: "grammar",
    level: "A1",
    type: "multiple-choice",
    prompt: {
      fr: "Complétez avec la forme exacte après l'adverbe de quantité :",
      en: "Choose the correct form after the adverb of quantity:",
      ar: "اختر الصيغة الصحيحة بعد ظرف الكمية:",
    },
    sentenceContext: "Dans ce quartier, il y a beaucoup ___ parcs verdoyants.",
    options: ["de", "des", "du", "de les"],
    correctAnswer: "de",
    explanation: {
      fr: "Après « beaucoup », « trop », « peu » ou « assez », l'article pluriel « des » se réduit toujours à « de ».",
      en: "After adverbs of quantity like 'beaucoup', always use 'de' (never 'des').",
      ar: "بعد ظروف الكمية مثل beaucoup نستخدم دائماً de وليس des.",
    },
    grammarRuleTag: "Adverbes de quantité + de",
  },
  {
    id: "ex-fb-1",
    lessonId: "les-grammar-articles",
    category: "grammar",
    level: "A1",
    type: "fill-blank",
    prompt: {
      fr: "Complétez la phrase négative avec le mot manquant :",
      en: "Complete the negative sentence with the missing word:",
      ar: "أكمل الجملة المنفية بالكلمة الصحيحة:",
    },
    sentenceContext: "Merci, mais je ne prends pas ___ sucre dans mon thé.",
    correctAnswer: "de",
    explanation: {
      fr: "Après une négation (« ne ... pas »), l'article partitif « du » devient « de ».",
      en: "After negation ('ne...pas'), the partitive article 'du' changes to 'de'.",
      ar: "بعد النفي ne...pas تتحول أداة التبعيض du إلى de.",
    },
    grammarRuleTag: "Négation et article partitif",
  },
  {
    id: "ex-cor-1",
    lessonId: "les-mistakes-visiter",
    category: "mistakes",
    level: "A2",
    type: "correction",
    prompt: {
      fr: "Corrigez l'erreur de vocabulaire dans cette phrase :",
      en: "Rewrite this sentence to fix the verb usage mistake:",
      ar: "أعد كتابة الجملة لتصحيح الخطأ في استخدام الفعل:",
    },
    flawedSentence: "Dimanche dernier, j'ai visité ma grand-mère.",
    correctAnswer: "Dimanche dernier, j'ai rendu visite à ma grand-mère.",
    acceptedAnswers: [
      "J'ai rendu visite à ma grand-mère dimanche dernier",
      "Dimanche dernier j'ai rendu visite à ma grand-mère",
    ],
    explanation: {
      fr: "En français, on « visite » un lieu (un musée, une ville), mais on « rend visite à » une personne.",
      en: "Use 'visiter' only for places; for people, use 'rendre visite à'.",
      ar: "نستخدم visiter للأماكن فقط، بينما نستخدم rendre visite à عند زيارة الأشخاص.",
    },
    grammarRuleTag: "Visiter vs. Rendre visite à",
  },
  {
    id: "ex-mc-2",
    lessonId: "les-mistakes-visiter",
    category: "mistakes",
    level: "A1",
    type: "multiple-choice",
    prompt: {
      fr: "Quelle phrase exprime correctement la sensation physique ?",
      en: "Which sentence accurately expresses the physical state in French?",
      ar: "أي جملة تعبّر بشكل صحيح عن الشعور بالبرد في الفرنسية؟",
    },
    sentenceContext: "En hiver à Montréal, ___ quand on attend dehors.",
    options: [
      "on a très froid",
      "on est très froid",
      "on fait très froid",
      "on a le froid",
    ],
    correctAnswer: "on a très froid",
    explanation: {
      fr: "Pour une personne, la sensation de froid ou de faim s'exprime avec « avoir » : avoir froid, avoir faim.",
      en: "People feel cold using 'avoir froid' ('être froid' means having a cold personality, and 'il fait froid' describes the weather).",
      ar: "التعبير عن شعور الشخص بالبرد يكون باستخدام الفعل avoir (avoir froid).",
    },
    grammarRuleTag: "Avoir froid / faim / peur",
  },
  {
    id: "ex-tr-1",
    lessonId: "les-mistakes-visiter",
    category: "mistakes",
    level: "A2",
    type: "translation",
    prompt: {
      fr: "Assemblez les mots pour former la phrase juste :",
      en: "Arrange the words to build the accurate French sentence:",
      ar: "رتّب الكلمات لتكوين الجملة الفرنسية الصحيحة:",
    },
    sourceSentence: {
      fr: "Idée : Il faut prendre une décision aujourd'hui (et non « faire »).",
      en: "We must make a decision today.",
      ar: "يجب علينا اتخاذ قرار اليوم.",
    },
    wordBank: [
      "Nous",
      "devons",
      "prendre",
      "une",
      "décision",
      "aujourd'hui",
      "faire",
    ],
    correctAnswer: "Nous devons prendre une décision aujourd'hui",
    explanation: {
      fr: "La collocation exacte est « prendre une décision » (jamais « faire une décision »).",
      en: "In French, you always 'take' a decision ('prendre une décision').",
      ar: "في الفرنسية نقول دائماً prendre une décision وليس faire une décision.",
    },
    grammarRuleTag: "Collocation : prendre une décision",
  },
  {
    id: "ex-mc-3",
    lessonId: "les-conjugation-past",
    category: "conjugation",
    level: "A2",
    type: "multiple-choice",
    prompt: {
      fr: "Choisissez le couple de temps qui respecte la logique du récit :",
      en: "Select the tense pair that matches the narrative logic:",
      ar: "اختر الزوج الزمني الصحيح لسياق القصة:",
    },
    sentenceContext: "Je ___ tranquillement quand le téléphone ___.",
    options: [
      "dormais / a sonné",
      "ai dormi / sonnait",
      "dormais / sonnait",
      "ai dormi / a sonné",
    ],
    correctAnswer: "dormais / a sonné",
    explanation: {
      fr: "L'action en cours (« je dormais ») est à l'imparfait ; l'événement soudain qui l'interrompt (« a sonné ») est au passé composé.",
      en: "The ongoing background action ('dormais') takes imparfait; the sudden interrupting event ('a sonné') takes passé composé.",
      ar: "الفعل المستمر في الخلفية (dormais) يوضع في Imparfait، والحدث المفاجئ (a sonné) في Passé composé.",
    },
    grammarRuleTag: "Imparfait + Passé composé",
  },
  {
    id: "ex-fb-2",
    lessonId: "les-conjugation-past",
    category: "conjugation",
    level: "A2",
    type: "fill-blank",
    prompt: {
      fr: "Conjuguez le verbe « aller » au passé composé (accord au féminin singulier) :",
      en: "Conjugate 'aller' in passé composé for a feminine singular subject:",
      ar: "صرّف الفعل aller في الماضي المركب مع مراعاة المطابقة للمؤنث المفرد:",
    },
    sentenceContext: "Marie est ___ à la bibliothèque ce matin.",
    correctAnswer: "allée",
    explanation: {
      fr: "Avec l'auxiliaire « être », le participe passé s'accorde avec le sujet « Marie » (féminin singulier → allée).",
      en: "With the auxiliary 'être', the past participle agrees with the feminine singular subject 'Marie' ('allée').",
      ar: "مع المساعد être يطابق اسم المفعول الفاعل المؤنث المفرد (Marie → allée).",
    },
    grammarRuleTag: "Accord du participe passé avec être",
  },
  {
    id: "ex-cor-2",
    lessonId: "les-vocabulary-prepositions",
    category: "vocabulary",
    level: "B1",
    type: "correction",
    prompt: {
      fr: "Supprimez la préposition fautive dans cette phrase :",
      en: "Fix the preposition error in this sentence:",
      ar: "صحح الخطأ في حرف الجر داخل هذه الجملة:",
    },
    flawedSentence: "J'attends pour le train depuis vingt minutes.",
    correctAnswer: "J'attends le train depuis vingt minutes.",
    acceptedAnswers: ["J'attends le train depuis 20 minutes"],
    explanation: {
      fr: "Le verbe « attendre » est transitif direct en français : on attend quelqu'un ou quelque chose (sans « pour »).",
      en: "'Attendre' already means 'to wait for' and takes a direct object without 'pour'.",
      ar: "الفعل attendre يتعدى مباشرة بدون حرف الجر pour.",
    },
    grammarRuleTag: "Verbes transitifs directs",
  },
  {
    id: "ex-mc-4",
    lessonId: "les-vocabulary-prepositions",
    category: "vocabulary",
    level: "B1",
    type: "multiple-choice",
    prompt: {
      fr: "Quelle préposition relie le verbe « réussir » à l'infinitif ?",
      en: "Which preposition links 'réussir' to a following infinitive?",
      ar: "ما هو حرف الجر الصحيح بعد الفعل réussir قبل المصدر؟",
    },
    sentenceContext: "Après trois essais, il a réussi ___ convaincre le jury.",
    options: ["à", "de", "pour", "en"],
    correctAnswer: "à",
    explanation: {
      fr: "On construit toujours « réussir à + infinitif » (contrairement à « décider de + infinitif »).",
      en: "The verb 'réussir' always takes 'à' before an infinitive ('réussir à faire quelque chose').",
      ar: "الفعل réussir يرتبط دائماً بحرف الجر à قبل الفعل في المصدر.",
    },
    grammarRuleTag: "Réussir à + infinitif",
  },
  {
    id: "ex-cor-3",
    lessonId: "les-construction-subjonctif",
    category: "construction",
    level: "B2",
    type: "correction",
    prompt: {
      fr: "Remplacez la tournure fautive « Malgré que + indicatif » par la forme soutenue avec « Bien que » :",
      en: "Rewrite this sentence using 'Bien que' and the proper subjunctive verb form:",
      ar: "أعد صياغة الجملة باستبدال Malgré que بعبارة Bien que مع تصريف الفعل في المنصوب:",
    },
    flawedSentence: "Malgré qu'il pleut, nous allons courir.",
    correctAnswer: "Bien qu'il pleuve, nous allons courir.",
    explanation: {
      fr: "« Malgré » ne s'emploie qu'avec un nom. Devant un verbe conjugué, utilisez « Bien que » suivi du subjonctif (« qu'il pleuve »).",
      en: "Use 'Bien que' + subjunctive ('pleuve') before a conjugated clause.",
      ar: "نستخدم Bien que متبوعة بصيغة المنصوب (pleuve) بدلاً من malgré que.",
    },
    grammarRuleTag: "Bien que + subjonctif",
  },
  {
    id: "ex-fb-3",
    lessonId: "les-construction-subjonctif",
    category: "construction",
    level: "B2",
    type: "fill-blank",
    prompt: {
      fr: "Conjuguez le verbe « être » au subjonctif présent :",
      en: "Conjugate 'être' in the present subjunctive:",
      ar: "صرّف الفعل être في صيغة المضارع المنصوب (Subjonctif):",
    },
    sentenceContext: "Il est essentiel que vous ___ prêts avant midi.",
    correctAnswer: "soyez",
    explanation: {
      fr: "Après « Il est essentiel que », on emploie le subjonctif. Pour « vous », le verbe être donne « soyez ».",
      en: "Impersonal expressions of necessity ('Il est essentiel que') trigger the subjunctive: 'que vous soyez'.",
      ar: "بعد عبارات الضرورة نستخدم صيغة المنصوب: que vous soyez.",
    },
    grammarRuleTag: "Subjonctif présent d'être",
  },
  {
    id: "ex-tr-2",
    lessonId: "les-construction-subjonctif",
    category: "construction",
    level: "B1",
    type: "translation",
    prompt: {
      fr: "Ordonnez les mots pour former une concession avec « Malgré » :",
      en: "Order the words to express concession using 'Malgré':",
      ar: "رتّب الكلمات لتكوين جملة صحيحة باستخدام Malgré:",
    },
    sourceSentence: {
      fr: "Idée : Malgré un groupe nominal (le vent glacial), ils continuent.",
      en: "Despite the freezing wind, they continue their journey.",
      ar: "رغم الرياح الجليدية، يواصلون رحلتهم.",
    },
    wordBank: [
      "Malgré",
      "le",
      "vent",
      "glacial,",
      "ils",
      "continuent",
      "leur",
      "route",
    ],
    correctAnswer: "Malgré le vent glacial, ils continuent leur route",
    explanation: {
      fr: "« Malgré » est immédiatement suivi du groupe nominal « le vent glacial ».",
      en: "'Malgré' is directly followed by the noun phrase 'le vent glacial'.",
      ar: "يتبع Malgré اسم مباشر (le vent glacial).",
    },
    grammarRuleTag: "Malgré + groupe nominal",
  },
];
