import { LanguageInfo, SupportedLanguageCode } from '../types';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguageCode, LanguageInfo> = {
  'as-IN': {
    code: 'as-IN',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    script: 'Bengali-Assamese',
    region: 'Assam, Northeast India',
    capabilities: {
      text: true,
      voiceInput: false,
      tts: false,
      ttsVoiceAvailable: false,
      statusNote: 'Voice support for Assamese is currently under development.',
    }
  },
  'brx-IN': {
    code: 'brx-IN',
    name: 'Bodo',
    nativeName: 'बड़ो',
    script: 'Devanagari',
    region: 'Bodoland, Assam',
    capabilities: {
      text: true,
      voiceInput: false,
      tts: false,
      ttsVoiceAvailable: false,
      statusNote: 'Voice support for Bodo is currently under development.',
    }
  },
  'mni-IN': {
    code: 'mni-IN',
    name: 'Manipuri / Meitei',
    nativeName: 'মৈতৈ / Meiteilon',
    script: 'Meitei Mayek / Bengali',
    region: 'Manipur, Northeast India',
    capabilities: {
      text: true,
      voiceInput: false,
      tts: false,
      ttsVoiceAvailable: false,
      statusNote: 'Voice support for Manipuri is currently under development.',
    }
  },
  'trp-IN': {
    code: 'trp-IN',
    name: 'Kokborok',
    nativeName: 'ককবোরক',
    script: 'Bengali / Roman',
    region: 'Tripura, Northeast India',
    capabilities: {
      text: true,
      voiceInput: false,
      tts: false,
      ttsVoiceAvailable: false,
      statusNote: 'Voice support for Kokborok is currently under development.',
    }
  },
  'lus-IN': {
    code: 'lus-IN',
    name: 'Mizo',
    nativeName: 'Mizo ṭawng',
    script: 'Roman',
    region: 'Mizoram, Northeast India',
    capabilities: {
      text: true,
      voiceInput: false,
      tts: false,
      ttsVoiceAvailable: false,
      statusNote: 'Voice support for Mizo is currently under development.',
    }
  },
  'hi-IN': {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिंदी',
    script: 'Devanagari',
    region: 'India (National)',
    capabilities: {
      text: true,
      voiceInput: true,
      tts: true,
      ttsVoiceAvailable: true,
      statusNote: 'Full text, voice input & speech synthesis active.',
    }
  },
  'en-IN': {
    code: 'en-IN',
    name: 'English (India)',
    nativeName: 'English',
    script: 'Latin',
    region: 'India & Global',
    capabilities: {
      text: true,
      voiceInput: true,
      tts: true,
      ttsVoiceAvailable: true,
      statusNote: 'Full text, voice input & speech synthesis active.',
    }
  }
};

export function frontendToBackendLang(code: string): string {
  switch (code) {
    case 'as-IN': return 'as';
    case 'brx-IN': return 'brx';
    case 'mni-IN': return 'mni';
    case 'trp-IN': return 'kokborok';
    case 'lus-IN': return 'mizo';
    case 'hi-IN': return 'hi';
    case 'en-IN': return 'en';
    default: return code.split('-')[0].toLowerCase();
  }
}

export function backendToFrontendLang(code: string): SupportedLanguageCode {
  const norm = code.toLowerCase().split('-')[0];
  switch (norm) {
    case 'as': return 'as-IN';
    case 'brx': return 'brx-IN';
    case 'mni': return 'mni-IN';
    case 'kokborok':
    case 'trp': return 'trp-IN';
    case 'mizo':
    case 'lus': return 'lus-IN';
    case 'hi': return 'hi-IN';
    case 'en': return 'en-IN';
    default: return 'en-IN';
  }
}

export async function syncLanguagesFromBackend(): Promise<void> {
  try {
    const { languagesApi } = await import('../api/languages');
    const backendLangs = await languagesApi.listLanguages();
    if (Array.isArray(backendLangs) && backendLangs.length > 0) {
      backendLangs.forEach((bl) => {
        const feCode = backendToFrontendLang(bl.language_code);
        if (SUPPORTED_LANGUAGES[feCode]) {
          const ttsAvail = bl.capabilities?.tts?.available ?? false;
          const sttAvail = bl.capabilities?.stt?.available ?? false;
          SUPPORTED_LANGUAGES[feCode].capabilities.tts = ttsAvail;
          SUPPORTED_LANGUAGES[feCode].capabilities.voiceInput = sttAvail;
          SUPPORTED_LANGUAGES[feCode].capabilities.statusNote = 
            (!ttsAvail || !sttAvail) 
              ? `Voice support for ${bl.display_name} is currently under development.` 
              : `Full text, voice input & speech synthesis active.`;
        }
      });
    }
  } catch (err) {
    // Fallback to static verified capability registry
    console.debug('[LanguageCapabilities] Backend language registry offline, using local registry.');
  }
}

export const LANGUAGE_LIST = Object.values(SUPPORTED_LANGUAGES);

export function getLanguageInfo(code: SupportedLanguageCode): LanguageInfo {
  return SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES['en-IN'];
}

export function isTTSAvailable(code: SupportedLanguageCode): boolean {
  return !!SUPPORTED_LANGUAGES[code]?.capabilities.tts;
}

export function isVoiceInputAvailable(code: SupportedLanguageCode): boolean {
  return !!SUPPORTED_LANGUAGES[code]?.capabilities.voiceInput;
}

export function getVoiceStatusMessage(code: SupportedLanguageCode): string {
  const lang = getLanguageInfo(code);
  if (!lang.capabilities.tts || !lang.capabilities.voiceInput) {
    return `Voice support for ${lang.name} is currently under development.`;
  }
  return `Voice support active for ${lang.name}.`;
}

// Translations registry for core UI elements across all 7 languages
export const UI_TRANSLATIONS: Record<string, Record<SupportedLanguageCode, string>> = {
  // Brand & Welcome
  'app_tagline': {
    'en-IN': 'Cognitive Wellness & Medication Companion',
    'hi-IN': 'संज्ञानात्मक स्वास्थ्य और दवा साथी',
    'as-IN': 'জ্ঞানীয় সুস্থতা আৰু ঔষধৰ সংগী',
    'brx-IN': 'गियानआरि मोजां थासारि आरो मुलि सांग्रांथि',
    'mni-IN': 'লৌশিংগী হকশেল অমসুং হিদাক-লাংথক্কী মরুপ',
    'trp-IN': 'ककबरक कग्निटीभ वेलनेस आरो औसध साथी',
    'lus-IN': 'Hriselna leh damdawi eina kawngpui'
  },
  'welcome_greeting': {
    'en-IN': 'Welcome to Memogram',
    'hi-IN': 'मेमोग्राम में आपका स्वागत है',
    'as-IN': 'মেমোগ্ৰামলৈ স্বাগতম',
    'brx-IN': 'मेमोग्रामआव बरायबाय',
    'mni-IN': 'মেমোগ্রামদা তরাম্না ওকচরি',
    'trp-IN': 'मेमोग्राम ओ स्वागत',
    'lus-IN': 'Memogram-ah kan lo lawm a che'
  },
  'welcome_desc': {
    'en-IN': 'A gentle, warm space designed to support memory, daily routines, medication reminders, and family connections.',
    'hi-IN': 'स्मृति, दैनिक दिनचर्या, दवा की याद दिलाने और पारिवारिक संबंधों को समर्थन देने के लिए एक सरल, सहज स्थान।',
    'as-IN': 'স্মৃতিশক্তি, দৈনন্দিন কাম, ঔষধৰ সোঁৱৰণী আৰু পৰিয়ালৰ সংযোগ বজাই ৰখাৰ বাবে এক সহজ মঞ্চ।',
    'brx-IN': 'गोसोखांथि, सानफ्रोमबोनि हाबाफारि आरो मुलि गोसोखांहोग्रा मोजां थासारि।',
    'mni-IN': 'নিংথিংনা নিংশিংবা, নোংমগী থবক, হিদাক নীংশিংবা অমসুং ইমুংগী মরীগীদমক শেম্বা।',
    'trp-IN': 'ककबरक कासामा आरो औसध सम्बन्धीय शान्ति मञ्च।',
    'lus-IN': 'Hriatrengna, nitin hunbi, damdawi ei hun leh chhungkaw inzawmna atan.'
  },
  'get_started': {
    'en-IN': 'Get Started',
    'hi-IN': 'शुरू करें',
    'as-IN': 'আৰম্ভ কৰক',
    'brx-IN': 'जागायदो',
    'mni-IN': 'হৌদোকপসি',
    'trp-IN': 'जागायदी',
    'lus-IN': 'Tan rawh le'
  },
  'role_question': {
    'en-IN': 'What brings you to Memogram?',
    'hi-IN': 'आप मेमोग्राम पर किस रूप में आए हैं?',
    'as-IN': 'আপুনি মেমোগ্ৰামলৈ কি হিচাপে আহিছে?',
    'brx-IN': 'नोंथाङा मेमोग्रामआव मानो फैदों?',
    'mni-IN': 'নহাক মেমোগ্রামদা করম্বগীদমক লাকপগে?',
    'trp-IN': 'नों मेमोग्रामो मा हिसाबै फैखा?',
    'lus-IN': 'Memogram-ah eng ti tura lo kal nge i nih?'
  },
  'role_caretaker': {
    'en-IN': 'Caretaker',
    'hi-IN': 'देखभालकर्ता (Caretaker)',
    'as-IN': 'শুশ্ৰূষাকাৰী (Caretaker)',
    'brx-IN': 'सामलायगिरि (Caretaker)',
    'mni-IN': 'য়োকখৎপীবা (Caretaker)',
    'trp-IN': 'सामलायग्रा (Caretaker)',
    'lus-IN': 'Enkawltu (Caretaker)'
  },
  'role_patient': {
    'en-IN': 'Patient / Elder',
    'hi-IN': 'रोगी / वरिष्ठजन (Patient)',
    'as-IN': 'ৰোগী / জ্যেষ্ঠজন (Patient)',
    'brx-IN': 'बेमारि / आफा (Patient)',
    'mni-IN': 'অনাবা / অহল (Patient)',
    'trp-IN': 'बेमारी / बृद्ध (Patient)',
    'lus-IN': 'Damlou / Pitar-Putar (Patient)'
  },
  // Patient Greetings
  'how_are_you': {
    'en-IN': 'How are you doing today?',
    'hi-IN': 'आज आपका दिन कैसा चल रहा है?',
    'as-IN': 'আজি আপোনাৰ দিনটো কেনে চলিছে?',
    'brx-IN': 'दिनै नोंथांनि सानआ माबोरै थांदों?',
    'mni-IN': 'ঙসি অদোম করম্না লৈরি?',
    'trp-IN': 'दिनै नोंथांनि दिनआ बोरै?',
    'lus-IN': 'Vawiin eng nge i an le?'
  },
  'tap_to_speak': {
    'en-IN': 'Tap to Speak',
    'hi-IN': 'बोलने के लिए दबाएं',
    'as-IN': 'কবলৈ স্পৰ্শ কৰক',
    'brx-IN': 'रायलानो थु',
    'mni-IN': 'ঙাংনবগীদমক নম্বিয়ু',
    'trp-IN': 'कक सानो थाखाय थु',
    'lus-IN': 'Tawng turin hmet rawh'
  },
  'listening': {
    'en-IN': 'Listening to you...',
    'hi-IN': 'आपकी बात सुन रहे हैं...',
    'as-IN': 'আপোনাৰ কথা শুনি থকা হৈছে...',
    'brx-IN': 'नोंथांनि खोथा खोनासं गासिनो दं...',
    'mni-IN': 'নহাক্কী ৱা তাবা লৈরি...',
    'trp-IN': 'नोंनि कक खनासं गासिनो दं...',
    'lus-IN': 'I tawng ka ngaithla e...'
  },
  'id_like_to_tell': {
    'en-IN': "I'd like to tell you...",
    'hi-IN': 'मैं आपको बताना चाहता हूँ...',
    'as-IN': 'মই আপোনাক ক’ব বিচাৰো...',
    'brx-IN': 'आं नोंथांनो खोनथानो लुबैयो...',
    'mni-IN': 'ঐহাক্না অদোমদা খঙহনবা পাম্মি...',
    'trp-IN': 'आं नोंनो खोनथानो सानो...',
    'lus-IN': 'Hrilh duh che ka nei a...'
  },
  'lets_play_game': {
    'en-IN': "Let's play a game!",
    'hi-IN': 'आइए एक मजेदार खेल खेलें!',
    'as-IN': 'আহক এটা খেল খেলোঁ!',
    'brx-IN': 'फै खेल गेलेदिनि!',
    'mni-IN': 'লৈনু খেলা অমতা শানসি!',
    'trp-IN': 'फै मोजां गेलेदिनि!',
    'lus-IN': 'Infiamna i khel ang hmiang!'
  },
  'todays_medicines': {
    'en-IN': "Today's Medicines",
    'hi-IN': 'आज की दवाइयाँ',
    'as-IN': 'আজিৰ ঔষধসমূহ',
    'brx-IN': 'दिनैनि मुलिफोर',
    'mni-IN': 'ঙসিগী হিদাকশিং',
    'trp-IN': 'दिनैनि औसधफोर',
    'lus-IN': 'Vawiina damdawi ei turte'
  },
  'listen': {
    'en-IN': 'Listen',
    'hi-IN': 'सुनिए',
    'as-IN': 'শুনক',
    'brx-IN': 'खोनासं',
    'mni-IN': 'তাবিয়ু',
    'trp-IN': 'खनासं',
    'lus-IN': 'Ngaithla rawh'
  },
  'remind_me_later': {
    'en-IN': 'Remind me later',
    'hi-IN': 'बाद में याद दिलाएं',
    'as-IN': 'পিছত সোঁৱৰাই দিব',
    'brx-IN': 'उनाव गोसोखांहो',
    'mni-IN': 'তুংদা নীংশিংহল্লু',
    'trp-IN': 'उनाव खनथाहै',
    'lus-IN': 'Nakinah min hriattir leh rawh'
  },
  'took_it': {
    'en-IN': 'Took it',
    'hi-IN': 'दवा ले ली',
    'as-IN': 'ঔষধ খালোঁ',
    'brx-IN': 'मुलि जाबाय',
    'mni-IN': 'হিদাক চারে',
    'trp-IN': 'औसध लाखाबाय',
    'lus-IN': 'Ka ei tawh e'
  },
  'sos_help': {
    'en-IN': 'SOS HELP',
    'hi-IN': 'आपातकालीन सहायता (SOS)',
    'as-IN': 'জৰুৰীকালীন সহায় (SOS)',
    'brx-IN': 'थाब जाथाय हेफाजाब (SOS)',
    'mni-IN': 'অকুপ্পা মতেং (SOS)',
    'trp-IN': 'জরুরী सहायता (SOS)',
    'lus-IN': 'Puihna Ngenna (SOS)'
  },
  // Games
  'games_title': {
    'en-IN': 'Games',
    'hi-IN': 'मनोरंजक खेल',
    'as-IN': 'খেলসমূহ',
    'brx-IN': 'गेलेनायफोर',
    'mni-IN': 'শান-খোৎনবা',
    'trp-IN': 'गेलेनाय',
    'lus-IN': 'Infiamnate'
  },
  'choose_game': {
    'en-IN': 'Choose a game to play',
    'hi-IN': 'खेलने के लिए कोई खेल चुनें',
    'as-IN': 'খেলিবলৈ এটা খেল বাচক',
    'brx-IN': 'गेलेनोगौ मोनसे खेल सायख’',
    'mni-IN': 'শাননবগীদমক খেলা অমা খল্লু',
    'trp-IN': 'गेलेनोगौ मन्से खेल सायख',
    'lus-IN': 'Khelh tur thlang rawh'
  },
  // Game 1
  'game_groceries_title': {
    'en-IN': 'Groceries Shopping',
    'hi-IN': 'किराना खरीदारी (Groceries)',
    'as-IN': 'বজাৰৰ সামগ্ৰী (Groceries)',
    'brx-IN': 'हाथाइ बाजाराव मुवा बायनाय',
    'mni-IN': 'কৈথেল চৎপা অমসুং পোৎ লেইবা',
    'trp-IN': 'हाथाय सामाग्री बायनाय',
    'lus-IN': 'Bazar Thil Lei'
  },
  'game_groceries_desc': {
    'en-IN': 'Remember the shopping list items and find them in the pantry basket.',
    'hi-IN': 'खरीदारी सूची की वस्तुओं को याद रखें और उन्हें टोकरी में खोजें।',
    'as-IN': 'বজাৰৰ তালিকাখন মনত ৰাখক আৰু সামগ্ৰীসমূহ বাচক।',
    'brx-IN': 'मुवाफोरखौ गोसोआव लाखिनानै थिक मुवाखौ सायख’।',
    'mni-IN': 'পোৎশিংগী পরিং অদু নিংশিংদুনা শানবীয়ু।',
    'trp-IN': 'सामाग्रीफोरखौ गोसोआव लाखिना सायखदि।',
    'lus-IN': 'Thil lei turte kha hre reng la, thlang chhuak rawh.'
  },
  // Game 2
  'game_routine_title': {
    'en-IN': 'Daily Routine in Sequence',
    'hi-IN': 'दैनिक दिनचर्या का सही क्रम',
    'as-IN': 'দৈনন্দিন কামৰ সঠিক ক্ৰম',
    'brx-IN': 'सानफ्रोमबोनि हाबाफारिखौ फारि हिसाबै साजाय',
    'mni-IN': 'নোংমগী থবকশিং পরিং চান্নবা',
    'trp-IN': 'सानफ्रोमनि हाबा फारि साजायनाय',
    'lus-IN': 'Nitin Hunbi Indawt Dan'
  },
  'game_routine_desc': {
    'en-IN': 'Arrange morning and evening activities in the right natural order.',
    'hi-IN': 'सुबह से शाम की दैनिक गतिविधियों को सही क्रम में व्यवस्थित करें।',
    'as-IN': 'পুৱাৰ পৰা গধূলিলৈকে কৰিবলগীয়া কামবোৰ ক্ৰমানুসাৰে সজাওক।',
    'brx-IN': 'फुंनिफ्राय बेलासिनि हाबाफोरखौ थार फारियाव दोन।',
    'mni-IN': 'অয়ুকতগী নুমিদাং ফাওবগী থবকশিং অদু চুম্না পরিং শেম্মু।',
    'trp-IN': 'फुंनिफ्राय हाबाफारि मिलायनाय।',
    'lus-IN': 'Zing atanga tlai thlenga tih turte indawt dan dikin rem rawh.'
  },
  // Game 3
  'game_cup_shuffle_title': {
    'en-IN': 'Cup Shuffle',
    'hi-IN': 'प्याले की अदला-बदली (Cup Shuffle)',
    'as-IN': 'বাটিৰ খেল (Cup Shuffle)',
    'brx-IN': 'खोरथि सोलाय-सोल’ (Cup Shuffle)',
    'mni-IN': 'খাপ তৌনবা (Cup Shuffle)',
    'trp-IN': 'बाटी सोलायनाय (Cup Shuffle)',
    'lus-IN': 'No Thup Inthlak'
  },
  'game_cup_shuffle_desc': {
    'en-IN': 'Watch closely as the cups shuffle and track where the golden coin is hidden.',
    'hi-IN': 'ध्यान से देखें कि सिक्के वाला प्याला कहाँ जाता है।',
    'as-IN': 'মনোযোগেৰে চাওক আৰু সোণালী মুদ্ৰাটো ক’ত আছে বিচাৰি উলিয়াওক।',
    'brx-IN': 'गोसो होना नाय आरो सनानि मुद्रानि खोरथिखौ सायख’।',
    'mni-IN': 'নহাক্কী মিৎ য়েংদুনা সনাগী শেল অদু করম্বা খাপতা লৈবগে খঙদোকউ।',
    'trp-IN': 'सिक्का थानाय बाटीखौ नायदि।',
    'lus-IN': 'Rangkachak tangka awmna no chu chik takin en la, zawng chhuak rawh.'
  },
  // Game 4
  'game_cultural_match_title': {
    'en-IN': 'Cultural Memory Match',
    'hi-IN': 'सांस्कृतिक स्मृति मिलान',
    'as-IN': 'সাংস্কৃতিক স্মৃতি খেল',
    'brx-IN': 'हारिमुआरि गोसोखांथि फेरनाय',
    'mni-IN': 'চৎনবীগী মরী লৈনবা মেচ তৌবা',
    'trp-IN': 'हारिमु गोसोखांथि गेलेनाय',
    'lus-IN': 'Hnam Ziarang Hriatpawlh'
  },
  'game_cultural_match_desc': {
    'en-IN': 'Flip cards to match beloved cultural symbols, festivals, and traditional items.',
    'hi-IN': 'पारंपरिक प्रतीकों, दीयों और वाद्य यंत्रों के जोड़े मिलाएं।',
    'as-IN': 'পৰম্পৰাগত প্ৰতীক আৰু উৎসৱৰ ছবিবোৰৰ যোৰ মিলাওক।',
    'brx-IN': 'हारिमुआरि दिन्थिथि आरो मुलि-मुवाफोरनि जरा मिलाय।',
    'mni-IN': 'চৎনবীগী পোৎশকশিং অমসুং খুদমশিংগী যোরা শেম্মু।',
    'trp-IN': 'परम्परागत सङ्केत जरा मिलायदि।',
    'lus-IN': 'Hnam ziarang thil leh kût thilte a kawp zawng rawh.'
  },
  // Game 5
  'game_family_stories_title': {
    'en-IN': 'Family Memories & Stories',
    'hi-IN': 'पारिवारिक यादें और कहानियाँ',
    'as-IN': 'পৰিয়ালৰ স্মৃতি আৰু সাধু',
    'brx-IN': 'नखरनि गोसोखांथि आरो सल’',
    'mni-IN': 'ইমুংগী নিংশিংবা অমসুং ৱারী',
    'trp-IN': 'नखरनि गोसोखांथि आरो बाथ्रा',
    'lus-IN': 'Chhungkaw Hriatrengna leh Thawnthu'
  },
  'game_family_stories_desc': {
    'en-IN': 'Share and record warm memories, childhood stories, and cherished celebrations with family.',
    'hi-IN': 'परिवार के साथ अपनी सुखद यादें, बचपन के किस्से और त्योहारों के पल रिकॉर्ड करें।',
    'as-IN': 'পৰিয়ালৰ সুখৰ স্মৃতি, শৈশৱৰ কাহিনী আৰু আনন্দৰ মুহূৰ্তসমূহ ৰেকৰ্ড কৰক।',
    'brx-IN': 'नखरनि मोजां गोसोखांथि आरो उन्दै समाव जानाय सल’फोरखौ रायलायना रेकर्ड खालाम।',
    'mni-IN': 'ইমুংগী নুংঙাইবা নিংশিংবা ৱারীশিং ঙাংদুনা রেকোর্দ তৌবীয়ু।',
    'trp-IN': 'नखरनि मोजां गोसोखांथि रेकर्ड खालामदि।',
    'lus-IN': 'Chhungkaw hriatrengna hlu, thawnthu leh kût hman dante sawi la, record rawh.'
  },
  // Patient Bottom Navigation
  'nav_home': {
    'en-IN': 'Home',
    'hi-IN': 'होम',
    'as-IN': 'ঘৰ',
    'brx-IN': 'न’',
    'mni-IN': 'য়ুম',
    'trp-IN': 'न’',
    'lus-IN': 'In'
  },
  'nav_medicines': {
    'en-IN': 'Medicines',
    'hi-IN': 'दवाइयाँ',
    'as-IN': 'ঔষধ',
    'brx-IN': 'मुलिफोर',
    'mni-IN': 'হিদাকশিং',
    'trp-IN': 'औसधफोर',
    'lus-IN': 'Damdawi'
  },
  'nav_games': {
    'en-IN': 'Games',
    'hi-IN': 'खेल',
    'as-IN': 'খেল',
    'brx-IN': 'गेलेनाय',
    'mni-IN': 'শান-খোৎনবা',
    'trp-IN': 'गेलेनाय',
    'lus-IN': 'Infiamna'
  },
  'nav_alerts': {
    'en-IN': 'Alerts',
    'hi-IN': 'सूचनाएं',
    'as-IN': 'বাৰ্তা',
    'brx-IN': 'खौरां',
    'mni-IN': 'পাউতাক',
    'trp-IN': 'अलर्ट',
    'lus-IN': 'Hriattirna'
  },
  'nav_profile': {
    'en-IN': 'Profile',
    'hi-IN': 'प्रोफ़ाइल',
    'as-IN': 'প্ৰফাইল',
    'brx-IN': 'प्रफाइल',
    'mni-IN': 'প্রোফাইল',
    'trp-IN': 'प्रफाइल',
    'lus-IN': 'Profile'
  },
  'nav_settings': {
    'en-IN': 'Settings',
    'hi-IN': 'सेटिंग्स',
    'as-IN': 'ছেটিংছ',
    'brx-IN': 'सेटिंफोर',
    'mni-IN': 'সেটিংস',
    'trp-IN': 'सेटिंस',
    'lus-IN': 'Siamremna'
  },
  // Hydration Reminders
  'drink_water_title': {
    'en-IN': '💧 Drink Water',
    'hi-IN': '💧 पानी पिएं',
    'as-IN': '💧 পানী খাওক',
    'brx-IN': '💧 दै लों',
    'mni-IN': '💧 ঈশিং থকউ',
    'trp-IN': '💧 दै लोंदि',
    'lus-IN': '💧 Tui In Rawh'
  },
  'i_drank_water': {
    'en-IN': '✓ I Drank Water',
    'hi-IN': '✓ मैंने पानी पी लिया',
    'as-IN': '✓ মই পানী খালোঁ',
    'brx-IN': '✓ आं दै लोंबाय',
    'mni-IN': '✓ ঐহাক ঈশিং থকরে',
    'trp-IN': '✓ आं दै लोंखाबाय',
    'lus-IN': '✓ Tui ka in tawh e'
  },
  'water_completed_confirmation': {
    'en-IN': 'Great! Water break completed.',
    'hi-IN': 'बहुत बढ़िया! पानी पीना पूरा हुआ।',
    'as-IN': 'বৰ সুন্দৰ! পানী খোৱা সম্পূৰ্ণ হ’ল।',
    'brx-IN': 'जोबोद मोजां! दै लोंनाया जाफुंबाय।',
    'mni-IN': 'য়াম্না ফৈ! ঈশিং থকপা লোইশিল্লে।',
    'trp-IN': 'मोजां! दै लोंनाय जाबाय।',
    'lus-IN': 'A tha lutuk! Tui in a zo e.'
  },
  'hydration_title': {
    'en-IN': 'Water & Hydration',
    'hi-IN': 'पानी और जलयोजन',
    'as-IN': 'পানী খোৱাৰ সোঁৱৰণী',
    'brx-IN': 'दै लोंनाय गोसोखांहोग्रा',
    'mni-IN': 'ঈশিং থকপগী নীংশিংবা',
    'trp-IN': 'दै लोंनाय',
    'lus-IN': 'Tui In Hun'
  },
  'drink_water_prompt': {
    'en-IN': 'Drink a refreshing glass of water to stay energetic and healthy.',
    'hi-IN': 'ताजा पानी पिएं और स्वस्थ व ऊर्जावान रहें।',
    'as-IN': 'সুস্থ আৰু সতেজ হৈ থাকিবলৈ এগিলাচ নিৰ্মল পানী খাওক।',
    'brx-IN': 'मोजां थासारिनि थाखाय मोनसे ग्लास दै लों।',
    'mni-IN': 'হকশেলগীদমক অশোক-অপন য়াওদনা ঈশিং গ্লাস অমা থকউ।',
    'trp-IN': 'गोजोन थाखाय दै मन्से ग्लास लोंदि।',
    'lus-IN': 'Hrisel tak leh chak taka awm reng turin tui no khat in rawh le.'
  },
  'drank_water': {
    'en-IN': '✓ I Drank Water',
    'hi-IN': '✓ मैंने पानी पी लिया',
    'as-IN': '✓ মই পানী খালোঁ',
    'brx-IN': '✓ आं दै लोंबाय',
    'mni-IN': '✓ ঐহাক ঈশিং থকরে',
    'trp-IN': '✓ आं दै लोंखाबाय',
    'lus-IN': '✓ Tui ka in tawh e'
  },
  'hydration_glasses_today': {
    'en-IN': 'glasses completed today',
    'hi-IN': 'ग्लास पानी आज पूरा हुआ',
    'as-IN': 'গিলাচ পানী আজি খালে',
    'brx-IN': 'ग्लास दै दिनै लोंबाय',
    'mni-IN': 'গ্লাস ঈশিং ঙসি থকরে',
    'trp-IN': 'ग्लास दै लोंबाय',
    'lus-IN': 'vawiinah no in a ni tawh'
  },
  // Patient Setup Flow
  'setup_welcome_title': {
    'en-IN': 'Welcome! Let us set up your preferences',
    'hi-IN': 'नमस्ते! आइए आपकी पसंद सेट करें',
    'as-IN': 'নমস্কাৰ! আহক আপোনাৰ পছন্দ বাচক',
    'brx-IN': 'बरायबाय! नोंथांनि सायखनायखौ साजायदिनि',
    'mni-IN': 'তরাম্না ওকচরি! অদোমগী পাম্বশিং খল্লসি',
    'trp-IN': 'स्वागत! नोंनि सायखनाय मिलायदिनि',
    'lus-IN': 'Lo kal rawh! I duh dan kan lo siamrem ang e'
  },
  'setup_welcome_desc': {
    'en-IN': 'Choose your preferred language and comfortable text size. You can adjust these anytime in Settings.',
    'hi-IN': 'अपनी पसंदीदा भाषा और पढ़ने में आरामदायक अक्षर का आकार चुनें। आप इसे कभी भी सेटिंग्स में बदल सकते हैं।',
    'as-IN': 'আপোনাৰ পছন্দৰ ভাষা আৰু আৰামদায়ক আখৰৰ আকাৰ বাচক। আপুনি পিছত যিকোনো সময়ত ইয়াক সলনি কৰিব পাৰিব।',
    'brx-IN': 'नोंथांनि मोजां मोननाय राव आरो फरायनो गोरलै हांखोनि महर सायख’।',
    'mni-IN': 'নহাক্কী পাম্বা লোল অমসুং লাইনা পাবা য়াবা ময়েক্কী অচৌ-অপীক খল্লু।',
    'trp-IN': 'नोंनि मोजां मोननाय कक आरो हांखो सायखदि।',
    'lus-IN': 'I tawng duh ber leh chhiar nuam tawk hawrawp lian thlang rawh le.'
  },
  'step_language_title': {
    'en-IN': '1. Choose your language',
    'hi-IN': '1. अपनी भाषा चुनें',
    'as-IN': '১. আপোনাৰ ভাষা বাচক',
    'brx-IN': '१. नोंथांनि राव सायख’',
    'mni-IN': '১. নহাক্কী লোল খল্লু',
    'trp-IN': '१. नोंनि कक सायख',
    'lus-IN': '1. I tawng hman duh thlang rawh'
  },
  'step_font_title': {
    'en-IN': '2. Choose your text size',
    'hi-IN': '2. अक्षर का आकार चुनें',
    'as-IN': '২. আখৰৰ আকাৰ বাচক',
    'brx-IN': '२. हांखोनि महर सायख’',
    'mni-IN': '২. ময়েক্কী অচৌবা খল্লু',
    'trp-IN': '२. हांखो सायख',
    'lus-IN': '2. Hawrawp len zawng thlang rawh'
  },
  'font_standard': {
    'en-IN': 'Standard',
    'hi-IN': 'सामान्य',
    'as-IN': 'সাধাৰণ',
    'brx-IN': 'सरासनस्रा',
    'mni-IN': 'চুম্বা',
    'trp-IN': 'साधारण',
    'lus-IN': 'Pangngai'
  },
  'font_large': {
    'en-IN': 'Large',
    'hi-IN': 'बड़ा',
    'as-IN': 'ডাঙৰ',
    'brx-IN': 'गेदेर',
    'mni-IN': 'চাউবা',
    'trp-IN': 'गेदेर',
    'lus-IN': 'Lian'
  },
  'font_extra_large': {
    'en-IN': 'Extra Large',
    'hi-IN': 'बहुत बड़ा',
    'as-IN': 'অধিক ডাঙৰ',
    'brx-IN': 'जोबोद गेदेर',
    'mni-IN': 'য়াম্না চাউবা',
    'trp-IN': 'खुप गेदेर',
    'lus-IN': 'Lian Lehual'
  },
  'continue_to_home': {
    'en-IN': 'Save & Enter Home',
    'hi-IN': 'सहेजें और आगे बढ़ें',
    'as-IN': 'সংৰক্ষণ কৰি আগবাঢ়ক',
    'brx-IN': 'दोनथुम आरो हाब',
    'mni-IN': 'শেভ তৌদুনা চঙলু',
    'trp-IN': 'दोनथुम आरो थां',
    'lus-IN': 'Vawng tha la, lût rawh le'
  },
  // Settings Sections
  'settings_title': {
    'en-IN': 'Settings & Preferences',
    'hi-IN': 'सेटिंग्स और प्राथमिकताएं',
    'as-IN': 'ছেটিংছ আৰু পছন্দ',
    'brx-IN': 'सेटिं आरो सायखनाय',
    'mni-IN': 'সেটিংস অমসুং পাম্বশিং',
    'trp-IN': 'सेटिंस आरो सायखनाय',
    'lus-IN': 'Siamremna leh Duhthlante'
  },
  'settings_sound_cues': {
    'en-IN': 'Sound & Audio Cues',
    'hi-IN': 'ध्वनि और ऑडियो संकेत',
    'as-IN': 'শব্দ আৰু সংকেত',
    'brx-IN': 'रिंथि आरो सोदोब',
    'mni-IN': 'খোন্থোক অমসুং পাউতাক',
    'trp-IN': 'खोन्थोक आरो सोदोब',
    'lus-IN': 'Ri leh Hriattirna Aw'
  },
  'settings_notifications': {
    'en-IN': 'Notifications & Reminders',
    'hi-IN': 'सूचनाएं और रिमाइंडर',
    'as-IN': 'জাননী আৰু সোঁৱৰণী',
    'brx-IN': 'खौरां आरो गोसोखांहोग्रा',
    'mni-IN': 'পাউতাক অমসুং নীংশিংবা',
    'trp-IN': 'खौरां आरो रिमाइंडर',
    'lus-IN': 'Hriattirna leh Hriatrengnate'
  },
  'settings_time_mgmt': {
    'en-IN': 'Daily Time & Quiet Hours',
    'hi-IN': 'दैनिक समय और शांत समय',
    'as-IN': 'দৈনন্দিন সময় আৰু বিশ্ৰাম',
    'brx-IN': 'सानफ्रोमबोनि सम आरो गोजोन सम',
    'mni-IN': 'নোংমগী মতম অমসুং পোথার মতম',
    'trp-IN': 'सम आरो विश्राम',
    'lus-IN': 'Nitin Hunbi leh Hun Reh'
  },
  'settings_device_perms': {
    'en-IN': 'Device Permissions',
    'hi-IN': 'डिवाइस अनुमतियाँ',
    'as-IN': 'ডিভাইচৰ অনুমতি',
    'brx-IN': 'दिव्हाइसनि गेवनाय',
    'mni-IN': 'দিভাইসকী অয়াবা',
    'trp-IN': 'अनुमति',
    'lus-IN': 'Hmanrua Phalnate'
  },
  'settings_help_support': {
    'en-IN': 'Help & Caregiver Contact',
    'hi-IN': 'सहायता और देखभालकर्ता संपर्क',
    'as-IN': 'সহায় আৰু অভিভাৱকৰ সৈতে যোগাযোগ',
    'brx-IN': 'हेफाजाब आरो सामलायगिरि',
    'mni-IN': 'মতেং অমসুং য়োকখৎপিবগা পাউ ফাওনবা',
    'trp-IN': 'मदद आरो सामलायग्रा',
    'lus-IN': 'Puihna leh Enkawltu Biakna'
  },
  'settings_about': {
    'en-IN': 'About Memogram',
    'hi-IN': 'मेमोग्राम के बारे में',
    'as-IN': 'মেমোগ্ৰামৰ বিষয়ে',
    'brx-IN': 'मेमोग्रामनि बागै',
    'mni-IN': 'মেমোগ্রামগী মরমদা',
    'trp-IN': 'मेमोग्रामनि सायाव',
    'lus-IN': 'Memogram Chungchang'
  },
  'settings_terms': {
    'en-IN': 'Terms & Privacy',
    'hi-IN': 'शर्तें और गोपनीयता',
    'as-IN': 'চৰ্তাৱলী আৰু গোপনীয়তা',
    'brx-IN': 'नेम-खान्थि आरो गुबुन',
    'mni-IN': 'নিয়ম অমসুং অরোইবা',
    'trp-IN': 'नेम-खान्थि',
    'lus-IN': 'Dan leh Hriatna Thup Dan'
  },
  'settings_logout': {
    'en-IN': 'Sign Out',
    'hi-IN': 'लॉग आउट',
    'as-IN': 'লগ আউট কৰক',
    'brx-IN': 'अंखादो',
    'mni-IN': 'থোক্লু',
    'trp-IN': 'अंखादो',
    'lus-IN': 'Chhuak rawh'
  }
};

export function t(key: string, lang: SupportedLanguageCode = 'en-IN', fallback: SupportedLanguageCode = 'en-IN'): string {
  if (UI_TRANSLATIONS[key] && UI_TRANSLATIONS[key][lang]) {
    return UI_TRANSLATIONS[key][lang];
  }
  if (UI_TRANSLATIONS[key] && UI_TRANSLATIONS[key][fallback]) {
    return UI_TRANSLATIONS[key][fallback];
  }
  return key;
}
