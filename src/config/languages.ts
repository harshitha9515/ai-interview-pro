export type SupportedLanguageId = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml';

export interface LanguageConfig {
  id: SupportedLanguageId;
  code: string;            // Standard BCP 47 code (e.g., 'te-IN')
  name: string;            // English name
  nativeName: string;      // Native script name
  flag: string;            // Flag emoji
  script: string;          // Script name
  sttLocale: string;       // Speech-to-text locale
  ttsLocales: string[];    // Ordered preference for TTS voice search
  sampleText: string;      // Sample phrase for testing speech synthesis
  greeting: string;        // Native greeting for interviewer
  inputPlaceholder: string;// Localized response placeholder
  codeSwitchingAllowed: boolean;
  evaluationGuidance: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    id: 'en',
    code: 'en-IN',
    name: 'English',
    nativeName: 'English (India/Global)',
    flag: '🇮🇳',
    script: 'Latin',
    sttLocale: 'en-IN',
    ttsLocales: ['en-IN', 'en-US', 'en-GB', 'en'],
    sampleText: 'Welcome to your placement mock interview. Let us begin with your technical introduction.',
    greeting: 'Hello and welcome to your placement interview round.',
    inputPlaceholder: 'Type your answer here or click "Record with Mic" to speak aloud...',
    codeSwitchingAllowed: true,
    evaluationGuidance: 'Evaluate standard technical English with tolerance for non-native speech patterns, Indian English idioms, and direct conceptual clarity.'
  },
  {
    id: 'te',
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    script: 'Telugu',
    sttLocale: 'te-IN',
    ttsLocales: ['te-IN', 'te', 'telugu'],
    sampleText: 'మీ ప్లేస్‌మెంట్ మాక్ ఇంటర్వ్యూకి స్వాగతం. మీ సాంకేతిక పరిచయంతో ప్రారంభిద్దాం.',
    greeting: 'నమస్కారం! మీ ప్లేస్‌మెంట్ ఇంటర్వ్యూ రౌండ్‌కు స్వాగతం.',
    inputPlaceholder: 'మీ సమాధానాన్ని ఇక్కడ టైప్ చేయండి లేదా మాట్లాడటానికి మైక్రోఫోన్ ఉపయోగించండి...',
    codeSwitchingAllowed: true,
    evaluationGuidance: 'Evaluate the semantic correctness and depth of the answer in Telugu. Candidates frequently mix English technical terms (e.g., database, multithreading, API, algorithms) with Telugu grammar—treat this mixed usage as completely valid and professional.'
  },
  {
    id: 'hi',
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    script: 'Devanagari',
    sttLocale: 'hi-IN',
    ttsLocales: ['hi-IN', 'hi', 'hindi'],
    sampleText: 'आपके प्लेसमेंट मॉक इंटरव्यू में आपका स्वागत है। चलिए आपके परिचय से शुरू करते हैं।',
    greeting: 'नमस्ते! आपके प्लेसमेंट इंटरव्यू राउंड में आपका स्वागत है।',
    inputPlaceholder: 'यहाँ अपना उत्तर लिखें या बोलने के लिए माइक पर क्लिक करें...',
    codeSwitchingAllowed: true,
    evaluationGuidance: 'Evaluate the conceptual relevance and substance in Hindi/Hinglish. Candidates may use English technical loanwords or romanized technical vocabulary—evaluate meaning rather than purist Hindi vocabulary.'
  },
  {
    id: 'ta',
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    script: 'Tamil',
    sttLocale: 'ta-IN',
    ttsLocales: ['ta-IN', 'ta', 'tamil', 'ta-LK'],
    sampleText: 'உங்கள் கேம்பஸ் நேர்காணலுக்கு நல்வரவு. உங்கள் தொழில்நுட்ப அறிமுகத்துடன் தொடங்குவோம்.',
    greeting: 'வணக்கம்! உங்கள் நேர்காணல் சுற்றுக்கு நல்வரவு.',
    inputPlaceholder: 'உங்கள் பதிலை இங்கே தட்டச்சு செய்யவும் அல்லது பேச மைக்-ஐ அழுத்தவும்...',
    codeSwitchingAllowed: true,
    evaluationGuidance: 'Evaluate technical logic and clarity in Tamil. Mixed usage of English technical terminology (Tanglish/Tech Tamil) is standard and should receive full credit for conceptual accuracy.'
  },
  {
    id: 'kn',
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    flag: '🇮🇳',
    script: 'Kannada',
    sttLocale: 'kn-IN',
    ttsLocales: ['kn-IN', 'kn', 'kannada'],
    sampleText: 'ನಿಮ್ಮ ಪ್ಲೇಸ್‌ಮೆಂಟ್ ಮಾಕ್ ಸಂದರ್ಶನಕ್ಕೆ ಸ್ವಾಗತ. ನಿಮ್ಮ ತಾಂತ್ರಿಕ ಪರಿಚಯದೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸೋಣ.',
    greeting: 'ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಪ್ಲೇಸ್‌ಮೆಂಟ್ ಸಂದರ್ಶನಕ್ಕೆ ಸ್ವಾಗತ.',
    inputPlaceholder: 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಲು ಮೈಕ್ ಬಳಸಿ...',
    codeSwitchingAllowed: true,
    evaluationGuidance: 'Evaluate conceptual strength and problem-solving clarity in Kannada. Allow natural mixing of English programming terms and evaluate technical understanding without linguistic bias.'
  },
  {
    id: 'ml',
    code: 'ml-IN',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    flag: '🇮🇳',
    script: 'Malayalam',
    sttLocale: 'ml-IN',
    ttsLocales: ['ml-IN', 'ml', 'malayalam'],
    sampleText: 'നിങ്ങളുടെ പ്ലേസ്മെന്റ് മോക്ക് ഇന്റർവ്യൂവിലേക്ക് സ്വാഗതം. നിങ്ങളുടെ ആമുഖത്തോടെ നമുക്ക് ആരംഭിക്കാം.',
    greeting: 'നമസ്കാരം! നിങ്ങളുടെ പ്ലേസ്മെന്റ് ഇന്റർവ്യൂവിലേക്ക് സ്വാഗതം.',
    inputPlaceholder: 'നിങ്ങളുടെ ഉത്തരം ഇവിടെ ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ സംസാരിക്കാൻ മൈക്ക് ക്ലിക്ക് ചെയ്യുക...',
    codeSwitchingAllowed: true,
    evaluationGuidance: 'Evaluate clarity, logic, and subject mastery in Malayalam. Accept blended English technical phrasing commonly used in engineering universities.'
  }
];

/**
 * Normalizes any language identifier, code, or alias to a valid LanguageConfig.
 */
export function getLanguageConfig(identifier?: string): LanguageConfig {
  if (!identifier) return SUPPORTED_LANGUAGES[0];

  const lower = identifier.toLowerCase().trim();

  // 1. Direct ID match
  const byId = SUPPORTED_LANGUAGES.find(l => l.id === lower);
  if (byId) return byId;

  // 2. Direct code match (e.g. 'te-IN', 'hi-IN')
  const byCode = SUPPORTED_LANGUAGES.find(l => l.code.toLowerCase() === lower);
  if (byCode) return byCode;

  // 3. Prefix match (e.g. 'te', 'hi', 'ta', 'kn', 'ml')
  const byPrefix = SUPPORTED_LANGUAGES.find(l => lower.startsWith(l.id));
  if (byPrefix) return byPrefix;

  // 4. Fallback to English
  return SUPPORTED_LANGUAGES[0];
}

/**
 * Checks whether the browser has a Text-To-Speech voice for this language.
 */
export function checkVoiceSupport(
  langIdentifier: string,
  voices: SpeechSynthesisVoice[]
): {
  supported: boolean;
  matchingVoices: SpeechSynthesisVoice[];
  preferredVoice?: SpeechSynthesisVoice;
  message: string;
} {
  const config = getLanguageConfig(langIdentifier);

  if (!voices || voices.length === 0) {
    return {
      supported: false,
      matchingVoices: [],
      message: 'No speech voices are currently loaded in your browser.'
    };
  }

  // Find voices matching any of the language's ttsLocales
  const matchingVoices = voices.filter(voice => {
    const vLang = (voice.lang || '').toLowerCase().replace('_', '-');
    const vName = (voice.name || '').toLowerCase();
    return config.ttsLocales.some(loc => {
      const target = loc.toLowerCase();
      return vLang === target || vLang.startsWith(target + '-') || vName.includes(target);
    });
  });

  if (matchingVoices.length > 0) {
    // Pick highest quality (Natural, Google, Online, Neural)
    const preferred = matchingVoices.find(v => 
      v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online') || v.name.includes('Neural')
    ) || matchingVoices[0];

    return {
      supported: true,
      matchingVoices,
      preferredVoice: preferred,
      message: `Found ${matchingVoices.length} native voice(s) for ${config.name} (${config.nativeName}).`
    };
  }

  return {
    supported: false,
    matchingVoices: [],
    message: `Your browser has no installed voice for ${config.name} (${config.nativeName}). Question text will be displayed visually, and audio fallback will be available.`
  };
}

/**
 * Checks whether Web Speech Recognition is supported for this language.
 */
export function checkSTTSupport(langIdentifier: string): {
  supported: boolean;
  locale: string;
  message: string;
} {
  const config = getLanguageConfig(langIdentifier);
  const hasWebSpeech = typeof window !== 'undefined' && 
    (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);

  if (!hasWebSpeech) {
    return {
      supported: false,
      locale: config.sttLocale,
      message: 'Speech recognition is not supported in this browser. Please use Chrome/Edge or type your answers.'
    };
  }

  return {
    supported: true,
    locale: config.sttLocale,
    message: `Speech recognition is available for ${config.name} (${config.sttLocale}).`
  };
}
