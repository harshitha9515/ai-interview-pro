import { Question, InterviewType } from '../types/interview';
import { getLanguageConfig, SupportedLanguageId } from '../config/languages';
import { QUESTION_BANK as DEFAULT_EN_QUESTIONS } from './questionBank';

// ============================================================================
// TELUGU (తెలుగు) QUESTION BANK
// ============================================================================
export const TELUGU_QUESTION_BANK: Question[] = [
  // --- HR / Behavioral ---
  {
    id: 'hr-1-te',
    category: 'hr',
    difficulty: 'beginner',
    question: 'మీ గురించి, మీ విద్యా నేపథ్యం మరియు ఈ ఉద్యోగ పాత్రపై మీకు ఎందుకు ఆసక్తి ఉందో వివరించండి.',
    contextHint: '2 నిమిషాల్లో ముగించండి. గత విద్యా రికార్డు, ప్రస్తుత ప్రాజెక్టులు, మరియు భవిష్యత్ లక్ష్యాలను (Past, Present, Future) క్రమంగా చెప్పండి.',
    expectedKeywords: ['విద్య', 'విద్యా నేపథ్యం', 'నైపుణ్యాలు', 'ప్రాజెక్టులు', 'సాంకేతిక ఆసక్తి', 'లక్ష్యం', 'కంప్యూటర్ సైన్స్', 'education', 'skills', 'projects', 'passion'],
    modelAnswer: 'నేను కంప్యూటర్ సైన్స్ అండ్ ఇంజనీరింగ్‌లో బలమైన పునాదిని కలిగి ఉన్నాను మరియు ఫుల్-స్టాక్ వెబ్ డెవలప్‌మెంట్‌లో ప్రాక్టికల్ ప్రాజెక్ట్‌లు చేశాను. ఆధునిక వెబ్ టెక్నాలజీలు మరియు క్లౌడ్ సర్వీసెస్‌ను ఉపయోగించి రియల్-వరల్డ్ సమస్యలకు పరిష్కారాలను నిర్మించడంలో నాకు ఆసక్తి ఉంది. మీ సంస్థ అందించే వృద్ధి అవకాశాలు, ఉత్తమ ఇంజనీరింగ్ విధానాలు మరియు స్కేలబుల్ సాఫ్ట్‌వేర్ అభివృద్ధి నన్ను ఎంతగానో ఆకర్షించాయి.',
    rubricCriteria: [
      { criterion: 'నిర్మాణం & ప్రవాహం (Structure)', weight: 30, description: 'విద్యా నేపథ్యం నుండి ప్రాజెక్ట్‌లకు స్పష్టమైన అనుసంధానం.' },
      { criterion: 'ఉద్యోగానికి సరిపోలిక (Relevance)', weight: 40, description: 'పాత్ర పట్ల ఆసక్తి మరియు వ్యక్తిగత నైపుణ్యాల సమన్వయం.' },
      { criterion: 'స్పష్టత & భావ వ్యక్తీకరణ (Clarity)', weight: 30, description: 'స్పష్టమైన వాక్చాతుర్యం మరియు ఆత్మవిశ్వాసం.' }
    ]
  },
  {
    id: 'hr-2-te',
    category: 'hr',
    difficulty: 'intermediate',
    question: 'ప్రాజెక్ట్ చేస్తున్నప్పుడు సహోద్యోగితో లేదా టీమ్ లీడ్‌తో భిన్నాభిప్రాయం ఏర్పడిన సందర్భాన్ని వివరించండి. మీరు దాన్ని ఎలా పరిష్కరించారు?',
    contextHint: 'STAR పద్ధతిని వాడండి: Situation (పరిస్థితి), Task (పని), Action (చర్య), Result (ఫలితం). వ్యక్తిగత ఆరోపణలు లేకుండా నిర్మాణాత్మక చర్చను సూచించండి.',
    expectedKeywords: ['పరిస్థితి', 'భిన్నాభిప్రాయం', 'చర్చ', 'డేటా', 'సమస్య పరిష్కారం', 'బృందం', 'STAR', 'collaboration', 'solution', 'compromise'],
    modelAnswer: 'మా చివరి సంవత్సరం ప్రాజెక్ట్ సమయంలో, రియల్-టైమ్ అప్‌డేట్స్ కోసం REST API వాడాలా లేదా GraphQL వాడాలా అనే అంశంపై మా బృందంలో అభిప్రాయ భేదం వచ్చింది. నేను ఇరువైపులా ఉన్న లాభనష్టాలు మరియు ప్రాజెక్ట్ గడువును బేరీజు వేసే కంపారిజన్ మ్యాట్రిక్స్ తయారు చేశాను. దాని ద్వారా మా అవసరాలకు REST సరిపోతుందని నిరూపించాను. ఫలితంగా ప్రాజెక్ట్‌ను గడువుకు మూడు రోజుల ముందే విజయవంతంగా పూర్తి చేశాము.',
    rubricCriteria: [
      { criterion: 'STAR పద్ధతి', weight: 40, description: 'స్పష్టమైన పరిస్థితి, కార్యాచరణ మరియు కొలవగల ఫలితం.' },
      { criterion: 'భావోద్వేగ పరిపక్వత', weight: 35, description: 'సహకార ధోరణి మరియు సమస్య పరిష్కార దృక్పథం.' },
      { criterion: 'ప్రాజెక్ట్ ప్రయోజనం', weight: 25, description: 'పరిష్కారం ప్రాజెక్ట్ నాణ్యతను ఎలా పెంచిందో వివరించడం.' }
    ]
  },

  // --- Technical Depth ---
  {
    id: 'tech-1-te',
    category: 'technical',
    difficulty: 'intermediate',
    question: 'RESTful API ల యొక్క ముఖ్య సూత్రాలు ఏమిటి? మరియు GET, POST, PUT, DELETE వంటి HTTP పద్ధతుల మధ్య ప్రధాన వ్యత్యాసాలను వివరించండి.',
    contextHint: 'స్టేట్‌లెస్ స్వభావం (Statelessness), ఐడెంపోటెన్సీ (Idempotency), మరియు సరైన HTTP స్టేటస్ కోడ్‌లను ప్రస్తావించండి.',
    expectedKeywords: ['REST', 'stateless', 'idempotent', 'GET', 'POST', 'PUT', 'DELETE', 'HTTP methods', 'status codes', 'resources', 'క్లయింట్ సర్వర్'],
    modelAnswer: 'REST అనగా రిప్రజెంటేషనల్ స్టేట్ ట్రాన్స్‌ఫర్. దీని ముఖ్య సూత్రాలు: క్లయింట్-సర్వర్ విభజన, స్టేట్‌లెస్ స్వభావం, క్యాషింగ్ సపోర్ట్, మరియు యూనిఫామ్ ఇంటర్‌ఫేస్. GET డేటాను రీడ్ చేయడానికి వాడతారు మరియు ఇది ఐడెంపోటెంట్; POST కొత్త రిసోర్స్‌ను క్రియేట్ చేయడానికి వాడతారు; PUT రిసోర్స్‌ను పూర్తిగా అప్‌డేట్ చేయడానికి వాడతారు; DELETE రిసోర్స్‌ను తొలగించడానికి వాడతారు.',
    rubricCriteria: [
      { criterion: 'ఆర్కిటెక్చరల్ సూత్రాలు', weight: 35, description: 'Statelessness, caching, మరియు uniform interface ల వివరణ.' },
      { criterion: 'HTTP పద్ధతుల వ్యత్యాసం', weight: 40, description: 'Idempotency మరియు CRUD ఆపరేషన్లతో పోలిక.' },
      { criterion: 'సాంకేతిక ఖచ్చితత్వం', weight: 25, description: 'సరైన పదజాలం మరియు స్టేటస్ కోడ్‌ల స్పష్టత.' }
    ]
  },
  {
    id: 'tech-2-te',
    category: 'technical',
    difficulty: 'intermediate',
    question: 'ఆబ్జెక్ట్ ఓరియెంటెడ్ ప్రోగ్రామింగ్ (OOP) యొక్క నాలుగు మూలస్తంభాలు ఏమిటి? వాస్తవ ప్రాజెక్ట్ ఉదాహరణతో వివరించండి.',
    contextHint: 'ఎన్‌క్యాప్సులేషన్, అబ్‌స్ట్రాక్షన్, ఇన్హెరిటెన్స్, పాలిమార్ఫిజం లను కోడ్ డిజైన్ సందర్భంలో వివరించండి.',
    expectedKeywords: ['Encapsulation', 'Abstraction', 'Inheritance', 'Polymorphism', 'ఎన్‌క్యాప్సులేషన్', 'ఇన్హెరిటెన్స్', 'పాలిమార్ఫిజం', 'తరగతి', 'ఆబ్జెక్ట్', 'class', 'interface'],
    modelAnswer: 'OOP లో నాలుగు ముఖ్య స్తంభాలు ఉన్నాయి: 1. ఎన్‌క్యాప్సులేషన్: డేటా మరియు మెథడ్స్‌ను ఒకే యూనిట్‌గా బంధించి, ప్రైవేట్ ఫీల్డ్స్ ద్వారా రక్షణ కల్పించడం. 2. అబ్‌స్ట్రాక్షన్: అంతర్గత సంక్లిష్టతను దాచిపెట్టి కేవలం అవసరమైన ఇంటర్‌ఫేస్‌ను మాత్రమే చూపించడం. 3. ఇన్హెరిటెన్స్: ఒక క్లాస్ నుండి మరొక క్లాస్‌కు లక్షణాలను పునర్వినియోగించడం. 4. పాలిమార్ఫిజం: ఒకే మెథడ్ పేరుతో భిన్నమైన ప్రవర్తనను చూపించడం (ఓవర్‌లోడింగ్ మరియు ఓవర్‌రైడింగ్).',
    rubricCriteria: [
      { criterion: 'భావనల స్పష్టత', weight: 40, description: 'నాలుగు స్తంభాల సరైన నిర్వచనం మరియు ప్రాముఖ్యత.' },
      { criterion: 'ప్రాక్టికల్ ఉదాహరణ', weight: 35, description: 'రియల్ వరల్డ్ అప్లికేషన్‌లో వీటి వినియోగం.' },
      { criterion: 'కోడ్ రీయూజబిలిటీ', weight: 25, description: 'క్లీన్ కోడ్ డిజైన్ ప్రయోజనాలను వివరించడం.' }
    ]
  },

  // --- Coding & Algorithmic Logic ---
  {
    id: 'coding-1-te',
    category: 'coding',
    difficulty: 'intermediate',
    question: 'ఒక పూర్ణాంకాల శ్రేణి (Array) లో రెండు సంఖ్యల మొత్తం ఒక నిర్దిష్ట Target కు సమానమైతే, ఆ రెండు సంఖ్యల సూచికలను (Indices) కనుగొనే సమర్థవంతమైన అల్గారిథమ్‌ను వివరించండి.',
    contextHint: 'బ్రూట్-ఫోర్స్ O(N²) పద్ధతి కంటే Hash Map ఉపయోగించి O(N) సమయ సంక్లిష్టతలో ఎలా సాధించవచ్చో వివరించండి.',
    expectedKeywords: ['Two Sum', 'Array', 'Hash Map', 'Time Complexity', 'O(N)', 'Space Complexity', 'Target', 'కాంప్లిమెంట్', 'శ్రేణి', 'సూచిక'],
    modelAnswer: 'దీనికి ఉత్తమమైన విధానం Hash Map ఉపయోగించడం. శ్రేణిలోని ప్రతి సంఖ్య x కొరకు, మనం Target - x (కాంప్లిమెంట్) మ్యాప్‌లో ఉందో లేదో తనిఖీ చేస్తాము. అది ఉంటే, ప్రస్తుత ఇండెక్స్ మరియు మ్యాప్‌లోని ఇండెక్స్‌ను జవాబుగా ఇస్తాము. లేకపోతే, ప్రస్తుత సంఖ్యను దాని ఇండెక్స్‌తో సహా మ్యాప్‌లో స్టోర్ చేస్తాము. దీని సమయ సంక్లిష్టత O(N) మరియు స్పేస్ సంక్లిష్టత O(N). బ్రూట్ ఫోర్స్ O(N²) కంటే ఇది అత్యంత వేగవంతమైనది.',
    rubricCriteria: [
      { criterion: 'అల్గారిథమ్ సమర్థత', weight: 45, description: 'Hash Map వినియోగం మరియు O(N) ఆప్టిమైజేషన్.' },
      { criterion: 'ఎడ్జ్ కేసుల పరిశీలన', weight: 30, description: 'ఖాళీ శ్రేణి, నెగటివ్ నంబర్లు, మరియు డూప్లికేట్ల పరిశీలన.' },
      { criterion: 'స్పేస్ & టైమ్ అనాలిసిస్', weight: 25, description: 'Big-O సంక్లిష్టతలను సరైన రీతిలో స్పష్టం చేయడం.' }
    ]
  },

  // --- Aptitude & Logical Reasoning ---
  {
    id: 'aptitude-1-te',
    category: 'aptitude',
    difficulty: 'intermediate',
    question: 'ఒక పెట్టెలో 5 ఎరుపు బంతులు, 4 నీలం బంతులు, మరియు 3 ఆకుపచ్చ బంతులు ఉన్నాయి. యాదృచ్ఛికంగా రెండు బంతులను తీస్తే, ఆ రెండు వేర్వేరు రంగుల్లో ఉండటానికి గల సంభావ్యత (Probability) ఎంత?',
    contextHint: 'మొత్తం బంతులు = 12. కాంప్లిమెంటరీ ప్రాబబిలిటీ (1 - ఒకే రంగు బంతులు రావడానికి సంభావ్యత) ఉపయోగించండి.',
    expectedKeywords: ['సంభావ్యత', 'Probability', 'మొత్తం బంతులు', '12C2', 'కాంప్లిమెంట్', 'కాంబినేషన్', '47/66', 'భిన్నం'],
    modelAnswer: 'మొత్తం బంతులు = 5 + 4 + 3 = 12. ఏవైనా 2 బంతులను ఎంచుకోవడానికి గల మార్గాలు = 12C2 = (12 * 11) / 2 = 66. రెండు బంతులు ఒకే రంగులో ఉండటానికి మార్గాలు: 2 ఎరుపు (5C2 = 10) + 2 నీలం (4C2 = 6) + 2 ఆకుపచ్చ (3C2 = 3) = 19. ఒకే రంగు వచ్చే సంభావ్యత = 19/66. కాబట్టి, వేర్వేరు రంగులు వచ్చే సంభావ్యత = 1 - (19/66) = 47/66 (సుమారు 0.712 లేదా 71.2%).',
    rubricCriteria: [
      { criterion: 'గణిత సూత్రం', weight: 40, description: 'కాంబినేషన్ సూత్రం మరియు శాంపిల్ స్పేస్ లెక్కింపు.' },
      { criterion: 'సమస్య పరిష్కార వేగం', weight: 35, description: 'కాంప్లిమెంటరీ అప్రోచ్ స్పష్టత.' },
      { criterion: 'తుది సమాధానం', weight: 25, description: '47/66 ఖచ్చితమైన సమాధానం రావడం.' }
    ]
  }
];

// ============================================================================
// HINDI (हिन्दी) QUESTION BANK
// ============================================================================
export const HINDI_QUESTION_BANK: Question[] = [
  // --- HR / Behavioral ---
  {
    id: 'hr-1-hi',
    category: 'hr',
    difficulty: 'beginner',
    question: 'कृपया अपना परिचय दें, अपनी शैक्षणिक पृष्ठभूमि बताएं और इस पद के लिए आपकी रुचि का क्या कारण है?',
    contextHint: 'Past, Present, और Future संरचना का उपयोग करें। अपने मुख्य तकनीकी प्रोजेक्ट्स और कंपनी के लक्ष्यों से जुड़ाव उजागर करें।',
    expectedKeywords: ['परिचय', 'शिक्षा', 'अनुभव', 'प्रोजेक्ट्स', 'तकनीकी कौशल', 'रुचि', 'करियर', 'skills', 'education', 'passion', 'growth'],
    modelAnswer: 'मेरा नाम कंप्यूटर साइंस इंजीनियरिंग पृष्ठभूमि से है और मैंने आधुनिक वेब प्रौद्योगिकियों के साथ व्यावहारिक प्रोजेक्ट बनाए हैं। मुझे वास्तविक समस्याओं को हल करने और स्केलेबल सॉफ्टवेयर विकसित करने में गहरी रुचि है। आपकी कंपनी की इंजीनियरिंग संस्कृति और चुनौतीपूर्ण अवसर मुझे अपनी तकनीकी क्षमताओं को और निखारने का बेहतरीन मंच प्रदान करते हैं।',
    rubricCriteria: [
      { criterion: 'संरचना और प्रवाह', weight: 30, description: 'शिक्षा से लेकर प्रोजेक्ट्स तक सुसंगत विवरण।' },
      { criterion: 'पद से प्रासंगिकता', weight: 40, description: 'कंपनी और रोल के प्रति स्पष्ट रुचि और उद्देश्य।' },
      { criterion: 'संवाद स्पष्टता', weight: 30, description: 'स्पष्ट, आत्मविश्वासी और सटीक भाषा।' }
    ]
  },
  {
    id: 'hr-2-hi',
    category: 'hr',
    difficulty: 'intermediate',
    question: 'किसी ऐसी स्थिति का वर्णन करें जब किसी प्रोजेक्ट के दौरान सहकर्मी या टीम लीड से आपका मतभेद हुआ हो। आपने इसे कैसे सुलझाया?',
    contextHint: 'STAR प्रारूप अपनाएं: Situation (परिस्थिति), Task (कार्य), Action (कदम), Result (परिणाम)। व्यावसायिक संवाद पर ध्यान केंद्रित करें।',
    expectedKeywords: ['स्थिति', 'मतभेद', 'चर्चा', 'डेटा', 'समाधान', 'टीम वर्क', 'STAR', 'collaboration', 'resolution', 'outcome'],
    modelAnswer: 'हमारे कॉलेज प्रोजेक्ट के दौरान यह बहस हुई कि क्या हमें REST API चुनना चाहिए या GraphQL। प्रोजेक्ट में गतिरोध दूर करने के लिए मैंने दोनों विकल्पों के विकास समय, बैंडविड्थ और जटिलता की तुलना करते हुए एक तकनीकी मैट्रिक्स तैयार की। डेटा ने दिखाया कि REST हमारे समय-सीमा के लिए अधिक उपयुक्त था। टीम ने इस डेटा-आधारित निर्णय को स्वीकार किया और प्रोजेक्ट समय से पहले पूरा हुआ।',
    rubricCriteria: [
      { criterion: 'STAR पद्धति', weight: 40, description: 'स्पष्ट स्थिति, कार्य, उठाया गया कदम और परिणाम।' },
      { criterion: 'व्यावसायिक परिपक्वता', weight: 35, description: 'व्यक्तिगत आक्षेपों के बजाय समाधान पर जोर।' },
      { criterion: 'परियोजना परिणाम', weight: 25, description: 'सुलझाव से प्रोजेक्ट को क्या लाभ हुआ।' }
    ]
  },

  // --- Technical Depth ---
  {
    id: 'tech-1-hi',
    category: 'technical',
    difficulty: 'intermediate',
    question: 'RESTful API के मुख्य सिद्धांत क्या हैं? GET, POST, PUT और DELETE विधियों के बीच मुख्य अंतर स्पष्ट करें।',
    contextHint: 'स्टेटलेसनेस (Statelessness), आईडेम्पोटेंसी (Idempotency) और सही HTTP स्थिति कोड का उल्लेख करें।',
    expectedKeywords: ['REST', 'Stateless', 'Idempotent', 'GET', 'POST', 'PUT', 'DELETE', 'HTTP Methods', 'क्लाइंट सर्वर', 'Status Code'],
    modelAnswer: 'REST का पूर्ण रूप Representational State Transfer है। इसके मुख्य सिद्धांत हैं: क्लाइंट-सर्वर पृथक्करण, स्टेटलेस आर्किटेक्चर, और कैशिंग का समर्थन। GET केवल डेटा पढ़ने के लिए होता है और यह आईडेम्पोटेंट है; POST नए रिसोर्स के निर्माण के लिए होता है; PUT पूरे रिसोर्स को अपडेट या रिप्लेस करता है; DELETE रिसोर्स को हटाने के लिए काम आता है।',
    rubricCriteria: [
      { criterion: 'आर्किटेक्चरल सिद्धांत', weight: 35, description: 'Statelessness और uniform interface की समझ।' },
      { criterion: 'HTTP विधियों में अंतर', weight: 40, description: 'Idempotency और CRUD कार्यों का सटीक विश्लेषण।' },
      { criterion: 'तकनीकी सटीकता', weight: 25, description: 'उचित तकनीकी शब्दावली का प्रयोग।' }
    ]
  },
  {
    id: 'tech-2-hi',
    category: 'technical',
    difficulty: 'intermediate',
    question: 'ऑब्जेक्ट-ओरिएंटेड प्रोग्रामिंग (OOP) के चार मुख्य स्तंभ क्या हैं? वास्तविक उदाहरण सहित समझाइए।',
    contextHint: 'Encapsulation, Abstraction, Inheritance, और Polymorphism को स्पष्ट करें।',
    expectedKeywords: ['Encapsulation', 'Abstraction', 'Inheritance', 'Polymorphism', 'इनकैप्सुलेशन', 'एब्सट्रैक्शन', 'इनहेरिटेंस', 'पॉलीमॉर्फिज्म', 'क्लास', 'ऑब्जेक्ट'],
    modelAnswer: 'OOP के चार मुख्य सिद्धांत हैं: 1. Encapsulation: डेटा और मेथड्स को एक इकाई में बांधना और प्राइवेट वेरिएबल्स द्वारा सुरक्षा देना। 2. Abstraction: आंतरिक जटिलताओं को छिपाकर केवल आवश्यक फंक्शनैलिटी प्रदर्शित करना। 3. Inheritance: मौजूदा क्लास की विशेषताओं को नई क्लास में पुनः उपयोग करना। 4. Polymorphism: एक ही इंटरफ़ेस या मेथड के एकाधिक रूप (ओवरलोडिंग और ओवरराइडिंग)।',
    rubricCriteria: [
      { criterion: 'अवधारणाओं की समझ', weight: 40, description: 'चारों सिद्धांतों की सटीक व्याख्या।' },
      { criterion: 'व्यावहारिक उदाहरण', weight: 35, description: 'सॉफ्टवेयर डेवलपमेंट में इनका उपयोग।' },
      { criterion: 'कोड पुनः उपयोगिता', weight: 25, description: 'क्लीन कोड और मेंटेनेबिलिटी के लाभ।' }
    ]
  },

  // --- Coding & Algorithmic Logic ---
  {
    id: 'coding-1-hi',
    category: 'coding',
    difficulty: 'intermediate',
    question: 'किसी दिए गए ऐरे (Array) में किन्हीं दो संख्याओं का योग Target के बराबर हो, तो उनके सूचकांक (Indices) निकालने का सबसे कुशल एल्गोरिथ्म बताएं।',
    contextHint: 'Hash Map का उपयोग करके O(N) समय जटिलता (Time Complexity) में समाधान बताएं।',
    expectedKeywords: ['Two Sum', 'Array', 'Hash Map', 'Time Complexity', 'O(N)', 'Space Complexity', 'Target', 'कॉम्प्लिमेंट', 'ऐरे', 'इंडेक्स'],
    modelAnswer: 'इसके लिए सबसे कुशल दृष्टिकोण Hash Map का उपयोग करना है। जैसे ही हम ऐरे में प्रत्येक तत्व x से गुजरते हैं, हम जांचते हैं कि क्या Target - x (कॉम्प्लिमेंट) पहले से मैप में मौजूद है। यदि हां, तो हम तुरंत दोनों इंडेक्स लौटा देते हैं। यदि नहीं, तो हम वर्तमान संख्या और उसके इंडेक्स को मैप में स्टोर कर लेते हैं। इसका समय जटिलता O(N) और स्पेस जटिलता O(N) है।',
    rubricCriteria: [
      { criterion: 'एल्गोरिदम दक्षता', weight: 45, description: 'Hash Map का उपयोग और O(N) समाधान।' },
      { criterion: 'एज केसेस की समझ', weight: 30, description: 'डुप्लीकेट मान और खाली ऐरे की हैंडलिंग।' },
      { criterion: 'कॉम्प्लेक्सिटी विश्लेषण', weight: 25, description: 'Time और Space Complexity का सही आकलन।' }
    ]
  },

  // --- Aptitude & Logical Reasoning ---
  {
    id: 'aptitude-1-hi',
    category: 'aptitude',
    difficulty: 'intermediate',
    question: 'एक डिब्बे में 5 लाल गेंदें, 4 नीली गेंदें और 3 हरी गेंदें हैं। यदि बिना बदले यादृच्छिक रूप से 2 गेंदें निकाली जाएं, तो दोनों के अलग-अलग रंगों की होने की क्या प्रायिकता (Probability) है?',
    contextHint: 'कुल गेंदें = 12. Complementary Probability (1 - समान रंग की प्रायिकता) का उपयोग करें।',
    expectedKeywords: ['प्रायिकता', 'Probability', 'कुल गेंदें', '12C2', 'कॉम्प्लिमेंट', '47/66', 'संयोजन', 'Combination'],
    modelAnswer: 'कुल गेंदें = 5 + 4 + 3 = 12। 12 में से किन्हीं 2 गेंदों को चुनने के कुल तरीके = 12C2 = 66। दोनों गेंदें एक ही रंग की होने के तरीके: 2 लाल (5C2 = 10) + 2 नीली (4C2 = 6) + 2 हरी (3C2 = 3) = कुल 19 तरीके। एक ही रंग की प्रायिकता = 19/66। अतः दोनों गेंदों के अलग-अलग रंग के होने की प्रायिकता = 1 - (19/66) = 47/66 (लगभग 71.2%)।',
    rubricCriteria: [
      { criterion: 'गणितीय शुद्धता', weight: 40, description: 'संयोजन (Combinations) का सही उपयोग।' },
      { criterion: 'तार्किक दृष्टिकोण', weight: 35, description: 'कॉम्प्लिमेंटरी प्रायिकता से त्वरित हल निकालना।' },
      { criterion: 'अंतिम उत्तर', weight: 25, description: 'सटीक 47/66 परिणाम प्राप्त करना।' }
    ]
  }
];

// ============================================================================
// TAMIL (தமிழ்) QUESTION BANK
// ============================================================================
export const TAMIL_QUESTION_BANK: Question[] = [
  {
    id: 'hr-1-ta',
    category: 'hr',
    difficulty: 'beginner',
    question: 'உங்களைப் பற்றி, உங்கள் கல்விப் பின்னணி மற்றும் இந்த வேலை வாய்ப்பில் உங்களுக்கு உள்ள ஆர்வம் குறித்து விளக்குங்கள்.',
    contextHint: 'கடந்த கல்வி, தற்போதைய திட்டங்கள், எதிர்கால இலக்குகள் (Past, Present, Future) கொண்டு 2 நிமிடங்களுக்குள் விவரிக்கவும்.',
    expectedKeywords: ['கல்வி', 'அனுபவம்', 'திட்டங்கள்', 'தொழில்நுட்ப ஆர்வம்', 'திறன்கள்', 'இலக்கு', 'projects', 'skills', 'education', 'passion'],
    modelAnswer: 'நான் கணினி அறிவியல் மற்றும் பொறியியல் பட்டப்படிப்பு முடித்துள்ளேன் மற்றும் நவீன இணைய தொழில்நுட்பங்களைப் பயன்படுத்தி முழுமையான பயன்பாடுகளை உருவாக்கியுள்ளேன். நிஜ உலகப் பிரச்சனைகளுக்கு நம்பகமான மென்பொருள் தீர்வுகளை உருவாக்குவதில் எனக்கு மிகுந்த ஆர்வம் உள்ளது. உங்கள் நிறுவனத்தின் தரமான பொறியியல் கலாச்சாரம் மற்றும் புதிய சவால்கள் என் திறனை அடுத்த கட்டத்திற்கு கொண்டு செல்ல உதவும்.',
    rubricCriteria: [
      { criterion: 'கட்டமைப்பு & ஓட்டம்', weight: 30, description: 'கல்வி மற்றும் திட்டங்களின் தெளிவான தொடர்ச்சி.' },
      { criterion: 'வேலைக்கான பொருத்தம்', weight: 40, description: 'நிறுவன இலக்குகளுடன் தனிப்பட்ட திறனை இணைப்பது.' },
      { criterion: 'பேச்சுத் தெளிவு', weight: 30, description: 'நம்பிக்கையான மற்றும் தெளிவான உச்சரிப்பு.' }
    ]
  },
  {
    id: 'tech-1-ta',
    category: 'technical',
    difficulty: 'intermediate',
    question: 'RESTful API-களின் முக்கிய கோட்பாடுகள் என்ன? மற்றும் GET, POST, PUT, DELETE முறைகளுக்கு இடையிலான வேறுபாடுகளை விளக்குங்கள்.',
    contextHint: 'Stateless தன்மை, Idempotency மற்றும் சரியான HTTP status குறியீடுகளை குறிப்பிடவும்.',
    expectedKeywords: ['REST', 'Stateless', 'Idempotent', 'GET', 'POST', 'PUT', 'DELETE', 'HTTP Methods', 'Status Code', 'வளங்கள்'],
    modelAnswer: 'REST என்பது Representational State Transfer என்பதன் சுருக்கம். இதன் முக்கிய கோட்பாடுகள்: Client-Server பிரிப்பு, Stateless கட்டமைப்பு, மற்றும் Cache ஆதரவு. GET தரவைப் படிக்க பயன்படுகிறது மற்றும் இது Idempotent; POST புதிய தரவை உருவாக்க பயன்படுகிறது; PUT முழுமையான வளத்தை புதுப்பிக்க பயன்படுகிறது; DELETE தரவை நீக்க பயன்படுகிறது.',
    rubricCriteria: [
      { criterion: 'கட்டமைப்பு கோட்பாடுகள்', weight: 35, description: 'Statelessness மற்றும் Caching பற்றிய விளக்கம்.' },
      { criterion: 'HTTP முறைகள் வேறுபாடு', weight: 40, description: 'Idempotency மற்றும் CRUD செயல்பாடுகளின் ஒப்பீடு.' },
      { criterion: 'தொழில்நுட்ப துல்லியம்', weight: 25, description: 'துல்லியமான தொழில்நுட்ப சொல்லாடல்.' }
    ]
  },
  {
    id: 'coding-1-ta',
    category: 'coding',
    difficulty: 'intermediate',
    question: 'ஒரு வரிசையில் (Array) உள்ள இரண்டு எண்களின் கூட்டுத்தொகை Target-க்கு சமமாக இருந்தால், அந்த எண்களின் குறியீடுகளை (Indices) கண்டறியும் சிறந்த அல்காரிதத்தை விளக்குங்கள்.',
    contextHint: 'Hash Map பயன்படுத்தி O(N) நேர சிக்கலில் (Time Complexity) எவ்வாறு தீர்ப்பது என்பதை விளக்குங்கள்.',
    expectedKeywords: ['Two Sum', 'Array', 'Hash Map', 'Time Complexity', 'O(N)', 'Target', 'வரிசை', 'குறியீடு', 'நிரலாக்கம்'],
    modelAnswer: 'இதற்கு மிகச் சிறந்த அணுகுமுறை Hash Map பயன்படுத்துவதாகும். நாம் வரிசையின் ஒவ்வொரு உறுப்பையும் கடக்கும்போது, Target - x என்பது முன்பே வரைபடத்தில் உள்ளதா என சோதிக்கிறோம். இருந்தால் உடனடியாக அவ்விரு குறியீடுகளையும் திருப்பி அனுப்புகிறோம். இல்லையெனில், தற்போதைய எண்ணையும் அதன் குறியீட்டையும் Map-ல் சேமிக்கிறோம். இதன் நேரச் சிக்கல் O(N) மற்றும் இடச் சிக்கல் O(N) ஆகும்.',
    rubricCriteria: [
      { criterion: 'அல்காரித செயல்திறன்', weight: 45, description: 'Hash Map பயன்பாடு மற்றும் O(N) உகப்பாக்கம்.' },
      { criterion: 'எல்லை வழக்குகள்', weight: 30, description: 'வெற்று வரிசை மற்றும் நகல் மதிப்புகளின் கையாளுதல்.' },
      { criterion: 'சிக்கல் பகுப்பாய்வு', weight: 25, description: 'Time & Space Complexity தெளிவு.' }
    ]
  },
  {
    id: 'aptitude-1-ta',
    category: 'aptitude',
    difficulty: 'intermediate',
    question: 'ஒரு பெட்டியில் 5 சிவப்பு பந்துகள், 4 நீல பந்துகள், மற்றும் 3 பச்சை பந்துகள் உள்ளன. சீரற்ற முறையில் 2 பந்துகள் எடுக்கப்பட்டால், இரண்டும் வெவ்வேறு வண்ணங்களாக இருப்பதற்கான நிகழ்தகவு (Probability) என்ன?',
    contextHint: 'மொத்த பந்துகள் = 12. மாற்று நிகழ்தகவு (1 - ஒரே வண்ண பந்துகளுக்கான நிகழ்தகவு) பயன்படுத்தவும்.',
    expectedKeywords: ['நிகழ்தகவு', 'Probability', 'மொத்த பந்துகள்', '12C2', '47/66', 'வண்ணங்கள்', 'சேர்க்கை', 'Combinations'],
    modelAnswer: 'மொத்த பந்துகள் = 5 + 4 + 3 = 12. 12 பந்துகளில் இருந்து 2 பந்துகளை தேர்ந்தெடுக்கும் மொத்த வழிகள் = 12C2 = 66. இரண்டும் ஒரே வண்ணமாக இருக்கும் வழிகள்: 2 சிவப்பு (5C2 = 10) + 2 நீலம் (4C2 = 6) + 2 பச்சை (3C2 = 3) = 19 வழிகள். ஒரே வண்ண நிகழ்தகவு = 19/66. எனவே வெவ்வேறு வண்ணங்களாக இருக்கும் நிகழ்தகவு = 1 - (19/66) = 47/66 (சுமார் 71.2%).',
    rubricCriteria: [
      { criterion: 'கணித சூத்திரம்', weight: 40, description: 'சேர்க்கை சூத்திரத்தின் சரியான பயன்பாடு.' },
      { criterion: 'தர்க்கரீதியான வழிமுறை', weight: 35, description: 'எளிய வழியில் தீர்வை கண்டறிதல்.' },
      { criterion: 'இறுதி விடை', weight: 25, description: 'துல்லியமான 47/66 விடை பெறுதல்.' }
    ]
  }
];

// ============================================================================
// KANNADA (ಕನ್ನಡ) QUESTION BANK
// ============================================================================
export const KANNADA_QUESTION_BANK: Question[] = [
  {
    id: 'hr-1-kn',
    category: 'hr',
    difficulty: 'beginner',
    question: 'ನಿಮ್ಮ ಬಗ್ಗೆ, ನಿಮ್ಮ ಶೈಕ್ಷಣಿಕ ಹಿನ್ನೆಲೆ ಮತ್ತು ಈ ಉದ್ಯೋಗದ ಹುದ್ದೆಯಲ್ಲಿ ನಿಮ್ಮ ಆಸಕ್ತಿಯ ಬಗ್ಗೆ ವಿವರಿಸಿ.',
    contextHint: 'ಕಳೆದ ಶಿಕ್ಷಣ, ಪ್ರಸ್ತುತ ಪ್ರಾಜೆಕ್ಟ್‌ಗಳು ಮತ್ತು ಭವಿಷ್ಯದ ಗುರಿಗಳನ್ನು ಒಳಗೊಂಡಂತೆ 2 ನಿಮಿಷಗಳಲ್ಲಿ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ವಿವರಿಸಿ.',
    expectedKeywords: ['ಶಿಕ್ಷಣ', 'ಪ್ರಾಜೆಕ್ಟ್‌ಗಳು', 'ಕೌಶಲ್ಯಗಳು', 'ತಾಂತ್ರಿಕ ಆಸಕ್ತಿ', 'ಗುರಿ', 'ಅನುಭವ', 'skills', 'education', 'projects', 'passion'],
    modelAnswer: 'ನಾನು ಕಂಪ್ಯೂಟರ್ ಸೈನ್ಸ್ ಎಂಜಿನಿಯರಿಂಗ್‌ನಲ್ಲಿ ಬಲವಾದ ಅಡಿಪಾಯವನ್ನು ಹೊಂದಿದ್ದೇನೆ ಮತ್ತು ಆಧುನಿಕ ವೆಬ್ ತಂತ್ರಜ್ಞಾನಗಳನ್ನು ಬಳಸಿ ಪ್ರಾಯೋಗಿಕ ಪ್ರಾಜೆಕ್ಟ್‌ಗಳನ್ನು ನಿರ್ಮಿಸಿದ್ದೇನೆ. ನೈಜ-ಜಗತ್ತಿನ ಸಮಸ್ಯೆಗಳಿಗೆ ಪರಿಹಾರಗಳನ್ನು ಒದಗಿಸಲು ನನಗೆ ತೀವ್ರ ಆಸಕ್ತಿಯಿದೆ. ನಿಮ್ಮ ಸಂಸ್ಥೆಯ ಅತ್ಯುತ್ತಮ ಎಂಜಿನಿಯರಿಂಗ್ ಸಂಸ್ಕೃತಿ ಮತ್ತು ವೃತ್ತಿ ಬೆಳವಣಿಗೆಯ ಅವಕಾಶಗಳು ನನ್ನನ್ನು ಆಕರ್ಷಿಸಿವೆ.',
    rubricCriteria: [
      { criterion: 'ರಚನೆ ಮತ್ತು ಹರಿವು', weight: 30, description: 'ಶಿಕ್ಷಣದಿಂದ ಪ್ರಾಜೆಕ್ಟ್‌ಗಳವರೆಗೆ ಕ್ರಮಬದ್ಧವಾದ ವಿವರಣೆ.' },
      { criterion: 'ಹುದ್ದೆಗೆ ಹೊಂದಾಣಿಕೆ', weight: 40, description: 'ಉದ್ಯೋಗದ ಜವಾಬ್ದಾರಿಗೆ ತಕ್ಕ ಕೌಶಲ್ಯಗಳ ಪ್ರಸ್ತುತಿ.' },
      { criterion: 'ಸ್ಪಷ್ಟತೆ ಮತ್ತು ಸಂವಹನ', weight: 30, description: 'ಆತ್ಮವಿಶ್ವಾಸದ ಮತ್ತು ಸ್ಪಷ್ಟ ಮಾತುಗಾರಿಕೆ.' }
    ]
  },
  {
    id: 'tech-1-kn',
    category: 'technical',
    difficulty: 'intermediate',
    question: 'RESTful API ಗಳ ಮುಖ್ಯ ತತ್ವಗಳು ಯಾವುವು? ಮತ್ತು GET, POST, PUT, DELETE ವಿಧಾನಗಳ ನಡುವಿನ ಪ್ರಮುಖ ವ್ಯತ್ಯಾಸಗಳನ್ನು ವಿವರಿಸಿ.',
    contextHint: 'Statelessness, Idempotency ಮತ್ತು HTTP ಸ್ಥಿತಿ ಕೋಡ್‌ಗಳನ್ನು ಉಲ್ಲೇಖಿಸಿ.',
    expectedKeywords: ['REST', 'Stateless', 'Idempotent', 'GET', 'POST', 'PUT', 'DELETE', 'HTTP Methods', 'Status Code', 'ಕ್ಲೈಂಟ್ ಸರ್ವರ್'],
    modelAnswer: 'REST ಎಂದರೆ Representational State Transfer. ಇದರ ಮುಖ್ಯ ತತ್ವಗಳೆಂದರೆ: ಕ್ಲೈಂಟ್-ಸರ್ವರ್ ಪ್ರತ್ಯೇಕತೆ, ಸ್ಟೇಟ್‌ಲೆಸ್ ಆರ್ಕಿಟೆಕ್ಚರ್ ಮತ್ತು ಕ್ಯಾಶಿಂಗ್ ಬೆಂಬಲ. GET ಡೇಟಾವನ್ನು ಓದಲು ಬಳಸಲಾಗುತ್ತದೆ ಮತ್ತು ಇದು ಐಡೆಂಪೊಟೆಂಟ್ ಆಗಿದೆ; POST ಹೊಸ ಡೇಟಾ ರಚಿಸಲು ಬಳಸಲಾಗುತ್ತದೆ; PUT ಸಂಪನ್ಮೂಲವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ನವೀಕರಿಸಲು ಬಳಸಲಾಗುತ್ತದೆ; DELETE ಸಂಪನ್ಮೂಲವನ್ನು ಅಳಿಸಲು ಬಳಸಲಾಗುತ್ತದೆ.',
    rubricCriteria: [
      { criterion: 'ಆರ್ಕಿಟೆಕ್ಚರ್ ತತ್ವಗಳು', weight: 35, description: 'Statelessness ಮತ್ತು ಸಂಪನ್ಮೂಲ ಮಾದರಿಯ ತಿಳುವಳಿಕೆ.' },
      { criterion: 'HTTP ವಿಧಾನಗಳ ವ್ಯತ್ಯಾಸ', weight: 40, description: 'Idempotency ಮತ್ತು CRUD ಕಾರ್ಯಾಚರಣೆಗಳ ನಿಖರತೆ.' },
      { criterion: 'ತಾಂತ್ರಿಕ ನಿಖರತೆ', weight: 25, description: 'ಸರಿಯಾದ ತಾಂತ್ರಿಕ ಪದಬಳಕೆ.' }
    ]
  },
  {
    id: 'coding-1-kn',
    category: 'coding',
    difficulty: 'intermediate',
    question: 'ಒಂದು Array ನಲ್ಲಿನ ಎರಡು ಸಂಖ್ಯೆಗಳ ಮೊತ್ತವು Target ಗೆ ಸಮನಾಗಿದ್ದರೆ, ಆ ಸಂಖ್ಯೆಗಳ ಸೂಚ್ಯಂಕಗಳನ್ನು (Indices) ಕಂಡುಹಿಡಿಯುವ ಅತ್ಯುತ್ತಮ ಅಲ್ಗಾರಿದಮ್ ಅನ್ನು ವಿವರಿಸಿ.',
    contextHint: 'Hash Map ಬಳಸಿ O(N) ಸಮಯ ಸಂಕೀರ್ಣತೆಯಲ್ಲಿ ಪರಿಹರಿಸುವ ವಿಧಾನವನ್ನು ವಿವರಿಸಿ.',
    expectedKeywords: ['Two Sum', 'Array', 'Hash Map', 'Time Complexity', 'O(N)', 'Target', 'ಸೂಚ್ಯಂಕ', 'ಅಲ್ಗಾರಿದಮ್', 'ಸಂಕೀರ್ಣತೆ'],
    modelAnswer: 'ಇದಕ್ಕೆ ಅತ್ಯಂತ ದಕ್ಷ ವಿಧಾನವೆಂದರೆ Hash Map ಬಳಸುವುದು. ಶ್ರೇಣಿಯಲ್ಲಿನ ಪ್ರತಿಯೊಂದು ಸಂಖ್ಯೆ x ಅನ್ನು ಪರಿಶೀಲಿಸುವಾಗ, Target - x ಮ್ಯಾಪ್‌ನಲ್ಲಿ ಇದೆಯೇ ಎಂದು ನೋಡುತ್ತೇವೆ. ಇದ್ದರೆ, ಎರಡೂ ಸೂಚ್ಯಂಕಗಳನ್ನು ಹಿಂದಿರುಗಿಸುತ್ತೇವೆ. ಇಲ್ಲದಿದ್ದರೆ, ಪ್ರಸ್ತುತ ಸಂಖ್ಯೆ ಮತ್ತು ಅದರ ಸೂಚ್ಯಂಕವನ್ನು ಮ್ಯಾಪ್‌ನಲ್ಲಿ ಶೇಖರಿಸುತ್ತೇವೆ. ಇದರ Time Complexity O(N) ಮತ್ತು Space Complexity O(N) ಆಗಿದೆ.',
    rubricCriteria: [
      { criterion: 'ಅಲ್ಗಾರಿದಮ್ ದಕ್ಷತೆ', weight: 45, description: 'Hash Map ಬಳಕೆ ಮತ್ತು O(N) ಪರಿಹಾರ.' },
      { criterion: 'ಎಡ್ಜ್ ಕೇಸ್‌ಗಳು', weight: 30, description: 'ಖಾಲಿ ಅರೇ ಮತ್ತು ಪುನರಾವರ್ತಿತ ಮೌಲ್ಯಗಳ ನಿರ್ವಹಣೆ.' },
      { criterion: 'ಸಂಕೀರ್ಣತೆಯ ವಿಶ್ಲೇಷಣೆ', weight: 25, description: 'Time & Space Complexity ನಿಖರತೆ.' }
    ]
  },
  {
    id: 'aptitude-1-kn',
    category: 'aptitude',
    difficulty: 'intermediate',
    question: 'ಒಂದು ಪೆಟ್ಟಿಗೆಯಲ್ಲಿ 5 ಕೆಂಪು, 4 ನೀಲಿ ಮತ್ತು 3 ಹಸಿರು ಚೆಂಡುಗಳಿವೆ. ಯಾದೃಚ್ಛಿಕವಾಗಿ 2 ಚೆಂಡುಗಳನ್ನು ತೆಗೆದರೆ, ಅವೆರಡೂ ಬೇರೆ ಬೇರೆ ಬಣ್ಣದ್ದಾಗಿರುವ ಸಂಭವನೀಯತೆ (Probability) ಎಷ್ಟು?',
    contextHint: 'ಒಟ್ಟು ಚೆಂಡುಗಳು = 12. ಪೂರಕ ಸಂಭವನೀಯತೆ (1 - ಒಂದೇ ಬಣ್ಣದ ಸಂಭವನೀಯತೆ) ಬಳಸಿ.',
    expectedKeywords: ['ಸಂಭವನೀಯತೆ', 'Probability', 'ಒಟ್ಟು ಚೆಂಡುಗಳು', '12C2', '47/66', 'ಬಣ್ಣಗಳು', 'ಸಂಯೋಜನೆ', 'Combinations'],
    modelAnswer: 'ಒಟ್ಟು ಚೆಂಡುಗಳು = 5 + 4 + 3 = 12. 12 ಚೆಂಡುಗಳಿಂದ 2 ಚೆಂಡುಗಳನ್ನು ಆರಿಸುವ ಒಟ್ಟು ವಿಧಾನಗಳು = 12C2 = 66. ಎರಡೂ ಒಂದೇ ಬಣ್ಣದ್ದಾಗಿರುವ ವಿಧಾನಗಳು: 2 ಕೆಂಪು (5C2 = 10) + 2 ನೀಲಿ (4C2 = 6) + 2 ಹಸಿರು (3C2 = 3) = 19 ವಿಧಾನಗಳು. ಒಂದೇ ಬಣ್ಣದ ಸಂಭವನೀಯತೆ = 19/66. ಆದ್ದರಿಂದ ವಿಭಿನ್ನ ಬಣ್ಣಗಳ ಸಂಭವನೀಯತೆ = 1 - (19/66) = 47/66 (ಸುಮಾರು 71.2%).',
    rubricCriteria: [
      { criterion: 'ಗಣಿತದ ಸೂತ್ರ', weight: 40, description: 'ಸಂಯೋಜನೆಯ ಸೂತ್ರದ ಸರಿಯಾದ ಬಳಕೆ.' },
      { criterion: 'ತಾರ್ಕಿಕ ಹಂತಗಳು', weight: 35, description: 'ಪೂರಕ ವಿಧಾನದ ಮೂಲಕ ಶೀಘ್ರ ಲೆಕ್ಕಾಚಾರ.' },
      { criterion: 'ಅಂತಿಮ ಫಲಿತಾಂಶ', weight: 25, description: 'ನಿಖರವಾದ 47/66 ಉತ್ತರ.' }
    ]
  }
];

// ============================================================================
// MALAYALAM (മലയാളം) QUESTION BANK
// ============================================================================
export const MALAYALAM_QUESTION_BANK: Question[] = [
  {
    id: 'hr-1-ml',
    category: 'hr',
    difficulty: 'beginner',
    question: 'നിങ്ങളെക്കുറിച്ചും നിങ്ങളുടെ വിദ്യാഭ്യാസ പശ്ചാത്തലത്തെക്കുറിച്ചും ഈ ജോലിയോടുള്ള താൽപ്പര്യത്തെക്കുറിച്ചും വിശദീകരിക്കുക.',
    contextHint: 'പഠനം, പ്രോജക്ടുകൾ, ഭാവി ലക്ഷ്യങ്ങൾ എന്നിവ ഉൾപ്പെടുത്തി 2 മിനിറ്റിനുള്ളിൽ വ്യക്തമായി പറയുക.',
    expectedKeywords: ['വിദ്യാഭ്യാസം', 'കഴിവുകൾ', 'പ്രോജക്ടുകൾ', 'താൽപ്പര്യം', 'ലക്ഷ്യം', 'കമ്പ്യൂട്ടർ സയൻസ്', 'skills', 'education', 'projects', 'passion'],
    modelAnswer: 'കമ്പ്യൂട്ടർ സയൻസ് എഞ്ചിനീയറിംഗിൽ ബിരുദമുള്ള ഞാൻ ആധുനിക വെബ് സാങ്കേതികവിദ്യകളിൽ പ്രായോഗിക പ്രോജക്ടുകൾ ചെയ്തിട്ടുണ്ട്. പ്രായോഗിക പ്രശ്നങ്ങൾക്ക് വിശ്വസനീയമായ സോഫ്റ്റ്‌വെയർ പരിഹാരങ്ങൾ വികസിപ്പിക്കാൻ എനിക്ക് വലിയ താല്പര്യമുണ്ട്. നിങ്ങളുടെ സ്ഥാപനത്തിന്റെ പ്രൊഫഷണൽ തൊഴിൽ സംസ്കാരവും സാങ്കേതിക വളർച്ചാ അവസരങ്ങളും എന്റെ കരിയറിന് മികച്ച തുടക്കം നൽകുമെന്ന് ഞാൻ വിശ്വസിക്കുന്നു.',
    rubricCriteria: [
      { criterion: 'ഘടനയും ഒഴുക്കും', weight: 30, description: 'വിദ്യാഭ്യാസത്തിൽ നിന്ന് പ്രോജക്ടുകളിലേക്കുള്ള വ്യക്തമായ തുടർച്ച.' },
      { criterion: 'ജോലിയോടുള്ള അനുയോജ്യത', weight: 40, description: 'കമ്പനിയുടെ ആവശ്യങ്ങൾക്ക് അനുയോജ്യമായ കഴിവുകൾ.' },
      { criterion: 'സംസാര വ്യക്തത', weight: 30, description: 'ആത്മവിശ്വാസത്തോടെയുള്ള അവതരണം.' }
    ]
  },
  {
    id: 'tech-1-ml',
    category: 'technical',
    difficulty: 'intermediate',
    question: 'RESTful API-കളുടെ പ്രധാന തത്വങ്ങൾ എന്തൊക്കെയാണ്? GET, POST, PUT, DELETE രീതികൾ തമ്മിലുള്ള വ്യത്യാസങ്ങൾ വ്യക്തമാക്കുക.',
    contextHint: 'Statelessness, Idempotency, ശരിയായ HTTP സ്റ്റാറ്റസ് കോഡുകൾ എന്നിവ വിശദീകരിക്കുക.',
    expectedKeywords: ['REST', 'Stateless', 'Idempotent', 'GET', 'POST', 'PUT', 'DELETE', 'HTTP Methods', 'Status Code', 'ക്ലയന്റ് സെർവർ'],
    modelAnswer: 'REST എന്നത് Representational State Transfer-ന്റെ ചുരുക്കരൂപമാണ്. പ്രധാന തത്വങ്ങൾ: ക്ലയന്റ്-സെർവർ വിഭജനം, സ്റ്റേറ്റ്‌ലെസ് ഘടന, കാഷിംഗ് പിന്തുണ എന്നിവയാണ്. GET വിവരങ്ങൾ വായിക്കാൻ ഉപയോഗിക്കുന്നു, ഇത് ഐഡംപൊട്ടന്റ് ആണ്; POST പുതിയ റിസോഴ്സ് സൃഷ്ടിക്കാൻ ഉപയോഗിക്കുന്നു; PUT റിസോഴ്സ് പൂർണ്ണമായി അപ്‌ഡേറ്റ് ചെയ്യാൻ ഉപയോഗിക്കുന്നു; DELETE വിവരങ്ങൾ നീക്കം ചെയ്യാൻ ഉപയോഗിക്കുന്നു.',
    rubricCriteria: [
      { criterion: 'ആർക്കിടെക്ചർ തത്വങ്ങൾ', weight: 35, description: 'Statelessness, കാഷിംഗ് എന്നിവയെക്കുറിച്ചുള്ള ധാരണ.' },
      { criterion: 'HTTP രീതികളുടെ വ്യത്യാസം', weight: 40, description: 'Idempotency, CRUD പ്രവർത്തനങ്ങൾ എന്നിവയുടെ താരതമ്യം.' },
      { criterion: 'സാങ്കേതിക കൃത്യത', weight: 25, description: 'കൃത്യമായ സാങ്കേതിക പദാവലി.' }
    ]
  },
  {
    id: 'coding-1-ml',
    category: 'coding',
    difficulty: 'intermediate',
    question: 'ഒരു Array-യിലെ രണ്ട് സംഖ്യകളുടെ തുക Target-ന് തുല്യമാണെങ്കിൽ, അവയുടെ സൂചികകൾ (Indices) കണ്ടെത്തുന്ന ഏറ്റവും മികച്ച അൽഗോരിതം വിശദീകരിക്കുക.',
    contextHint: 'Hash Map ഉപയോഗിച്ച് O(N) സമയ സങ്കീർണ്ണതയിൽ പരിഹരിക്കുന്ന വിധം വിശദീകരിക്കുക.',
    expectedKeywords: ['Two Sum', 'Array', 'Hash Map', 'Time Complexity', 'O(N)', 'Target', 'സൂചിക', 'അൽഗോരിതം', 'സങ്കീർണ്ണത'],
    modelAnswer: 'ഇതിന് ഏറ്റവും മികച്ച സമീപനം Hash Map ഉപയോഗിക്കുക എന്നതാണ്. അറേയിലെ ഓരോ സംഖ്യയും പരിശോധിക്കുമ്പോൾ, Target - x മാപ്പിൽ ഉണ്ടോ എന്ന് നോക്കുന്നു. ഉണ്ടെങ്കിൽ ആ രണ്ട് ഇൻഡക്സുകൾ റിട്ടേൺ ചെയ്യുന്നു. ഇല്ലെങ്കിൽ നിലവിലെ സംഖ്യയും ഇൻഡക്സും മാപ്പിൽ സേവ് ചെയ്യുന്നു. ഇതിന്റെ Time Complexity O(N) ഉം Space Complexity O(N) ഉം ആണ്.',
    rubricCriteria: [
      { criterion: 'അൽഗോരിതം കാര്യക്ഷമത', weight: 45, description: 'Hash Map ഉപയോഗവും O(N) ഒപ്റ്റിമൈസേഷനും.' },
      { criterion: 'എഡ്ജ് കേസുകൾ', weight: 30, description: 'ശൂന്യമായ അറേ, ആവർത്തന സംഖ്യകൾ എന്നിവയുടെ കൈകാര്യം ചെയ്യൽ.' },
      { criterion: 'സങ്കീർണ്ണതാ വിശകലനം', weight: 25, description: 'Time & Space Complexity കൃത്യമായി വിലയിരുത്തൽ.' }
    ]
  },
  {
    id: 'aptitude-1-ml',
    category: 'aptitude',
    difficulty: 'intermediate',
    question: 'ഒരു പെട്ടിയിൽ 5 ചുവന്ന പന്തുകളും 4 നീല പന്തുകളും 3 പച്ച പന്തുകളുമുണ്ട്. യാദൃശ്ചികമായി 2 പന്തുകൾ എടുത്താൽ, അവ രണ്ടും വ്യത്യസ്ത നിറങ്ങളാകാനുള്ള സാധ്യത (Probability) എത്രയാണ്?',
    contextHint: 'ആകെ പന്തുകൾ = 12. കോംപ്ലിമെന്ററി പ്രോബബിലിറ്റി (1 - ഒരേ നിറം വരാനുള്ള സാധ്യത) ഉപയോഗിക്കുക.',
    expectedKeywords: ['സാധ്യത', 'Probability', 'ആകെ പന്തുകൾ', '12C2', '47/66', 'നിറങ്ങൾ', 'കോമ്പിനേഷൻ', 'Combinations'],
    modelAnswer: 'ആകെ പന്തുകൾ = 5 + 4 + 3 = 12. 12 പന്തുകളിൽ നിന്ന് 2 പന്തുകൾ തിരഞ്ഞെടുക്കാനുള്ള ആകെ വഴികൾ = 12C2 = 66. രണ്ടും ഒരേ നിറമാകാനുള്ള വഴികൾ: 2 ചുവപ്പ് (5C2 = 10) + 2 നീല (4C2 = 6) + 2 പച്ച (3C2 = 3) = 19 വഴികൾ. ഒരേ നിറം വരാനുള്ള സാധ്യത = 19/66. അതിനാൽ വ്യത്യസ്ത നിറങ്ങൾ വരാനുള്ള സാധ്യത = 1 - (19/66) = 47/66 (ഏകദേശം 71.2%).',
    rubricCriteria: [
      { criterion: 'ഗണിത സമവാക്യം', weight: 40, description: 'കോമ്പിനേഷൻ സമവാക്യത്തിന്റെ കൃത്യമായ ഉപയോഗം.' },
      { criterion: 'യുക്തിസഹമായ രീതി', weight: 35, description: 'കോംപ്ലിമെന്ററി രീതിയിലൂടെയുള്ള വേഗത്തിലുള്ള പരിഹാരം.' },
      { criterion: 'അന്തിമ ഉത്തരം', weight: 25, description: 'കൃത്യമായ 47/66 ഉത്തരം ലഭിക്കൽ.' }
    ]
  }
];

// ============================================================================
// QUESTION REPOSITORY REGISTRY
// ============================================================================
const LANGUAGE_BANKS: Record<SupportedLanguageId, Question[]> = {
  en: DEFAULT_EN_QUESTIONS,
  te: TELUGU_QUESTION_BANK,
  hi: HINDI_QUESTION_BANK,
  ta: TAMIL_QUESTION_BANK,
  kn: KANNADA_QUESTION_BANK,
  ml: MALAYALAM_QUESTION_BANK
};

/**
 * Returns question bank customized for target language and interview category.
 * If language has specific curated questions, returns them; falls back cleanly to English if category lacks localized questions.
 */
export function getMultilingualQuestions(
  langIdentifier: string,
  category: InterviewType = 'placement_mixed'
): Question[] {
  const langConfig = getLanguageConfig(langIdentifier);
  const bank = LANGUAGE_BANKS[langConfig.id] || DEFAULT_EN_QUESTIONS;

  let filtered = bank.filter(q => {
    if (category === 'placement_mixed') return true;
    return q.category === category;
  });

  // If specific category has fewer than 2 questions in localized bank, augment with English questions
  if (filtered.length < 2 && bank !== DEFAULT_EN_QUESTIONS) {
    const fallbackEn = DEFAULT_EN_QUESTIONS.filter(q => {
      if (category === 'placement_mixed') return true;
      return q.category === category;
    });
    filtered = [...filtered, ...fallbackEn];
  }

  return filtered.length > 0 ? filtered : DEFAULT_EN_QUESTIONS;
}
