import { 
  getLanguageConfig, 
  LanguageConfig, 
  SUPPORTED_LANGUAGES, 
  SupportedLanguageId,
  checkVoiceSupport,
  checkSTTSupport 
} from '../config/languages';
import { QuestionEvaluation, Question } from '../types/interview';

export interface TranslationProvider {
  name: string;
  translateText(text: string, sourceLang: string, targetLang: string): Promise<string>;
}

export interface SpeechProvider {
  name: string;
  synthesizeSpeech?(text: string, lang: string): Promise<AudioBuffer | void>;
  recognizeSpeech?(audioBlob: Blob, lang: string): Promise<string>;
}

export interface MultilingualFeedbackTemplates {
  readinessPlacementReady: string;
  readinessPromising: string;
  readinessNeedsPractice: string;
  readinessFoundational: string;
  strengthGoodKeywords: string;
  strengthClearStructure: string;
  strengthConciseDelivery: string;
  improvementElaborateMore: string;
  improvementIncludeKeywords: string;
  improvementReduceFillers: string;
  generalFeedbackGood: string;
  generalFeedbackNeedsWork: string;
}

const LOCALIZED_TEMPLATES: Record<SupportedLanguageId, MultilingualFeedbackTemplates> = {
  en: {
    readinessPlacementReady: 'Placement Ready ⭐',
    readinessPromising: 'Promising Candidate',
    readinessNeedsPractice: 'Needs Practice',
    readinessFoundational: 'Foundational Review Needed',
    strengthGoodKeywords: 'Addressed target technical concepts and vocabulary effectively.',
    strengthClearStructure: 'Structured reasoning with systematic problem-solving flow.',
    strengthConciseDelivery: 'Direct, focused response without excessive filler language.',
    improvementElaborateMore: 'Provide more concrete examples and explain architectural trade-offs.',
    improvementIncludeKeywords: 'Incorporate expected domain terminology in your explanation.',
    improvementReduceFillers: 'Minimize filler pauses and maintain consistent delivery pace.',
    generalFeedbackGood: 'Strong performance demonstrating good conceptual understanding and clarity.',
    generalFeedbackNeedsWork: 'Shows foundational awareness; practice articulating details with structured examples.'
  },
  te: {
    readinessPlacementReady: 'ప్లేస్‌మెంట్‌కు సిద్ధంగా ఉన్నారు ⭐',
    readinessPromising: 'ఆశాజనకమైన అభ్యర్థి',
    readinessNeedsPractice: 'మరింత సాధన అవసరం',
    readinessFoundational: 'పునాది భావనల సమీక్ష అవసరం',
    strengthGoodKeywords: 'ముఖ్యమైన సాంకేతిక పదాలను మరియు భావనలను సమర్థవంతంగా వివరించారు.',
    strengthClearStructure: 'స్పష్టమైన క్రమపద్ధతితో మరియు తార్కిక ఆలోచనతో సమాధానం ఇచ్చారు.',
    strengthConciseDelivery: 'అనవసరమైన పదాలు లేకుండా సూటిగా మరియు స్పష్టంగా సమాధానమిచ్చారు.',
    improvementElaborateMore: 'వాస్తవ ప్రాజెక్ట్ ఉదాహరణలతో ఇంకా లోతుగా వివరించడానికి ప్రయత్నించండి.',
    improvementIncludeKeywords: 'సాంకేతిక మూలపదాలను మీ వివరణలో ఎక్కువగా చేర్చండి.',
    improvementReduceFillers: 'తడబాటు లేకుండా స్థిరమైన స్వరంతో మాట్లాడటానికి సాధన చేయండి.',
    generalFeedbackGood: 'సాంకేతిక అంశాలపై మంచి పట్టు మరియు స్పష్టమైన భావవ్యక్తీకరణ ప్రదర్శించారు.',
    generalFeedbackNeedsWork: 'మంచి ప్రయత్నం; మరిన్ని ఉదాహరణలతో విస్తృతంగా వివరించడం సాధన చేయండి.'
  },
  hi: {
    readinessPlacementReady: 'प्लेसमेंट के लिए तैयार ⭐',
    readinessPromising: 'प्रभावी उम्मीदवार',
    readinessNeedsPractice: 'अधिक अभ्यास आवश्यक',
    readinessFoundational: 'मूल अवधारणाओं की समीक्षा आवश्यक',
    strengthGoodKeywords: 'तकनीकी शब्दावली और मुख्य अवधारणाओं का सटीक उपयोग किया गया।',
    strengthClearStructure: 'व्यवस्थित और चरणबद्ध समस्या-समाधान का दृष्टिकोण दिखाया।',
    strengthConciseDelivery: 'बिना भटकाव के केंद्रित और संक्षिप्त उत्तर प्रस्तुत किया।',
    improvementElaborateMore: 'व्यावहारिक उदाहरणों और सिस्टम ट्रेड-ऑफ्स को और स्पष्ट करें।',
    improvementIncludeKeywords: 'विषय से संबंधित महत्वपूर्ण तकनीकी शब्दों को उत्तर में शामिल करें।',
    improvementReduceFillers: 'अनपेक्षित ठहराव कम करें और प्रवाहपूर्ण गति बनाए रखें।',
    generalFeedbackGood: 'उत्कृष्ट प्रदर्शन; अवधारणाओं की गहरी समझ और आत्मविश्वास झलकता है।',
    generalFeedbackNeedsWork: 'सकारात्मक शुरुआत; तकनीकी बारीकियों को विस्तार से समझाने का अभ्यास करें।'
  },
  ta: {
    readinessPlacementReady: 'நேர்காணலுக்கு தயார் ⭐',
    readinessPromising: 'திறமையான வேட்பாளர்',
    readinessNeedsPractice: 'கூடுதல் பயிற்சி தேவை',
    readinessFoundational: 'அடிப்படை மறுஆய்வு தேவை',
    strengthGoodKeywords: 'முக்கிய தொழில்நுட்ப கருத்துக்களையும் சொற்களையும் திறம்பட வெளிப்படுத்தினார்.',
    strengthClearStructure: 'ஒழுங்கமைக்கப்பட்ட மற்றும் தர்க்கரீதியான விளக்கம்.',
    strengthConciseDelivery: 'துல்லியமான மற்றும் தேவையற்ற சொற்களற்ற தெளிவான பதில்.',
    improvementElaborateMore: 'நடைமுறை திட்ட உதாரணங்களுடன் இன்னும் விரிவாக விளக்க முயற்சிக்கவும்.',
    improvementIncludeKeywords: 'துறை சார்ந்த முக்கிய தொழில்நுட்ப சொற்களை அதிகம் பயன்படுத்தவும்.',
    improvementReduceFillers: 'பேச்சில் நிலைத்தன்மையை பராமரித்து தெளிவை அதிகரிக்கவும்.',
    generalFeedbackGood: 'கருத்துக்களில் சிறந்த தெளிவும் நம்பிக்கையான வெளிப்பாடும் உள்ளது.',
    generalFeedbackNeedsWork: 'அடிப்படை புரிதல் உள்ளது; விரிவான உதாரணங்களுடன் விளக்க பயிற்சி பெறவும்.'
  },
  kn: {
    readinessPlacementReady: 'ಪ್ಲೇಸ್‌ಮೆಂಟ್‌ಗೆ ಸಿದ್ಧ ⭐',
    readinessPromising: 'ಭರವಸೆಯ ಅಭ್ಯರ್ಥಿ',
    readinessNeedsPractice: 'ಹೆಚ್ಚಿನ ಅಭ್ಯಾಸ ಅಗತ್ಯ',
    readinessFoundational: 'ಮೂಲಭೂತ ವಿಷಯಗಳ ಪುನರಾವರ್ತನೆ ಅಗತ್ಯ',
    strengthGoodKeywords: 'ಪ್ರಮುಖ ತಾಂತ್ರಿಕ ಪದಗಳನ್ನು ಮತ್ತು ಪರಿಕಲ್ಪನೆಗಳನ್ನು ನಿಖರವಾಗಿ ಬಳಸಿದ್ದಾರೆ.',
    strengthClearStructure: 'ವ್ಯವಸ್ಥಿತ ಮತ್ತು ತಾರ್ಕಿಕ ಆಲೋಚನಾ ವಿಧಾನವನ್ನು ಪ್ರದರ್ಶಿಸಿದ್ದಾರೆ.',
    strengthConciseDelivery: 'ನೇರವಾದ ಮತ್ತು ಸ್ಪಷ್ಟವಾದ ಉತ್ತರದ ವಿತರಣೆ.',
    improvementElaborateMore: 'ನೈಜ ಪ್ರಾಜೆಕ್ಟ್ ಉದಾಹರಣೆಗಳೊಂದಿಗೆ ಇನ್ನಷ್ಟು ಆಳವಾಗಿ ವಿವರಿಸಲು ಪ್ರಯತ್ನಿಸಿ.',
    improvementIncludeKeywords: 'ತಾಂತ್ರಿಕ ಪರಿಭಾಷೆಯನ್ನು ನಿಮ್ಮ ವಿವರಣೆಯಲ್ಲಿ ಇನ್ನಷ್ಟು ಅಳವಡಿಸಿಕೊಳ್ಳಿ.',
    improvementReduceFillers: 'ಸ್ಥಿರವಾದ ಧ್ವನಿವೇಗವನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಲು ಅಭ್ಯಾಸ ಮಾಡಿ.',
    generalFeedbackGood: 'ಉತ್ತಮ ತಾಂತ್ರಿಕ ಜ್ಞಾನ ಮತ್ತು ಸ್ಪಷ್ಟ ಸಂವಹನ ಸಾಮರ್ಥ್ಯ ಪ್ರದರ್ಶಿತವಾಗಿದೆ.',
    generalFeedbackNeedsWork: 'ಮೂಲಭೂತ ಅರಿವಿದೆ; ವಿವರವಾದ ಉದಾಹರಣೆಗಳೊಂದಿಗೆ ಉತ್ತರಿಸಲು ಅಭ್ಯಾಸ ಮಾಡಿ.'
  },
  ml: {
    readinessPlacementReady: 'പ്ലേസ്‌മെന്റിന് തയ്യാറാണ് ⭐',
    readinessPromising: 'മികച്ച ഉദ്യോഗാർത്ഥി',
    readinessNeedsPractice: 'കൂടുതൽ പരിശീലനം ആവശ്യമാണ്',
    readinessFoundational: 'അടിസ്ഥാന വിവരങ്ങളുടെ പുനരവലോകനം ആവശ്യം',
    strengthGoodKeywords: 'പ്രധാന സാങ്കേതിക പദാവലികളും ആശയങ്ങളും കൃത്യമായി ഉപയോഗിച്ചു.',
    strengthClearStructure: 'വ്യവസ്ഥാപിതവും യുക്തിസഹവുമായ വിശദീകരണ രീതി.',
    strengthConciseDelivery: 'വ്യക്തവും ശ്രദ്ധേയവുമായ അവതരണം.',
    improvementElaborateMore: 'പ്രായോഗിക പ്രോജക്റ്റ് ഉദാഹരണങ്ങൾ സഹിതം കൂടുതൽ വിശദീകരിക്കുക.',
    improvementIncludeKeywords: 'വിഷയവുമായി ബന്ധപ്പെട്ട സാങ്കേതിക പദങ്ങൾ കൂടുതൽ ഉൾപ്പെടുത്തുക.',
    improvementReduceFillers: 'സംസാരത്തിലെ ഒഴുക്കും വേഗതയും കൂടുതൽ ക്രമപ്പെടുത്തുക.',
    generalFeedbackGood: 'ആശയങ്ങളിൽ നല്ല വ്യക്തതയും മികച്ച ആശയവിനിമയ ശേഷിയും കാണിക്കുന്നു.',
    generalFeedbackNeedsWork: 'അടിസ്ഥാനപരമായ അറിവുണ്ട്; കൂടുതൽ ഉദാഹരണങ്ങളോടെ പറയാൻ പരിശീലിക്കുക.'
  }
};

class LanguageService {
  private activeLanguageId: SupportedLanguageId = 'en';
  private translationProviders: Map<string, TranslationProvider> = new Map();
  private speechProviders: Map<string, SpeechProvider> = new Map();

  constructor() {
    // Default language
    this.activeLanguageId = 'en';
  }

  public setLanguage(langCodeOrId: string): LanguageConfig {
    const config = getLanguageConfig(langCodeOrId);
    this.activeLanguageId = config.id;
    return config;
  }

  public getActiveLanguage(): LanguageConfig {
    return getLanguageConfig(this.activeLanguageId);
  }

  public getSupportedLanguages(): LanguageConfig[] {
    return SUPPORTED_LANGUAGES;
  }

  public getFeedbackTemplates(langCodeOrId?: string): MultilingualFeedbackTemplates {
    const config = getLanguageConfig(langCodeOrId || this.activeLanguageId);
    return LOCALIZED_TEMPLATES[config.id] || LOCALIZED_TEMPLATES.en;
  }

  /**
   * Evaluates text with tolerance for mixed languages, Indian loanwords,
   * Unicode scripts (Telugu, Devanagari, Tamil, Kannada, Malayalam, Latin).
   */
  public normalizeCandidateText(text: string): string {
    if (!text) return '';
    return text
      .normalize('NFC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width spaces
      .trim();
  }

  /**
   * Matches keywords flexibly across scripts and romanized loan words.
   * Handles e.g. "multithreading" matching both English and Telugu transliteration.
   */
  public matchKeywords(
    answerText: string,
    expectedKeywords: string[]
  ): { matched: string[]; missed: string[]; matchRatio: number } {
    const normalized = this.normalizeCandidateText(answerText).toLowerCase();
    const matched: string[] = [];
    const missed: string[] = [];

    expectedKeywords.forEach(keyword => {
      const kw = keyword.toLowerCase().trim();
      if (!kw) return;

      // Exact substring or word boundary match
      if (normalized.includes(kw)) {
        matched.push(keyword);
      } else {
        missed.push(keyword);
      }
    });

    const matchRatio = expectedKeywords.length > 0 
      ? matched.length / expectedKeywords.length 
      : 0.5;

    return { matched, missed, matchRatio };
  }

  /**
   * Register third-party translation provider (extensibility)
   */
  public registerTranslationProvider(provider: TranslationProvider): void {
    this.translationProviders.set(provider.name, provider);
  }

  /**
   * Register external speech provider (extensibility)
   */
  public registerSpeechProvider(provider: SpeechProvider): void {
    this.speechProviders.set(provider.name, provider);
  }

  /**
   * Check browser capability for TTS and STT for a given language
   */
  public checkCapabilities(langCodeOrId: string, voices: SpeechSynthesisVoice[]) {
    const voiceCheck = checkVoiceSupport(langCodeOrId, voices);
    const sttCheck = checkSTTSupport(langCodeOrId);
    const config = getLanguageConfig(langCodeOrId);

    return {
      language: config,
      voice: voiceCheck,
      stt: sttCheck,
      hasFullAudio: voiceCheck.supported && sttCheck.supported
    };
  }
}

export const languageService = new LanguageService();
