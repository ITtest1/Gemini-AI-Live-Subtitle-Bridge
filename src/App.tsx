import { useState, useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { 
  Play, 
  ExternalLink, 
  Tv, 
  Sparkles, 
  Copy, 
  Check, 
  FileText,
  AlertCircle,
  Settings,
  Plus,
  Trash2,
  Sliders,
  X,
  Pin,
  Download,
  Heart,
  Globe
} from 'lucide-react';

// Check if mobile client browser for platform-specific behaviors
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Helper function to decode URL components recursively (up to 2 levels) for beautiful human readability
function formatFriendlyUrl(urlStr: string): string {
  if (!urlStr) return '';
  try {
    let decoded = urlStr;
    try {
      // Decode twice to resolve double urlencoded entities like %255B -> %5B -> [
      decoded = decodeURIComponent(decodeURIComponent(urlStr));
    } catch (_) {
      try {
        decoded = decodeURIComponent(urlStr);
      } catch (__) {
        decoded = urlStr;
      }
    }
    return decoded;
  } catch (e) {
    return urlStr;
  }
}

// Helper to determine if text belongs to the target language configuration
function isTargetLanguage(text: string, langCode: string): boolean {
  if (!text) return false;
  const langLower = langCode.toLowerCase();

  // Regex checks for main characters of different target languages
  const hasHanzi = /[\u4e00-\u9fa5]/.test(text);
  const hasKana = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
  const hasHangul = /[\uac00-\ud7a3]/.test(text);

  if (langLower.includes("chinese") || langLower === "zh") {
    // Chinese: must contain Hanzi, and not Japanese kana
    return hasHanzi && !hasKana;
  }
  if (langLower.includes("japanese") || langLower === "ja") {
    // Japanese: must contain Kana
    return hasKana;
  }
  if (langLower.includes("korean") || langLower === "ko") {
    // Korean: must contain Hangul
    return hasHangul;
  }

  // For other non-CJK languages (English, Spanish, French, German, Italian, etc.),
  // we default to verifying the text does not contain CJK (Chinese, Japanese, Korean) characters.
  return !hasHanzi && !hasKana && !hasHangul;
}

const LANGUAGES_LIST = [
  { code: "zh-TW", name: "Traditional Chinese", labelZh: "繁體中文 (Traditional Chinese)", labelEn: "Traditional Chinese" },
  { code: "zh-CN", name: "Simplified Chinese", labelZh: "簡體中文 (Simplified Chinese)", labelEn: "Simplified Chinese" },
  { code: "en", name: "English", labelZh: "英文 (English)", labelEn: "English" },
  { code: "ja", name: "Japanese", labelZh: "日文 (Japanese)", labelEn: "Japanese" },
  { code: "ko", name: "Korean", labelZh: "韓文 (Korean)", labelEn: "Korean" },
  { code: "es", name: "Spanish", labelZh: "西班牙文 (Spanish)", labelEn: "Spanish" },
  { code: "fr", name: "French", labelZh: "法文 (French)", labelEn: "French" },
  { code: "de", name: "German", labelZh: "德文 (German)", labelEn: "German" },
  { code: "it", name: "Italian", labelZh: "義大利文 (Italian)", labelEn: "Italian" },
  { code: "ru", name: "Russian", labelZh: "俄文 (Russian)", labelEn: "Russian" },
  { code: "pt", name: "Portuguese", labelZh: "葡萄牙文 (Portuguese)", labelEn: "Portuguese" },
  { code: "vi", name: "Vietnamese", labelZh: "越南文 (Vietnamese)", labelEn: "Vietnamese" },
  { code: "th", name: "Thai", labelZh: "泰文 (Thai)", labelEn: "Thai" },
  { code: "id", name: "Indonesian", labelZh: "印尼文 (Indonesian)", labelEn: "Indonesian" },
  { code: "ar", name: "Arabic", labelZh: "阿拉伯文 (Arabic)", labelEn: "Arabic" },
  { code: "hi", name: "Hindi", labelZh: "印地文 (Hindi)", labelEn: "Hindi" },
  { code: "tr", name: "Turkish", labelZh: "土耳其文 (Turkish)", labelEn: "Turkish" },
  { code: "pl", name: "Polish", labelZh: "波蘭文 (Polish)", labelEn: "Polish" },
  { code: "nl", name: "Dutch", labelZh: "荷蘭文 (Dutch)", labelEn: "Dutch" },
  { code: "sv", name: "Swedish", labelZh: "瑞典文 (Swedish)", labelEn: "Swedish" },
  { code: "da", name: "Danish", labelZh: "丹麥文 (Danish)", labelEn: "Danish" },
  { code: "fi", name: "Finnish", labelZh: "芬蘭文 (Finnish)", labelEn: "Finnish" },
  { code: "no", name: "Norwegian", labelZh: "挪威文 (Norwegian)", labelEn: "Norwegian" },
  { code: "ms", name: "Malay", labelZh: "馬來文 (Malay)", labelEn: "Malay" },
  { code: "uk", name: "Ukrainian", labelZh: "烏克蘭文 (Ukrainian)", labelEn: "Ukrainian" },
  { code: "fil", name: "Filipino", labelZh: "菲律賓文 (Filipino)", labelEn: "Filipino" },
  { code: "ro", name: "Romanian", labelZh: "羅馬尼亞文 (Romanian)", labelEn: "Romanian" },
  { code: "hu", name: "Hungarian", labelZh: "匈牙利文 (Hungarian)", labelEn: "Hungarian" },
  { code: "cs", name: "Czech", labelZh: "捷克文 (Czech)", labelEn: "Czech" },
  { code: "sk", name: "Slovak", labelZh: "斯洛伐克文 (Slovak)", labelEn: "Slovak" },
  { code: "el", name: "Greek", labelZh: "希臘文 (Greek)", labelEn: "Greek" },
  { code: "he", name: "Hebrew", labelZh: "希伯來文 (Hebrew)", labelEn: "Hebrew" },
  { code: "fa", name: "Persian", labelZh: "波斯文 (Persian)", labelEn: "Persian" },
  { code: "bn", name: "Bengali", labelZh: "孟加拉文 (Bengali)", labelEn: "Bengali" },
  { code: "pa", name: "Punjabi", labelZh: "旁遮普文 (Punjabi)", labelEn: "Punjabi" },
  { code: "gu", name: "Gujarati", labelZh: "古吉拉特文 (Gujarati)", labelEn: "Gujarati" },
  { code: "ta", name: "Tamil", labelZh: "泰米爾文 (Tamil)", labelEn: "Tamil" },
  { code: "te", name: "Telugu", labelZh: "泰盧固文 (Telugu)", labelEn: "Telugu" },
  { code: "kn", name: "Kannada", labelZh: "卡納達文 (Kannada)", labelEn: "Kannada" },
  { code: "ml", name: "Malayalam", labelZh: "馬拉雅拉姆文 (Malayalam)", labelEn: "Malayalam" },
  { code: "hr", name: "Croatian", labelZh: "克羅埃西亞文 (Croatian)", labelEn: "Croatian" },
  { code: "sr", name: "Serbian", labelZh: "塞爾維亞文 (Serbian)", labelEn: "Serbian" },
  { code: "bg", name: "Bulgarian", labelZh: "保加利亞文 (Bulgarian)", labelEn: "Bulgarian" },
  { code: "lt", name: "Lithuanian", labelZh: "立陶宛文 (Lithuanian)", labelEn: "Lithuanian" },
  { code: "lv", name: "Latvian", labelZh: "拉脫維亞文 (Latvian)", labelEn: "Latvian" },
  { code: "et", name: "Estonian", labelZh: "愛沙尼亞文 (Estonian)", labelEn: "Estonian" },
  { code: "sl", name: "Slovenian", labelZh: "斯洛比尼亞文 (Slovenian)", labelEn: "Slovenian" },
  { code: "ga", name: "Irish", labelZh: "愛爾蘭文 (Irish)", labelEn: "Irish" },
  { code: "cy", name: "Welsh", labelZh: "威爾斯文 (Welsh)", labelEn: "Welsh" },
  { code: "is", name: "Icelandic", labelZh: "冰島文 (Icelandic)", labelEn: "Icelandic" },
  { code: "af", name: "Afrikaans", labelZh: "南非荷蘭文 (Afrikaans)", labelEn: "Afrikaans" },
  { code: "sw", name: "Swahili", labelZh: "斯瓦希里文 (Swahili)", labelEn: "Swahili" }
];

interface PlayItem {
  id: string;
  title: string;
  videoUrl: string;
  subs: string[];
  referrer?: string;
  inheritedSub?: boolean;
  inheritedReferrer?: boolean;
  hasCustomTitle?: boolean;
}

interface AppSettings {
  potplayerQuoteWrap: boolean;
  potplayerUrlEncode: boolean;
  potplayerSendTitle: boolean;
  potplayerSendReferrer: boolean;
  autoplay: boolean;
  webPlayerSubtitleSize: number;
  webPlayerCrossOrigin: boolean;
  geminiOnlyTranslation: boolean;
  geminiSubtitleSize: number;
  geminiApiKeys?: string[];
  restrictToCustomApiKeys?: boolean;
  uiLanguage?: 'zh-TW' | 'en';
}

interface CustomPlayer {
  id: string;
  name: string;
  description: string;
  template: string;
}

// Default initial playlist demo code showing referrer and subtitle features
const DEFAULT_PLAYLIST = `測試影片 1 (內置字幕與 Referrer)$https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4 --sub="https://raw.githubusercontent.com/andreyvit/subtitle-tools/master/test.srt" --referrer="https://google.com" --title="大雄兔冒險"
測試影片 2 (繼承前述字幕及 Referrer)$https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4
測試影片 3 (客製化 Referrer)$https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4 --referrer="https://another-site.com"
測試影片 4 (無額外設定)$https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4`;

export default function App() {
  const [playlistText, setPlaylistText] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const playParam = searchParams.get('play');
        if (playParam) {
          // Supports multiple streaming sources separated by |@@ or newlines
          let rawLines: string[] = [];
          if (playParam.includes('|@@')) {
            rawLines = playParam.split('|@@');
          } else {
            rawLines = playParam.split(/\n+/);
          }
          
          const cleanCustomProtocolPrefix = (urlStr: string): string => {
            let doc = urlStr.trim();
            // Match any protocol code (such as mpv, potplayer, vlc) followed by ://,
            // then http or https with optional slash or double-slash
            const regex = /^[a-zA-Z0-9]+:\/\/+(https?|http|https)[\/:]*/i;
            if (regex.test(doc)) {
              doc = doc.replace(regex, '$1://');
            }
            // Double slashes formatting fixes
            doc = doc.replace(/^(https?)\/\/+/i, '$1://');
            doc = doc.replace(/^(https?)\/([^\/])/i, '$1://$2');
            return doc;
          };

          const cleanLines = rawLines.map(line => {
            let trimmed = line.trim();
            if (!trimmed) return '';
            
            // Extract the URL (at the beginning of the line up to the first option --)
            let urlPart = '';
            let remainingPart = '';
            
            const spaceIndex = trimmed.search(/\s--/);
            if (spaceIndex !== -1) {
              urlPart = trimmed.substring(0, spaceIndex).trim();
              remainingPart = trimmed.substring(spaceIndex).trim();
            } else {
              const firstSpace = trimmed.indexOf(' ');
              if (firstSpace !== -1) {
                urlPart = trimmed.substring(0, firstSpace).trim();
                remainingPart = trimmed.substring(firstSpace).trim();
              } else {
                urlPart = trimmed;
              }
            }
            
            // Handle if there is a '$' label split (e.g. Title$mpv://https//...)
            if (urlPart.includes('$')) {
              const dollarParts = urlPart.split('$');
              const titlePrefix = dollarParts[0].trim();
              const actualUrl = dollarParts.slice(1).join('$').trim();
              urlPart = `${titlePrefix}\$${cleanCustomProtocolPrefix(actualUrl)}`;
            } else {
              urlPart = cleanCustomProtocolPrefix(urlPart);
            }
            
            return `${urlPart} ${remainingPart}`.trim();
          }).filter(line => line.length > 0);
          
          if (cleanLines.length > 0) {
            return cleanLines.join('\n');
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse URL query payload', e);
    }
    return DEFAULT_PLAYLIST;
  });
  const [items, setItems] = useState<PlayItem[]>([]);
  const [activeItem, setActiveItem] = useState<PlayItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load state or default configurations for AppSettings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('vlp-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          potplayerQuoteWrap: false,
          potplayerUrlEncode: false,
          potplayerSendTitle: true,
          potplayerSendReferrer: true,
          autoplay: true,
          webPlayerSubtitleSize: 22,
          webPlayerCrossOrigin: false,
          geminiOnlyTranslation: false,
          geminiSubtitleSize: 24,
          geminiApiKeys: [],
          restrictToCustomApiKeys: false,
          uiLanguage: 'en',
          ...parsed
        };
      }
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
    return {
      potplayerQuoteWrap: false,
      potplayerUrlEncode: false,
      potplayerSendTitle: true,
      potplayerSendReferrer: true,
      autoplay: true,
      webPlayerSubtitleSize: 22,
      webPlayerCrossOrigin: false,
      geminiOnlyTranslation: false,
      geminiSubtitleSize: 24,
      geminiApiKeys: [],
      restrictToCustomApiKeys: false,
      uiLanguage: 'en',
    };
  });

  // Load custom players configured by user
  const [customPlayers, setCustomPlayers] = useState<CustomPlayer[]>(() => {
    try {
      const saved = localStorage.getItem('vlp-custom-players');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse custom players', e);
    }
    return [];
  });

  // Pin states for launching external players
  const [pinnedPlayerIds, setPinnedPlayerIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vlp-pinned-players');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse pinned players', e);
    }
    return [];
  });

  // Track copied subtitle indicator status
  const [copiedSubIdx, setCopiedSubIdx] = useState<number | null>(null);

  // Gemini Real-time AI Subtitle Translation States
  const [geminiStatus, setGeminiStatus] = useState<'disconnected' | 'connecting' | 'ready' | 'listening' | 'refreshing'>('disconnected');
  const [geminiStatusDesc, setGeminiStatusDesc] = useState<string>('');
  const [newGeminiKey, setNewGeminiKey] = useState<string>('');
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string>("Traditional Chinese");
  const [audioSource, setAudioSource] = useState<'mic' | 'player' | 'system'>('mic');
  const isDisplayMediaSupported = typeof navigator !== 'undefined' && 
    navigator?.mediaDevices && 
    typeof navigator.mediaDevices.getDisplayMedia === 'function';
  const [embedInPlayer, setEmbedInPlayer] = useState<boolean>(true);
  const [subtitleHistory, setSubtitleHistory] = useState<string[]>([]);
  const sentenceFinishedRef = useRef<boolean>(false);
  const subtitleClearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [currentOriginalSubtitle, setCurrentOriginalSubtitle] = useState<string>("");
  const [currentTranslatedSubtitle, setCurrentTranslatedSubtitle] = useState<string>("");
  const [isAudioSilent, setIsAudioSilent] = useState<boolean>(false);

  // States for In-App Resizable, Draggable Floating Subtitles & OS Picture-in-Picture Subtitles
  const [showInAppFloatingSub, setShowInAppFloatingSub] = useState<boolean>(false);
  const [floatingSubPos, setFloatingSubPos] = useState<{ x: number; y: number; width: number; height: number; fontSize: number; bgOpacity: number }>({
    x: 80,
    y: 120,
    width: 580,
    height: 150,
    fontSize: 24,
    bgOpacity: 0.85
  });
  const [isPipActive, setIsPipActive] = useState<boolean>(false);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<AudioNode | null>(null);
  const currentVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const flushTimerRef = useRef<any>(null);
  const currentLineRef = useRef<string>("");
  const currentOriginalLineRef = useRef<string>("");
  const currentTranslatedLineRef = useRef<string>("");

  // Simple linear downsampler from default browser rates (e.g. 44100/48000) to 16000 Hz expected by Gemini
  const downsampleBuffer = (buffer: Float32Array, inputSampleRate: number, outputSampleRate: number = 16000): Float32Array => {
    if (inputSampleRate === outputSampleRate) {
      return buffer;
    }
    if (inputSampleRate < outputSampleRate) {
      return buffer;
    }
    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  };

  // Helper function to convert Float32 sound buffer into Int16 (pcm)
  const convertFloat32ToInt16 = (buffer: Float32Array): Int16Array => {
    let l = buffer.length;
    const buf = new Int16Array(l);
    while (l--) {
      const s = Math.max(-1, Math.min(1, buffer[l]));
      buf[l] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return buf;
  };

  // Helper function to encode raw Int16 binary pcm as a base64 string
  const bufferToBase64 = (buffer: Int16Array): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const handleIncomingGeminiChunks = (orig: string, trans: string) => {
    const hasIncomingText = orig.trim() || trans.trim();

    // Reset/Setup fade-out timer on active speech chunks. Subtitles clear out after 3.5s of silence
    if (hasIncomingText) {
      if (subtitleClearTimerRef.current) {
        clearTimeout(subtitleClearTimerRef.current);
      }
      subtitleClearTimerRef.current = setTimeout(() => {
        setCurrentOriginalSubtitle("");
        setCurrentTranslatedSubtitle("");
        setCurrentSubtitle("");
      }, 3500);
    }

    if (hasIncomingText && sentenceFinishedRef.current) {
      // New dialogue has arrived! Clear accumulators for the next sentence
      currentOriginalLineRef.current = "";
      currentTranslatedLineRef.current = "";
      currentLineRef.current = "";
      sentenceFinishedRef.current = false;
      setCurrentOriginalSubtitle("");
      setCurrentTranslatedSubtitle("");
      setCurrentSubtitle("");
    }

    // 1. Process original chunk
    if (orig.trim()) {
      let cleanOrig = orig;
      if (cleanOrig.includes("Translation:") || cleanOrig.includes("翻譯：")) {
        cleanOrig = cleanOrig.replace(/(Translation:|翻譯：)\s*/gi, "");
      }
      
      const currO = currentOriginalLineRef.current.trim();
      const cleanO = cleanOrig.trim();
      
      if (currO && cleanO.startsWith(currO) && cleanO !== currO) {
        currentOriginalLineRef.current = cleanOrig;
      } else if (currO && currO.endsWith(cleanO)) {
        // duplicate suffix - ignore
      } else {
        currentOriginalLineRef.current += cleanOrig;
      }
      
      setCurrentOriginalSubtitle(currentOriginalLineRef.current);
    }

    // 2. Process translated chunk
    if (trans.trim()) {
      let cleanTrans = trans;
      if (cleanTrans.includes("Translation:") || cleanTrans.includes("翻譯：")) {
        cleanTrans = cleanTrans.replace(/(Translation:|翻譯：)\s*/gi, "");
      }
      
      const currT = currentTranslatedLineRef.current.trim();
      const cleanT = cleanTrans.trim();
      
      if (currT && cleanT.startsWith(currT) && cleanT !== currT) {
        currentTranslatedLineRef.current = cleanTrans;
      } else if (currT && currT.endsWith(cleanT)) {
        // duplicate suffix - ignore
      } else {
        currentTranslatedLineRef.current += cleanTrans;
      }
      
      setCurrentTranslatedSubtitle(currentTranslatedLineRef.current);
    }

    // Determine the text to assign as currentSubtitle (fallback representation)
    if (currentTranslatedLineRef.current) {
      setCurrentSubtitle(currentTranslatedLineRef.current);
    } else {
      setCurrentSubtitle(currentOriginalLineRef.current);
    }

    const isOrigEnd = /[\.!\?\n。！？]/g.test(orig);
    const isTransEnd = /[\.!\?\n。！？]/g.test(trans);
    const isTooLong = currentOriginalLineRef.current.length > 50 || currentTranslatedLineRef.current.length > 50;

    if (isOrigEnd || isTransEnd || isTooLong) {
      const fOrig = currentOriginalLineRef.current.trim();
      const fTrans = currentTranslatedLineRef.current.trim();
      if (fOrig || fTrans) {
        let combined = "";
        if (fOrig && fTrans) {
          combined = `${fOrig} → ${fTrans}`;
        } else {
          combined = fOrig || fTrans;
        }
        setSubtitleHistory(prev => [...prev, combined].slice(-40));
      }
      // Set sentence finished, but do NOT wipe current subtitles, leaving them intact on-screen
      sentenceFinishedRef.current = true;
    }
  };

  const stopGeminiCaptioner = () => {
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch (_) {}
      processorRef.current = null;
    }

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.disconnect(); } catch (_) {}
      sourceNodeRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (_) {}
      });
      micStreamRef.current = null;
    }

    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (_) {}
      audioCtxRef.current = null;
    }

    if (wsRef.current) {
      try { wsRef.current.close(); } catch (_) {}
      wsRef.current = null;
    }

    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    if (subtitleClearTimerRef.current) {
      clearTimeout(subtitleClearTimerRef.current);
      subtitleClearTimerRef.current = null;
    }

    // Clean up global window references to allow GC after stopping
    try {
      delete (window as any)._activeAudioProcessor;
      delete (window as any)._activeSourceNode;
      delete (window as any)._activeMicStream;
    } catch (_) {}

    currentOriginalLineRef.current = "";
    currentTranslatedLineRef.current = "";
    currentLineRef.current = "";
    setCurrentOriginalSubtitle("");
    setCurrentTranslatedSubtitle("");
    setCurrentSubtitle("");
    setGeminiStatus('disconnected');
    setGeminiStatusDesc('');
  };

  const handleVideoElementChanged = (videoEl: HTMLVideoElement) => {
    console.log("ArtPlayer video element ready callback triggered:", videoEl);
    currentVideoElementRef.current = videoEl;

    // If Gemini captioner is running (or ready) and we are using the 'player' source,
    // we should immediately re-couple the new video's AudioNode to the active AudioContext!
    if (audioSource === 'player' && (geminiStatus === 'listening' || geminiStatus === 'ready')) {
      const audioCtx = audioCtxRef.current;
      const processor = processorRef.current;
      if (audioCtx && processor) {
        try {
          // Disconnect old source node first
          if (sourceNodeRef.current) {
            try { sourceNodeRef.current.disconnect(); } catch (_) {}
          }
          if ((window as any)._activeSourceNode) {
            try { (window as any)._activeSourceNode.disconnect(); } catch (_) {}
          }

          let mediaSource: MediaElementAudioSourceNode;
          // Reuse/create the source node for this specific HTMLMediaElement
          if ((videoEl as any)._audioSourceNode && (videoEl as any)._audioSourceContext === audioCtx) {
            mediaSource = (videoEl as any)._audioSourceNode;
          } else {
            if ((videoEl as any)._audioSourceNode) {
              try { (videoEl as any)._audioSourceNode.disconnect(); } catch (_) {}
            }
            mediaSource = audioCtx.createMediaElementSource(videoEl);
            (videoEl as any)._audioSourceNode = mediaSource;
            (videoEl as any)._audioSourceContext = audioCtx;
          }

          // Routes:
          // 1. Play sound to the speakers so the user can hear it
          mediaSource.connect(audioCtx.destination);
          // 2. Connect to the downsampling script processor
          mediaSource.connect(processor);

          sourceNodeRef.current = mediaSource;
          (window as any)._activeSourceNode = mediaSource;
          console.log("Successfully re-coupled new video player AudioNode to Gemini Live stream!");
        } catch (e) {
          console.error("Failed to re-couple new video player audio node:", e);
        }
      }
    }
  };

  const startGeminiCaptioner = async () => {
    setGeminiError(null);
    setGeminiStatus('connecting');
    setSubtitleHistory([]);
    setCurrentSubtitle("");
    setCurrentOriginalSubtitle("");
    setCurrentTranslatedSubtitle("");
    setIsAudioSilent(false);
    currentLineRef.current = "";
    currentOriginalLineRef.current = "";
    currentTranslatedLineRef.current = "";

    try {
      // 1. PHASE 1: Initialize Audio Context and acquire media stream immediately in the user gesture stack!
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("此瀏覽器不支援 Web Audio API。");
      }
      
      let audioCtx: AudioContext;
      // Initialize without forcing sampleRate initially, to maximize device & browser compatibility (especially iOS/mobile Safari)
      try {
        audioCtx = new AudioContextClass();
      } catch (ctxErr) {
        audioCtx = new AudioContextClass({});
      }
      audioCtxRef.current = audioCtx;

      // Unsuspend audio context immediately inside user gesture callback
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
        console.log("AudioContext resumed on gesture, state:", audioCtx.state);
      }

      // Automatically watch state and resume if suspended by browser
      audioCtx.onstatechange = () => {
        if (audioCtx && audioCtx.state === "suspended") {
          audioCtx.resume().catch(err => console.warn("Auto-resuming AudioContext failed:", err));
        }
      };

      let sourceNode: AudioNode;
      let micStream: MediaStream | null = null;

      if (audioSource === 'player') {
        const videoEl = currentVideoElementRef.current || document.querySelector('video');
        if (videoEl) {
          try {
            let mediaSource: MediaElementAudioSourceNode;
            // Strict Web Audio constraint: createMediaElementSource can only be called ONCE per video element in its lifecycle.
            // We cache it dynamically on the HTMLMediaElement itself to prevent "HTMLMediaElement already connected" InvalidStateError.
            if ((videoEl as any)._audioSourceNode && (videoEl as any)._audioSourceContext === audioCtx) {
              mediaSource = (videoEl as any)._audioSourceNode;
            } else {
              // Disconnect old nodes if they exist to prevent leaks
              if ((videoEl as any)._audioSourceNode) {
                try { (videoEl as any)._audioSourceNode.disconnect(); } catch (_) {}
              }
              mediaSource = audioCtx.createMediaElementSource(videoEl);
              (videoEl as any)._audioSourceNode = mediaSource;
              (videoEl as any)._audioSourceContext = audioCtx;
            }

            sourceNode = mediaSource;
          } catch (err: any) {
            console.warn("Direct element link Web Audio API capture fallback:", err);
            // If it fails or throws, fallback to microphone listen mode gracefully
            setGeminiError("發現網頁音軌連接失敗或遭 CORS 保護限制，已自動切換啟用「麥克風聽訊模式」讀取音色！請保持播放器揚聲器開啟即可收音。");
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = micStream;
            sourceNode = audioCtx.createMediaStreamSource(micStream);
          }
        } else {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = micStream;
          sourceNode = audioCtx.createMediaStreamSource(micStream);
        }
      } else if (audioSource === 'system') {
        try {
          if (typeof navigator?.mediaDevices?.getDisplayMedia !== 'function') {
            throw new Error("此裝置或瀏覽器不支援 getDisplayMedia (分頁音訊抓取)。請使用電腦版 Chrome/Edge/Firefox 或改用「🎙️ 麥克風聽訊模式」！");
          }

          // Chrome/Firefox require video constraint. By setting video: true, we allow the user to select
          // Chrome Tab, Window, or Entire Screen freely, so they can transcribe other applications like mpv!
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            } as any,
            selfBrowserSurface: "include"
          } as any);

          // Verify if audio track was actually shared
          const audioTracks = displayStream.getAudioTracks();
          if (audioTracks.length === 0) {
            // Stop all tracks to clean up the browser sharing bar before throwing
            displayStream.getTracks().forEach(track => {
              try { track.stop(); } catch (_) {}
            });
            throw new Error("授權失敗：此選項目前不支援或未提供聲音軌道！\n\n" +
              "💡 為什麼會這樣？\n" +
              "1. 系統安全隱私限制限制：當您選擇分享『整個螢幕』或『應用程式視窗』時，在 Linux 或是 macOS 系統下的瀏覽器安全規範『不支援』在視窗/螢幕類別中夾帶音軌！\n" +
              "2. 如果您是選擇分享『分頁 / Chrome Tab』，您可能在彈出的分享視窗中，忘記勾選左下角的『同時分享分頁聲音 / 共用分訊』核取方塊。\n\n" +
              "🛠️ 完美的解決方案：\n" +
              "如果您是要辨識外部程式（例如：本地 mpv 播放器、或其它軟體）的聲音：\n" +
              "請先將音訊來源切換為『🎙️ 麥克風聽音模式』並開啟喇叭，接著在下方點選啟動【懸浮字幕】或是【PiP 子母畫面字幕】。即使把本網頁縮減到背景或進入其它軟體，我們的 AI 字幕依然會完美懸浮在您的螢幕最上層，為您的 mpv 生成無縫字幕！");
          }

          // Immediately stop only the video tracks to turn off camera/tab screen transmission, preserving the pristine digital audio loopback!
          displayStream.getVideoTracks().forEach(track => {
            try { track.stop(); } catch (_) {}
          });

          micStream = displayStream;
          micStreamRef.current = displayStream;
          sourceNode = audioCtx.createMediaStreamSource(displayStream);
        } catch (err: any) {
          console.error("System display audio capture failed:", err);
          let errMsg = err.message || err.toString();
          if (errMsg.includes("Permission denied") || errMsg.includes("NotAllowedError") || errMsg.includes("拒絕")) {
            throw new Error("授權失敗：您取消了分享，或者是未在分享對話視窗中勾選「共用分頁音訊」/「分享音訊」核取方塊。請重試並確認核選。");
          }
          throw err;
        }
      } else {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = micStream;
        sourceNode = audioCtx.createMediaStreamSource(micStream);
      }

      sourceNodeRef.current = sourceNode;

      // Create the processor - 4096 buffer size, 1 input channel, 1 output channel
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Keep strong references globally to prevent browser garbage collection
      (window as any)._activeAudioProcessor = processor;
      (window as any)._activeSourceNode = sourceNode;
      if (micStream) {
        (window as any)._activeMicStream = micStream;
      }

      // Ensure we disconnect first to clean up any past session couplings
      try { sourceNode.disconnect(); } catch (_) {}

      // Routing logic:
      if (audioSource === 'player') {
        // Player node must play to dest SO THAT the user can hear the movie!
        sourceNode.connect(audioCtx.destination);
      }
      sourceNode.connect(processor);
      processor.connect(audioCtx.destination);

      let silentBuffersCount = 0;
      let totalBuffersCount = 0;
      let accumulatedFloatSamples: number[] = [];

      // Handle raw PCM downsampling and packaging in the audio process loop
      processor.onaudioprocess = (e) => {
        // Send only when WebSocket is active AND geminiStatus is 'listening'
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Check for silence/active audio amplitude
        let isZero = true;
        for (let i = 0; i < inputData.length; i++) {
          if (Math.abs(inputData[i]) > 0.0001) {
            isZero = false;
            break;
          }
        }
        
        totalBuffersCount++;
        if (isZero) {
          silentBuffersCount++;
          if (silentBuffersCount === 30) {
            console.warn("⚠️ 偵測到音訊輸入皆為靜音！");
            setIsAudioSilent(true);
          }
        } else {
          silentBuffersCount = 0;
          setIsAudioSilent(false);
        }

        // Downsample the browser sample rate (e.g. 44100 / 48000) down to 16000 Hz if needed
        const currentSampleRate = audioCtx.sampleRate;
        const downsampledData = downsampleBuffer(inputData, currentSampleRate, 16000);

        // Accumulate float samples
        for (let i = 0; i < downsampledData.length; i++) {
          accumulatedFloatSamples.push(downsampledData[i]);
        }

        // 8000 points of raw Float32 data (under 16000Hz sampling rate) is exactly 0.5 seconds of audio
        while (accumulatedFloatSamples.length >= 8000) {
          const chunkToProcess = accumulatedFloatSamples.slice(0, 8000);
          accumulatedFloatSamples = accumulatedFloatSamples.slice(8000);

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const sendBuffer = new Float32Array(chunkToProcess);
            const int16Data = convertFloat32ToInt16(sendBuffer);
            const base64Data = bufferToBase64(int16Data);
            
            wsRef.current.send(JSON.stringify({
              type: "audio",
              data: base64Data
            }));
          }
        }
      };

      // 2. PHASE 2: Connect to WebSocket after the audio mechanism has been safely locked & armed!
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/gemini/live`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({
          type: "setup",
          targetLang: targetLang === "none" ? "none" : targetLang,
          customApiKeys: settings.geminiApiKeys || [],
          restrictToCustomKeys: settings.restrictToCustomApiKeys || false
        }));
      };

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === "status") {
          if (payload.status === "ready") {
            setGeminiStatus('listening');
            setGeminiStatusDesc('');
            // Audio capture is already running and connected to destinations, it'll seamlessly pass bytes now!
          } else if (payload.status === "refreshing") {
            setGeminiStatus('refreshing');
            setGeminiStatusDesc(payload.description || "後端正在無縫重連 (Auto-Reconnect)...");
          } else if (payload.status === "closed") {
            stopGeminiCaptioner();
          }
        } else if (payload.type === "error") {
          setGeminiError(payload.error);
          stopGeminiCaptioner();
        } else if (payload.type === "gemini_message") {
          const liveMsg = payload.data;
          console.log("Gemini WebSocket message payload:", liveMsg);
          
          let inputTrans = liveMsg.inputTranscriptionText;
          let outputTrans = liveMsg.outputTranscriptionText;
          let modelPart = liveMsg.modelText;

          const getField = (obj: any, camelKey: string, snakeKey: string) => {
            if (!obj) return undefined;
            return obj[camelKey] !== undefined ? obj[camelKey] : obj[snakeKey];
          };

          const raw = liveMsg.raw || liveMsg;
          const sc = getField(raw, 'serverContent', 'server_content');
          
          if (sc) {
            const it = getField(sc, 'inputTranscription', 'input_transcription');
            if (it && inputTrans === undefined) {
              inputTrans = getField(it, 'text', 'text');
            }
            const ot = getField(sc, 'outputTranscription', 'output_transcription');
            if (ot && outputTrans === undefined) {
              outputTrans = getField(ot, 'text', 'text');
            }
            const mt = getField(sc, 'modelTurn', 'model_turn');
            if (mt && modelPart === undefined) {
              const parts = getField(mt, 'parts', 'parts');
              if (Array.isArray(parts)) {
                modelPart = parts.map((p: any) => getField(p, 'text', 'text')).filter(Boolean).join("");
              }
            }
          }

          let origChunk = "";
          let transChunk = "";

          if (targetLang === "none") {
            origChunk = inputTrans || "";
            transChunk = "";
          } else {
            origChunk = inputTrans || "";
            transChunk = outputTrans || modelPart || "";
          }

          if (origChunk || transChunk) {
            handleIncomingGeminiChunks(origChunk, transChunk);
          }
        }
      };

      socket.onerror = (err) => {
        console.error("WS error:", err);
        setGeminiError("連線至語音轉換伺服器代理失敗，請確認伺服器運作正常並已設定 GEMINI_API_KEY 金鑰。");
        stopGeminiCaptioner();
      };

      socket.onclose = () => {
        stopGeminiCaptioner();
      };

    } catch (err: any) {
      console.error("Captioner initiation exception:", err);
      setGeminiError("啟用字幕助理失敗: " + (err.message || String(err)));
      stopGeminiCaptioner();
    }
  };

   // Clear subtitle states on switching active video items while keeping captioner alive
  useEffect(() => {
    setSubtitleHistory([]);
    setCurrentSubtitle("");
    currentLineRef.current = "";
    // If we're using player and listening, we do NOT stop the captioner;
    // handleVideoElementChanged will automatically re-couple the new video when it mounts!
  }, [activeItem]);

  useEffect(() => {
    return () => {
      stopGeminiCaptioner();
      stopPipSubtitles();
    };
  }, []);

  // Responsive initial configuration for In-App floating captioner on mobile viewports
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSmallScreen = window.innerWidth < 768;
      if (isSmallScreen) {
        setFloatingSubPos({
          x: 12,
          y: 80,
          width: window.innerWidth - 24,
          height: 120,
          fontSize: 18,
          bgOpacity: 0.9
        });
      }
    }
  }, []);

  const updatePipCanvas = (subText: string) => {
    const canvas = pipCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const text = subText.trim();
    if (!text) {
      // Draw subtle loading text if listening but no current subtitle
      ctx.fillStyle = '#52525b';
      ctx.font = 'italic 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const isEn = settings?.uiLanguage === 'en';
      ctx.fillText(isEn ? 'Waiting for audio input...' : '等待音訊輸入接收即時字幕中...', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Set font style
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Wrap text carefully
    const rawLines = text.split('\n');
    const lines: string[] = [];
    const maxWidth = canvas.width - 60;
    const lineHeight = 40;

    for (const rawLine of rawLines) {
      if (!rawLine.trim()) continue;
      const words = rawLine.includes(' ') ? rawLine.split(' ') : rawLine.split('');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const word = words[n];
        const spacing = rawLine.includes(' ') ? ' ' : '';
        const testLine = line + (line ? spacing : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }
      lines.push(line);
    }

    // Calculate vertical centering
    const totalHeight = lines.length * lineHeight;
    let startY = (canvas.height - totalHeight) / 2 + lineHeight / 2;

    for (let i = 0; i < lines.length; i++) {
      // Stroke (Text Outline)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 10;
      ctx.lineJoin = 'round';
      ctx.strokeText(lines[i], canvas.width / 2, startY);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(lines[i], canvas.width / 2, startY);

      startY += lineHeight;
    }
  };

  useEffect(() => {
    let textToShow = "";
    if (currentTranslatedSubtitle.trim()) {
      if (settings.geminiOnlyTranslation) {
        textToShow = currentTranslatedSubtitle;
      } else {
        if (currentOriginalSubtitle.trim()) {
          textToShow = `${currentOriginalSubtitle}\n${currentTranslatedSubtitle}`;
        } else {
          textToShow = currentTranslatedSubtitle;
        }
      }
    } else if (currentOriginalSubtitle.trim()) {
      if (targetLang === "none" || isTargetLanguage(currentOriginalSubtitle, targetLang)) {
        textToShow = currentOriginalSubtitle;
      } else {
        textToShow = "";
      }
    } else {
      textToShow = subtitleHistory.length > 0 ? subtitleHistory[subtitleHistory.length - 1] : "";
    }
    updatePipCanvas(textToShow);
  }, [currentSubtitle, currentOriginalSubtitle, currentTranslatedSubtitle, subtitleHistory, settings.geminiOnlyTranslation, targetLang]);

  const startPipSubtitles = async () => {
    try {
      let canvas = pipCanvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 200;
        pipCanvasRef.current = canvas;
      }

      // Pre-draw current text
      let initialText = "";
      if (currentTranslatedSubtitle.trim()) {
        if (settings.geminiOnlyTranslation) {
          initialText = currentTranslatedSubtitle;
        } else {
          if (currentOriginalSubtitle.trim()) {
            initialText = `${currentOriginalSubtitle}\n${currentTranslatedSubtitle}`;
          } else {
            initialText = currentTranslatedSubtitle;
          }
        }
      } else if (currentOriginalSubtitle.trim()) {
        if (targetLang === "none" || isTargetLanguage(currentOriginalSubtitle, targetLang)) {
          initialText = currentOriginalSubtitle;
        } else {
          initialText = "";
        }
      } else {
        initialText = subtitleHistory.length > 0 ? subtitleHistory[subtitleHistory.length - 1] : "";
      }
      updatePipCanvas(initialText);

      let video = pipVideoRef.current;
      if (!video) {
        video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.ariaHidden = 'true';
        video.className = 'absolute pointer-events-none opacity-0';
        video.style.cssText = 'position:absolute;width:0;height:0;top:-9999px;left:-9999px;';
        document.body.appendChild(video);
        pipVideoRef.current = video;

        const stream = canvas.captureStream(10); // Capture canvas at 10 FPS
        video.srcObject = stream;
      }

      // We MUST play the video element before requestPictureInPicture can be invoked
      await video.play();
      
      if ((video as any).requestPictureInPicture) {
        await (video as any).requestPictureInPicture();
        setIsPipActive(true);

        video.addEventListener('leavepictureinpicture', () => {
          setIsPipActive(false);
          console.log("OS Picture-in-Picture window closed natively by user");
        });
      } else {
        throw new Error("此瀏覽器在當前網頁安全環境下，不支援子母畫面 API (Picture-in-Picture)。請用電腦版 Chrome/Edge/Firefox 瀏覽器！");
      }
    } catch (err: any) {
      console.error("Failed to start Picture-in-Picture Subtitles:", err);
      alert("啟動 PiP 子母畫面字幕失敗：" + (err.message || err.toString()));
    }
  };

  const stopPipSubtitles = async () => {
    try {
      if (typeof document !== 'undefined' && (document as any).exitPictureInPicture) {
        if ((document as any).pictureInPictureElement) {
          await (document as any).exitPictureInPicture();
        }
      }
      setIsPipActive(false);
    } catch (err) {
      console.error("Failed to stop PiP:", err);
    }
  };

  // Draggable logic for the subtitle bar
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX: number;
    let clientY: number;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      posX: floatingSubPos.x,
      posY: floatingSubPos.y
    };

    const handleMouseMove = (mvEvent: MouseEvent | TouchEvent) => {
      if (!dragStartRef.current) return;
      
      let curX: number;
      let curY: number;
      if ('touches' in mvEvent) {
        if (mvEvent.touches.length === 0) return;
        curX = mvEvent.touches[0].clientX;
        curY = mvEvent.touches[0].clientY;
      } else {
        curX = mvEvent.clientX;
        curY = mvEvent.clientY;
      }

      const deltaX = curX - dragStartRef.current.startX;
      const deltaY = curY - dragStartRef.current.startY;
      
      const newX = dragStartRef.current.posX + deltaX;
      const newY = dragStartRef.current.posY + deltaY;

      // Restrict within the dimensions of the client viewport strictly to prevent overflowing
      setFloatingSubPos(prev => {
        const maxX = window.innerWidth - prev.width;
        const maxY = window.innerHeight - prev.height;
        return {
          ...prev,
          x: Math.max(0, Math.min(maxX > 0 ? maxX : 0, newX)),
          y: Math.max(0, Math.min(maxY > 0 ? maxY : 0, newY))
        };
      });
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
  };

  // Sync pinned player states
  useEffect(() => {
    localStorage.setItem('vlp-pinned-players', JSON.stringify(pinnedPlayerIds));
  }, [pinnedPlayerIds]);

  // Toggle player pinned indicator helper
  const handleTogglePinPlayer = (playerId: string) => {
    if (pinnedPlayerIds.includes(playerId)) {
      setPinnedPlayerIds(pinnedPlayerIds.filter(id => id !== playerId));
    } else {
      setPinnedPlayerIds([...pinnedPlayerIds, playerId]);
    }
  };

  // Helper function to fetch and download subtitles with fallback for CORS issues
  const handleDownloadSubtitle = async (subUrl: string, index: number, event: React.MouseEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(subUrl);
      if (!response.ok) throw new Error('Network error or CORS blocks');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      let extension = 'srt';
      try {
        const u = new URL(subUrl);
        const pathname = u.pathname;
        const extMatch = pathname.match(/\.([a-zA-Z0-9]+)$/);
        if (extMatch) extension = extMatch[1];
      } catch (_) {}
      a.download = `${activeItem?.title || 'subtitle'}_第${index + 1}軌.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const a = document.createElement('a');
      a.href = subUrl;
      a.target = '_blank';
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Settings Modal / Overlay states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerDesc, setNewPlayerDesc] = useState('');
  const [newPlayerTemplate, setNewPlayerTemplate] = useState('');
  
  // Tab category state for launchers list: all, desktop, mobile, custom
  const [activeTab, setActiveTab] = useState<'all' | 'desktop' | 'mobile' | 'custom'>('all');

  // Multi-edit triggers autosave inside localStorage
  useEffect(() => {
    localStorage.setItem('vlp-settings', JSON.stringify(settings));
  }, [settings]);

  const uiLang = settings.uiLanguage || 'en';
  const t = (zh: string, en: string) => {
    return uiLang === 'en' ? en : zh;
  };

  useEffect(() => {
    localStorage.setItem('vlp-custom-players', JSON.stringify(customPlayers));
  }, [customPlayers]);

  // Parse playlist text when it changes
  useEffect(() => {
    const lines = playlistText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedItems: PlayItem[] = [];
    
    let inheritedSubs: string[] = [];
    let inheritedReferrer = '';

    // Helper to extract option value with support for unescaped nested double/single quotes,
    // scanning from left to right until finding the true closing quote (one followed by empty/space, or another option flag)
    const extractOptionValue = (str: string, optionNames: string[]): { value: string | null, cleanStr: string } => {
      for (const name of optionNames) {
        const pattern = new RegExp(`(^|\\s)${name}(?:=|\\s+)`, 'i');
        const match = pattern.exec(str);
        if (!match) continue;

        const matchIdx = match.index;
        const matchLen = match[0].length;
        
        // The option starts at matchIdx (plus any leading whitespace in match[1])
        const startIdx = matchIdx + match[1].length; 
        const valStartIdx = matchIdx + matchLen;
        
        // Now check if it's double-quoted
        if (str[valStartIdx] === '"') {
          let closingQuoteIdx = -1;
          for (let i = valStartIdx + 1; i < str.length; i++) {
            if (str[i] === '"') {
              const rest = str.substring(i + 1);
              const nextOptionPattern = /^\s*--(?:title|sub|sub-file|referrer|referer)(?:=|\s|$)/i;
              const isEnd = /^\s*$/.test(rest);
              if (isEnd || nextOptionPattern.test(rest)) {
                closingQuoteIdx = i;
                break;
              }
            }
          }
          
          if (closingQuoteIdx !== -1) {
            const val = str.substring(valStartIdx + 1, closingQuoteIdx);
            const cleanStr = (str.substring(0, startIdx) + ' ' + str.substring(closingQuoteIdx + 1)).trim();
            return { value: val, cleanStr };
          }
        }
        
        // Single-quoted
        if (str[valStartIdx] === "'") {
          let closingQuoteIdx = -1;
          for (let i = valStartIdx + 1; i < str.length; i++) {
            if (str[i] === "'") {
              const rest = str.substring(i + 1);
              const nextOptionPattern = /^\s*--(?:title|sub|sub-file|referrer|referer)(?:=|\s|$)/i;
              const isEnd = /^\s*$/.test(rest);
              if (isEnd || nextOptionPattern.test(rest)) {
                closingQuoteIdx = i;
                break;
              }
            }
          }
          
          if (closingQuoteIdx !== -1) {
            const val = str.substring(valStartIdx + 1, closingQuoteIdx);
            const cleanStr = (str.substring(0, startIdx) + ' ' + str.substring(closingQuoteIdx + 1)).trim();
            return { value: val, cleanStr };
          }
        }
        
        // Unquoted: goes up to the next space followed by option, or end of string
        let valEndIdx = str.length;
        for (let i = valStartIdx; i < str.length; i++) {
          const rest = str.substring(i);
          const nextOptionPattern = /^\s+--(?:title|sub|sub-file|referrer|referer)(?:=|\s|$)/i;
          const isEnd = /^\s*$/.test(rest);
          if (isEnd || nextOptionPattern.test(rest)) {
            valEndIdx = i;
            break;
          }
        }
        
        const val = str.substring(valStartIdx, valEndIdx).trim();
        const cleanStr = (str.substring(0, startIdx) + ' ' + str.substring(valEndIdx)).trim();
        return { value: val, cleanStr };
      }
      
      return { value: null, cleanStr: str };
    };

    for (const line of lines) {
      if (!line) continue;
      
      let rawContent = line;
      let title = `影片 ${parsedItems.length + 1}`;
      let hasCustomTitle = false;
      
      // Parse label separator '$' first (if it exists BEFORE any option flag to prevent false-positives)
      const dollarIndex = rawContent.indexOf('$');
      const ddashIndex = rawContent.indexOf(' --');
      if (dollarIndex !== -1 && (ddashIndex === -1 || dollarIndex < ddashIndex)) {
        title = rawContent.substring(0, dollarIndex).trim();
        hasCustomTitle = true;
        rawContent = rawContent.substring(dollarIndex + 1).trim();
      }

      let subs: string[] = [];
      let referrers: string[] = [];
      let titleVal: string | null = null;
      let currentStr = rawContent;

      while (true) {
        // 1. Extract title
        const titleRes = extractOptionValue(currentStr, ['--title']);
        if (titleRes.value !== null) {
          titleVal = titleRes.value;
          currentStr = titleRes.cleanStr;
          hasCustomTitle = true;
          continue;
        }

        // 2. Extract sub / sub-file
        const subRes = extractOptionValue(currentStr, ['--sub', '--sub-file']);
        if (subRes.value !== null) {
          subs.push(subRes.value);
          currentStr = subRes.cleanStr;
          continue;
        }

        // 3. Extract referrer / referer
        const refRes = extractOptionValue(currentStr, ['--referrer', '--referer']);
        if (refRes.value !== null) {
          referrers.push(refRes.value);
          currentStr = refRes.cleanStr;
          continue;
        }

        break;
      }

      const videoUrl = currentStr.trim();
      if (!videoUrl) continue;

      if (titleVal !== null) {
        title = titleVal;
      }
      
      // Subtitle inheritance logic
      let itemSubs: string[] = [];
      let isSubInherited = false;
      if (subs.length > 0) {
        itemSubs = subs;
        inheritedSubs = subs; // Update cache
      } else if (inheritedSubs.length > 0) {
        itemSubs = [...inheritedSubs];
        isSubInherited = true; // Flag as inherited
      }
      
      // Referrer inheritance logic (requested!)
      let itemReferrer = '';
      let isReferrerInherited = false;
      if (referrers.length > 0) {
        itemReferrer = referrers[0];
        inheritedReferrer = referrers[0]; // Update cache
      } else if (inheritedReferrer) {
        itemReferrer = inheritedReferrer;
        isReferrerInherited = true; // Flag as inherited
      }
      
      parsedItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title,
        videoUrl,
        subs: itemSubs,
        referrer: itemReferrer,
        inheritedSub: isSubInherited,
        inheritedReferrer: isReferrerInherited,
        hasCustomTitle
      });
    }
    
    setItems(parsedItems);
    if (parsedItems.length > 0 && !activeItem) {
      setActiveItem(parsedItems[0]);
    }
  }, [playlistText]);

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Helper to expand options for multiple subtitles if present, reproducing the flag for each item.
  const expandMultipleSubtitles = (tpl: string, subsList: string[]): string => {
    if (!subsList || subsList.length === 0) return tpl;
    
    let result = tpl;
    const placeholders = ['sub', 'encodedSub'];
    for (const ph of placeholders) {
      const quotedDoubleReg = `\\s*[-/][-a-zA-Z0-9_.]+(?:\\s+|=)?"[^"]*\\{${ph}\\}[^"]*"`;
      const quotedSingleReg = `\\s*[-/][-a-zA-Z0-9_.]+(?:\\s+|=)?'[^']*\\{${ph}\\}[^']*'`;
      const unquotedReg = `\\s*[-/][-a-zA-Z0-9_.]+(?:\\s+|=)?[^\\s{}]*\\{${ph}\\}[^\\s{}]*`;
      const combinedRegex = new RegExp(`(?:${quotedDoubleReg})|(?:${quotedSingleReg})|(?:${unquotedReg})`, 'g');
      
      const matches = tpl.match(combinedRegex);
      if (matches && matches.length > 0) {
        for (const matchOption of matches) {
          const duplicatedOptions = subsList.map((subVal) => {
            let optionStr = matchOption;
            if (ph === 'encodedSub') {
              optionStr = optionStr.replace(/\{encodedSub\}/g, encodeURIComponent(subVal));
            } else {
              optionStr = optionStr.replace(/\{sub\}/g, subVal);
            }
            return optionStr;
          }).join('');
          result = result.replace(matchOption, duplicatedOptions);
        }
      }
    }
    
    return result;
  };

  // Logic to evaluate custom player template URI
  const getCustomProtocol = (template: string, item: PlayItem) => {
    let url = expandMultipleSubtitles(template, item.subs);

    // A helper function to prune template query parameters, flags or keys when their values are absent
    const pruneEmptyPlaceholder = (tpl: string, placeholderName: string) => {
      let t = tpl;
      
      try {
        // 1. Quoted/unquoted CLI options like: --option="...{placeholder}..." or /option:"...{placeholder}..."
        // and standard CLI flags like: --option={placeholder} or --option "{placeholder}" or --option {placeholder}
        // This matches optional command line flags preceding the placeholder without crossing over adjacent flags.
        // E.g. --sub-file={sub} or --sub-file="{sub}" or -s "{sub}" or /sub="{sub}" or /sub={sub} or --sub-file {sub}
        const quotedDoubleReg = `\\s*[-/][-a-zA-Z0-9_.]+(?:\\s+|=)?"[^"]*\\{${placeholderName}\\}[^"]*"`;
        const quotedSingleReg = `\\s*[-/][-a-zA-Z0-9_.]+(?:\\s+|=)?'[^']*\\{${placeholderName}\\}[^']*'`;
        const unquotedReg = `\\s*[-/][-a-zA-Z0-9_.]+(?:\\s+|=)?[^\\s{}]*\\{${placeholderName}\\}[^\\s{}]*`;
        const stdArgRegex = new RegExp(`(?:${quotedDoubleReg})|(?:${quotedSingleReg})|(?:${unquotedReg})`, 'g');
        t = t.replace(stdArgRegex, '');

        // 2. HTTP query parameters: &sub={sub} or ?sub={sub} (with subsequent parameter) or ?sub={sub} at the end
        // We use [^"'{}&?]* to strictly prevent matching across boundaries (no standard & or ? matching)
        // 2.1 &sub={sub} or &sub="{sub}"
        const queryParamAndRegex = new RegExp(`&[-a-zA-Z0-9_.]+(?:\\s+|=)(?:"|')?[^"'{}&?]*\\{${placeholderName}\\}[^"'{}&?]*(?:"|')?`, 'g');
        t = t.replace(queryParamAndRegex, '');
        // 2.2 ?sub={sub}& (replaces with ?)
        const queryParamStartRegex = new RegExp(`\\?[-a-zA-Z0-9_.]+(?:\\s+|=)(?:"|')?[^"'{}&?]*\\{${placeholderName}\\}[^"'{}&?]*(?:"|')?&`, 'g');
        t = t.replace(queryParamStartRegex, '?');
        // 2.3 ?sub={sub} (at the end of template)
        const queryParamEndRegex = new RegExp(`\\?[-a-zA-Z0-9_.]+(?:\\s+|=)(?:"|')?[^"'{}&?]*\\{${placeholderName}\\}[^"'{}&?]*(?:"|')?$`, 'g');
        t = t.replace(queryParamEndRegex, '');
      } catch (err) {
        console.error("Regex pruning error", err);
      }

      // 3. Fallback: Loose single matches of the placeholder
      const looseRegex = new RegExp(`\\{${placeholderName}\\}`, 'g');
      t = t.replace(looseRegex, '');

      return t;
    };

    const hasSub = item.subs && item.subs.length > 0 && item.subs[0];
    if (!hasSub) {
      url = pruneEmptyPlaceholder(url, 'sub');
      url = pruneEmptyPlaceholder(url, 'encodedSub');
    }

    const hasReferrer = !!item.referrer;
    if (!hasReferrer) {
      url = pruneEmptyPlaceholder(url, 'referrer');
      url = pruneEmptyPlaceholder(url, 'encodedReferrer');
    }

    const hasTitle = !!item.title && (item.hasCustomTitle || !item.title.startsWith('影片 '));
    if (!hasTitle) {
      url = pruneEmptyPlaceholder(url, 'title');
      url = pruneEmptyPlaceholder(url, 'encodedTitle');
    }

    url = url.replace(/\{url\}/g, item.videoUrl);
    url = url.replace(/\{encodedUrl\}/g, encodeURIComponent(item.videoUrl));
    
    // Add special placeholder formats removing colons from protocols (like converting 'https://' to 'https//')
    const urlNoColon = item.videoUrl.replace("://", "//");
    url = url.replace(/\{urlNoColon\}/g, urlNoColon);
    url = url.replace(/\{encodedUrlNoColon\}/g, encodeURIComponent(urlNoColon));
    
    url = url.replace(/\{sub\}/g, item.subs[0] || '');
    url = url.replace(/\{encodedSub\}/g, item.subs[0] ? encodeURIComponent(item.subs[0]) : '');
    url = url.replace(/\{title\}/g, item.title);
    url = url.replace(/\{encodedTitle\}/g, encodeURIComponent(item.title));
    url = url.replace(/\{referrer\}/g, item.referrer || '');
    url = url.replace(/\{encodedReferrer\}/g, item.referrer ? encodeURIComponent(item.referrer) : '');

    // SECOND LINE OF DEFENSE: Post-process to aggressively strip out any empty/dirty leftover fields 
    // This handles any manual/built-in leftovers like --sub-file= or --referrer= with no values
    try {
      // 1. Match empty options with '=' like `--sub-file=` or `--sub-file=""` or `--sub-file=''`
      url = url.replace(/\s+[-/][-a-zA-Z0-9_.]+(?:\s*=\s*)(?:"\s*"|'\s*'|\s*(?=\s|-|$))/g, '');
      
      // 2. Match empty options without '=' like `--sub-file ` when followed by another flag or end of line
      url = url.replace(/\s+[-/][-a-zA-Z0-9_.]+(?:\s+)(?=\s+[-/]|$)/g, '');
    } catch (e) {
      console.error("Post-processing replacement error", e);
    }

    // Clean up multiple contiguous spaces
    url = url.replace(/\s+/g, ' ').trim();

    return url;
  };

  // Generate dynamic dynamic players protocols array
  const getPlayersList = (item: PlayItem) => {
    // 1. PotPlayer Special construction (strictly respecting double-quotes & encoding requested configs!)
    const videoUrlNoColon = item.videoUrl.replace("://", "//");
    const subUrl = item.subs[0] || '';
    let potplayerLink = `potplayer://${videoUrlNoColon}`;
    
    const hasSub = !!subUrl;
    const hasReferrer = !!item.referrer;
    const hasTitle = !!item.title && (item.hasCustomTitle || !item.title.startsWith('影片 '));

    if (hasSub) {
      const formattedSub = settings.potplayerUrlEncode ? encodeURIComponent(subUrl) : subUrl;
      potplayerLink += settings.potplayerQuoteWrap ? ` /sub="${formattedSub}"` : ` /sub=${formattedSub}`;
    }
    if (hasReferrer && settings.potplayerSendReferrer) {
      potplayerLink += ` /header="Referer: ${item.referrer}"`;
    }
    if (hasTitle && settings.potplayerSendTitle) {
      potplayerLink += ` /current /title="${item.title}"`;
    }
    potplayerLink += ` /seek=00:00:00`;

    const scheme = item.videoUrl.split(':')[0] || 'https';
    const videoUrlNoProtocol = item.videoUrl.replace(/^https?:\/\//i, '');

    // 2. VLC (Platform-specific setups)
    const vlcDefaultLink = `vlc://${item.videoUrl}`;
    const vlcIosLink = `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(item.videoUrl)}${hasSub ? '&sub=' + encodeURIComponent(subUrl) : ''}`;
    const vlcAndroidLink = `intent://${videoUrlNoProtocol}#Intent;scheme=${scheme};package=org.videolan.vlc;type=video/*${hasSub ? ';S.subtitles_location=' + encodeURIComponent(subUrl) : ''}${hasTitle ? ';S.title=' + encodeURIComponent(item.title) : ''};end`;

    // 3. IINA (macOS Only)
    const iinaLink = `iina://weblink?url=${encodeURIComponent(item.videoUrl)}`;

    // 4. Infuse (iOS/macOS) - Fixed: do not append empty &sub= when subtitles are empty
    const infuseLink = hasSub 
      ? `infuse://x-callback-url/play?url=${encodeURIComponent(item.videoUrl)}&sub=${encodeURIComponent(subUrl)}`
      : `infuse://x-callback-url/play?url=${encodeURIComponent(item.videoUrl)}`;

    // 5. nPlayer
    const nplayerLink = item.videoUrl.replace(/^https?:/, (match) => 'nplayer-' + match.slice(0, -1));

    // 6. MX Player
    let mxplayerLink = `intent://${item.videoUrl.replace(/^https?:\/\//, '')}#Intent;scheme=${item.videoUrl.split(':')[0]};package=com.mxtech.videoplayer.ad`;
    if (hasTitle) {
      mxplayerLink += `;S.title=${encodeURIComponent(item.title)}`;
    }
    mxplayerLink += `;end`;

    // 7. KMPlayer
    const kmplayerLink = `kmplayer://${item.videoUrl}`;

    // 8. OPlayer
    const oplayerLink = `oplayer://${item.videoUrl}`;

    // 9. MPV (Platform-specific setups)
    const mpvCustomLink = getCustomProtocol(`mpv://{url} --sub-file="{encodedSub}" --title="{encodedTitle}" --referrer="{referrer}"`, item);
    const mpvDefaultLink = `mpv://${item.videoUrl}`;
    const mpvAndroidLink = `intent://${videoUrlNoProtocol}#Intent;scheme=${scheme};package=is.xyz.mpv;type=video/*${hasSub ? ';S.subs=' + encodeURIComponent(subUrl) : ''}${hasTitle ? ';S.title=' + encodeURIComponent(item.title) : ''};end`;

    // 10. Kodi (Platform-specific setups)
    const kodiDefaultLink = `kodi://${item.videoUrl}`;
    const kodiAndroidLink = `intent://${videoUrlNoProtocol}#Intent;scheme=${scheme};package=org.xbmc.kodi;type=video/*;end`;

    // 11. Android Universal Selector (Standard Android platform share video intent to prompt system app chooser)
    let androidUniversalLink = `intent://${videoUrlNoProtocol}#Intent;scheme=${scheme};type=video/*`;
    if (hasTitle) {
      androidUniversalLink += `;S.title=${encodeURIComponent(item.title)};S.android.intent.extra.TITLE=${encodeURIComponent(item.title)}`;
    }
    androidUniversalLink += `;end`;

    const native = [
      {
        id: 'pot',
        name: 'PotPlayer (Windows)',
        description: t('極佳效能 Windows 播放器 (支援 Referrer 與精緻字幕參數)', 'High-performance Windows player (supports Referrer and precise subtitle params)'),
        protocol: potplayerLink,
        platform: 'desktop',
        bgColor: 'hover:bg-amber-500/5 group',
        btnColor: 'text-amber-400 group-hover:text-amber-300',
        features: {
          sub: hasSub,
          referrer: hasReferrer && settings.potplayerSendReferrer,
          title: hasTitle && settings.potplayerSendTitle
        }
      },
      {
        id: 'vlc-default',
        name: t('VLC Player (預設協定)', 'VLC Player (Default Protocol)'),
        description: t('通用最簡原生連結，相容於 Windows, macOS 及 Linux', 'Universal minimalist native link, compatible with Windows, macOS, and Linux'),
        protocol: vlcDefaultLink,
        platform: 'desktop',
        bgColor: 'hover:bg-orange-500/5 group',
        btnColor: 'text-orange-400 group-hover:text-orange-300',
        features: {
          sub: false,
          referrer: false,
          title: false
        }
      },
      {
        id: 'vlc-ios',
        name: t('VLC Player (iOS 專用)', 'VLC Player (iOS Only)'),
        description: t('Apple iOS 與 iPadOS 專用，支援載入外部字幕', 'Special for Apple iOS and iPadOS, supports loading external subtitles'),
        protocol: vlcIosLink,
        platform: 'mobile',
        bgColor: 'hover:bg-orange-600/5 group',
        btnColor: 'text-orange-300 group-hover:text-orange-200',
        features: {
          sub: hasSub,
          referrer: false,
          title: false
        }
      },
      {
        id: 'vlc-android',
        name: t('VLC Player (Android 專用)', 'VLC Player (Android Only)'),
        description: t('安卓專用 Intent 啟用，支援字幕及標題傳入', 'Android-exclusive Intent activation, supports passing subtitles and titles'),
        protocol: vlcAndroidLink,
        platform: 'mobile',
        bgColor: 'hover:bg-orange-700/5 group',
        btnColor: 'text-orange-500 group-hover:text-orange-400',
        features: {
          sub: hasSub,
          referrer: false,
          title: hasTitle
        }
      },
      {
        id: 'iina',
        name: 'IINA (macOS)',
        description: t('Mac 原生設計，極簡直覺的精美播放器', 'Native design for macOS, minimalist and intuitive player'),
        protocol: iinaLink,
        platform: 'desktop',
        bgColor: 'hover:bg-teal-500/5 group',
        btnColor: 'text-teal-400 group-hover:text-teal-300',
        features: {
          sub: false,
          referrer: false,
          title: false
        }
      },
      {
        id: 'infuse',
        name: 'Infuse Player (Apple)',
        description: t('iOS、iPadOS、macOS 優質動態串流播放器 (含字幕帶入機制)', 'iOS, iPadOS, macOS premium media player (with subtitle loading mechanism)'),
        protocol: infuseLink,
        platform: 'mobile',
        bgColor: 'hover:bg-rose-500/5 group',
        btnColor: 'text-rose-400 group-hover:text-rose-300',
        features: {
          sub: hasSub,
          referrer: false,
          title: false
        }
      },
      {
        id: 'nplayer',
        name: t('nPlayer (行動端)', 'nPlayer (Mobile)'),
        description: t('支援 WebDAV/FTP / 點擊即播 (iOS/Android)', 'Supports WebDAV/FTP / play on click (iOS/Android)'),
        protocol: nplayerLink,
        platform: 'mobile',
        bgColor: 'hover:bg-blue-500/5 group',
        btnColor: 'text-blue-400 group-hover:text-blue-300',
        features: {
          sub: false,
          referrer: false,
          title: false
        }
      },
      {
        id: 'mxplayer',
        name: 'MX Player (Android)',
        description: t('Android 最受歡迎的多核心硬體加速解碼播放器', 'Most popular multi-core hardware-accelerated decoder player on Android'),
        protocol: mxplayerLink,
        platform: 'mobile',
        bgColor: 'hover:bg-violet-500/5 group',
        btnColor: 'text-violet-400 group-hover:text-violet-300',
        features: {
          sub: false,
          referrer: false,
          title: hasTitle
        }
      },
      {
        id: 'kmplayer',
        name: t('KMPlayer (跨平台)', 'KMPlayer (Cross-platform)'),
        description: t('強大的高清影音播放器，支援多端手勢', 'Powerful high-definition player supporting multi-terminal gestures'),
        protocol: kmplayerLink,
        platform: 'mobile',
        bgColor: 'hover:bg-emerald-500/5 group',
        btnColor: 'text-emerald-400 group-hover:text-emerald-300',
        features: {
          sub: false,
          referrer: false,
          title: false
        }
      },
      {
        id: 'oplayer',
        name: t('OPlayer (行動端)', 'OPlayer (Mobile)'),
        description: t('格式相容極高，解碼與解鎖音軌格式助手', 'Extremely high format compatibility, help decode and unlock audio track formats'),
        protocol: oplayerLink,
        platform: 'mobile',
        bgColor: 'hover:bg-indigo-500/5 group',
        btnColor: 'text-indigo-400 group-hover:text-indigo-300',
        features: {
          sub: false,
          referrer: false,
          title: false
        }
      },
      {
        id: 'mpv-custom',
        name: t('MPV Player (帶自訂參數)', 'MPV Player (with Custom Parameters)'),
        description: t('支援多字幕與 Referrer、標題參數的高效率桌面播放器', 'High-performance desktop player supporting multiple subtitles, Referrer, and title parameters'),
        protocol: mpvCustomLink,
        platform: 'desktop',
        bgColor: 'hover:bg-fuchsia-500/5 group',
        btnColor: 'text-fuchsia-400 group-hover:text-fuchsia-300',
        features: {
          sub: hasSub,
          referrer: hasReferrer,
          title: hasTitle
        }
      },
      {
        id: 'mpv-default',
        name: t('MPV Player (預設協定)', 'MPV Player (Default Protocol)'),
        description: t('純淨、最簡原生協定連結 (mpv://網址)，支援桌面端', 'Pure, minimalist native protocol link (mpv://url), supports desktop platforms'),
        protocol: mpvDefaultLink,
        platform: 'desktop',
        bgColor: 'hover:bg-purple-500/5 group',
        btnColor: 'text-purple-400 group-hover:text-purple-300',
        features: {
          sub: false,
          referrer: false,
          title: false
        }
      },
      {
        id: 'mpv-android',
        name: t('MPV Player (Android 專用)', 'MPV Player (Android Only)'),
        description: t('安卓專門硬體解碼播放器，支援字幕檔案與標題帶入', 'Dedicated Android hardware decoding player, supports subtitles and title transmission'),
        protocol: mpvAndroidLink,
        platform: 'mobile',
        bgColor: 'hover:bg-pink-500/5 group',
        btnColor: 'text-pink-400 group-hover:text-pink-300',
        features: {
          sub: hasSub,
          referrer: false,
          title: hasTitle
        }
      },
      {
        id: 'kodi-default',
        name: t('Kodi Media Center (預設協定)', 'Kodi Media Center (Default Protocol)'),
        description: t('跨平台家庭劇院中心最簡協定連結 (kodi://網址)', 'Cross-platform home theater center minimalist protocol link (kodi://url)'),
        protocol: kodiDefaultLink,
        platform: 'desktop',
        bgColor: 'hover:bg-sky-500/5 group',
        btnColor: 'text-sky-400 group-hover:text-sky-300',
        features: {
          sub: false,
          referrer: false,
          title: false
        }
      },
      {
        id: 'kodi-android',
        name: t('Kodi Media Center (Android 專用)', 'Kodi Media Center (Android Only)'),
        description: t('安卓專屬 Intent 啟用機制的 Kodi 家庭劇院播放器', 'Android-exclusive Intent activation mechanism for Kodi home theater player'),
        protocol: kodiAndroidLink,
        platform: 'mobile',
        bgColor: 'hover:bg-cyan-600/5 group',
        btnColor: 'text-cyan-300 group-hover:text-cyan-200',
        features: {
          sub: false,
          referrer: false,
          title: false
        }
      },
      {
        id: 'android-universal',
        name: t('Android 通用選擇器', 'Android Universal Chooser'),
        description: t('調用安卓系統「開啟為...」選單，並支援標題傳遞', 'Invokes Android system "Open with..." menu and supports passing video titles'),
        protocol: androidUniversalLink,
        platform: 'mobile',
        bgColor: 'hover:bg-cyan-500/5 group',
        btnColor: 'text-cyan-400 group-hover:text-cyan-300',
        features: {
          sub: false,
          referrer: false,
          title: hasTitle
        }
      },
      {
        id: 'download-direct',
        name: t('直接下載資源', 'Direct Download / Open Raw Link'),
        description: t('直接下載或開啟該目標影片、音訊資源 (僅使用原始連結)', 'Direct download or open target video/audio resource (uses raw link only)'),
        protocol: item.videoUrl,
        platform: 'both',
        download: true,
        bgColor: 'hover:bg-emerald-500/10 group',
        btnColor: 'text-emerald-400 group-hover:text-emerald-300',
        features: {
          sub: false,
          referrer: false,
          title: false
        }
      }
    ];

    const custom = customPlayers.map(p => {
      const customProtocol = getCustomProtocol(p.template, item);
      return {
        id: p.id,
        name: `${p.name} (自訂)`,
        description: p.description || '自訂協定',
        protocol: customProtocol,
        platform: 'custom',
        bgColor: 'hover:bg-sky-500/5 group',
        btnColor: 'text-sky-400 group-hover:text-sky-300',
        isCustom: true,
        features: {
          sub: hasSub && (p.template.includes('{sub}') || p.template.includes('{encodedSub}')),
          referrer: hasReferrer && (p.template.includes('{referrer}') || p.template.includes('{encodedReferrer}')),
          title: hasTitle && (p.template.includes('{title}') || p.template.includes('{encodedTitle}'))
        }
      };
    });

    return [...native, ...custom];
  };

  const handleAddCustomPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim() || !newPlayerTemplate.trim()) return;

    const newPlayer: CustomPlayer = {
      id: `custom-${Date.now()}`,
      name: newPlayerName.trim(),
      description: newPlayerDesc.trim(),
      template: newPlayerTemplate.trim()
    };

    setCustomPlayers([...customPlayers, newPlayer]);
    setNewPlayerName('');
    setNewPlayerDesc('');
    setNewPlayerTemplate('');
  };

  const handleDeleteCustomPlayer = (id: string) => {
    setCustomPlayers(customPlayers.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#e4e6eb] font-sans antialiased relative">
      {/* Decorative Atmosphere Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Structural Container */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 flex flex-col gap-6 h-full">
        
        {/* Header Branding */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Tv className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-wider text-white flex items-center gap-2">
                VIDEO LINK PLAYER
                <span className="text-[10px] uppercase tracking-widest bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-bold">
                  Pro v2.6
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t("影音多格式連結播放與協定啟動器 — 支援 Referrer、自訂協定、字幕自訂與精準感應手勢", "Video link player & protocol launcher — Support Referrer, custom protocol, custom subtitles & precise sensor gestures")}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Support Developer Button */}
            <button
              onClick={() => setIsSupportOpen(true)}
              className="bg-[#3b0d17]/40 hover:bg-[#581121]/50 border border-rose-900/50 rounded-lg px-3 py-2 flex items-center gap-2 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer font-semibold shadow-sm"
              title={t("支持開發者", "Support Developer")}
            >
              <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 animate-pulse" />
              <span>{t("支持開發者", "Support Developer")}</span>
            </button>

            {/* Language Toggle Switcher */}
            <button
              onClick={() => {
                const nextLang = uiLang === 'zh-TW' ? 'en' : 'zh-TW';
                const updatedSettings = { ...settings, uiLanguage: nextLang as 'en' | 'zh-TW' };
                setSettings(updatedSettings);
                localStorage.setItem('vlp-settings', JSON.stringify(updatedSettings));
              }}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 rounded-lg px-3 py-2 flex items-center gap-2 text-zinc-300 hover:text-white transition-colors cursor-pointer font-medium"
              title={t("切換語言 / Switch Language", "Switch Language / 切換語言")}
            >
              <Globe className="h-3.5 w-3.5 text-indigo-400" />
              <span>{uiLang === 'zh-TW' ? 'English' : '繁體中文'}</span>
            </button>

            {/* Preferences/Settings panel trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 rounded-lg px-3 py-2 flex items-center gap-2 text-[#ccc] hover:text-white transition-colors cursor-pointer"
            >
              <Settings className={`h-3.5 w-3.5 ${isSettingsOpen ? 'animate-spin' : ''}`} />
              <span>{t("進階偏好設定", "Advanced Settings")}</span>
            </button>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-zinc-400">{t("解析項目：", "Items: ")}</span>
              <strong className="text-emerald-400">{items.length}</strong>
            </div>
          </div>
        </header>

        {typeof window !== 'undefined' && window.self !== window.top && (
          <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-200/90 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
              <div>
                <span className="font-extrabold text-white">{t("iFrame 獨立分頁開啟提醒：", "iFrame Sandbox Warning:")}</span>
                {t("目前網頁運行於安全沙盒預覽模式。若您點擊右下角「啟動播放協定」無反應，這是瀏覽器對內嵌框架的安全限制。請點擊預覽右上方「在新分頁中開啟 / Open in New Tab」圖示以跳出獨立視窗，即可 100% 順暢直接調用喚起您本機的 PotPlayer / VLC / MPV 等專業播放器！", "This app runs in an iframe sandbox in preview. External deep links or custom protocol launchers (PotPlayer, VLC, etc.) might be blocked under parent page security boundaries. If protocol buttons do not respond, click the 'Open in New Tab' icon at the top-right of the preview to pop out into a standalone window where local launchers run 100% flawlessly!")}
              </div>
            </div>
          </div>
        )}

        {/* Content Area Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Block - Player and External Protocols (8 columns) */}
          <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-5">
            {activeItem ? (
              <div className="flex flex-col gap-4">
                {/* Embedded Video Area Container */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-zinc-800/80 group">
                  <ArtPlayerComponent 
                    url={activeItem.videoUrl} 
                    title={activeItem.title} 
                    subs={activeItem.subs}
                    referrer={activeItem.referrer}
                    settings={settings}
                    targetLang={targetLang}
                    onVideoReady={(video) => handleVideoElementChanged(video)}
                    geminiSubtitle={currentSubtitle}
                    geminiOriginalSubtitle={currentOriginalSubtitle}
                    geminiTranslatedSubtitle={currentTranslatedSubtitle}
                    isGeminiListening={embedInPlayer && (geminiStatus === 'listening' || geminiStatus === 'refreshing')}
                  />
                </div>

                {/* Active Media Stats Badge bar */}
                <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1 min-w-0 w-full">
                       <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">{t("當前播映影片", "Now Playing")}</span>
                      <h2 className="text-base font-extrabold text-white mt-0.5 break-words whitespace-normal leading-relaxed" id="playing-title">
                        {activeItem.title}
                      </h2>
                    </div>
                    {activeItem.referrer && (
                      <div className="shrink-0 bg-amber-950/40 border border-amber-900/40 px-3 py-1.5 rounded-xl text-left md:text-right max-w-full min-w-0 md:max-w-xs">
                        <span className="text-[9px] text-amber-500 block font-semibold">REFERRER HEADERS</span>
                        <span className="text-xs text-amber-300 font-mono font-medium block break-all whitespace-normal" title={activeItem.referrer}>
                          {activeItem.referrer}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Loaded subtitle files download tracker */}
                  {activeItem.subs && activeItem.subs.length > 0 && (
                    <div className="mt-1 bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase">
                          {t("📂 偵測到之本片字幕檔案 (", "📂 Detected Subtitle Files (")}{activeItem.subs.length}{t(" 個軌道)", " Tracks)")}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-0.5">
                        {activeItem.subs.map((subUrl, idx) => {
                          const filename = subUrl.substring(subUrl.lastIndexOf('/') + 1) || `subtitle_${idx + 1}`;
                          const isCopied = copiedSubIdx === idx;
                          return (
                            <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-950/90 border border-zinc-900 text-xs">
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-zinc-300 block truncate" title={decodeURIComponent(filename)}>
                                  {t("第 ", "Track ")}{idx + 1}{t(" 軌：", ": ")}{decodeURIComponent(filename)}
                                </span>
                                <span className="text-[9px] text-zinc-500 block truncate" title={subUrl}>
                                  {subUrl}
                                </span>
                              </div>
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(subUrl);
                                    setCopiedSubIdx(idx);
                                    setTimeout(() => setCopiedSubIdx(null), 1500);
                                  }}
                                  className="h-7 w-7 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                  title={t("複製字幕網址", "Copy Subtitle Link")}
                                >
                                  {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                </button>
                                <button
                                  onClick={(e) => handleDownloadSubtitle(subUrl, idx, e)}
                                  className="h-7 px-2.5 rounded bg-sky-600/20 border border-sky-500/20 hover:bg-sky-600/30 text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                  title={t("下載字幕檔案", "Download Subtitle File")}
                                >
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  <span>{t("下載", "Download")}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="h-[1px] bg-zinc-900" />

                  {/* External launchers with rich layout & category filter */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2 border-b border-zinc-900">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] block">
                        {t("外部播放器啟動協定 (", "External Protocols (")}{getPlayersList(activeItem).length}{t(" 款支援)", " Supported)")}
                      </span>
                      
                      {/* Sub-tabs for quick filter of launchers */}
                      <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800">
                        {(['all', 'desktop', 'mobile', 'custom'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-md transition-all cursor-pointer ${
                              activeTab === tab 
                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                                : 'text-zinc-400 hover:text-white border border-transparent'
                            }`}
                          >
                            {tab === 'all' && t('全部', 'All')}
                            {tab === 'desktop' && t('電腦專用', 'Desktop')}
                            {tab === 'mobile' && t('行動裝置', 'Mobile')}
                            {tab === 'custom' && `${t('自訂播放', 'Custom')} (${customPlayers.length})`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                      {getPlayersList(activeItem)
                        .filter(p => {
                          if (activeTab === 'all') return true;
                          if (activeTab === 'desktop') return p.platform === 'desktop' || p.platform === 'both';
                          if (activeTab === 'mobile') return p.platform === 'mobile' || p.platform === 'both';
                          if (activeTab === 'custom') return p.platform === 'custom';
                          return true;
                        })
                        .sort((a, b) => {
                          const aPinned = pinnedPlayerIds.includes(a.id);
                          const bPinned = pinnedPlayerIds.includes(b.id);
                          if (aPinned && !bPinned) return -1;
                          if (!aPinned && bPinned) return 1;
                          return 0; // maintain default definition order
                        })
                        .map(player => (
                          <ProtocolCard 
                            key={player.id}
                            name={player.name}
                            description={player.description}
                            protocol={player.protocol}
                            onCopy={(text) => handleCopyLink(text, player.id)}
                            isCopied={copiedId === player.id}
                            bgColor={`${player.bgColor} transition-all duration-200`}
                            btnColor={player.btnColor}
                            actionLabel={(player as any).isCustom ? t("啟動自訂", "Launch Custom") : ((player as any).download ? t("下載", "Download") : t("啟動", "Launch"))}
                            activeFeatures={player.features}
                            isPinned={pinnedPlayerIds.includes(player.id)}
                            onTogglePin={() => handleTogglePinPlayer(player.id)}
                            download={(player as any).download}
                            t={t}
                          />
                        ))}
                      {activeTab === 'custom' && customPlayers.length === 0 && (
                        <div className="col-span-2 py-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
                          <Sliders className="h-5 w-5 mx-auto text-zinc-600 mb-2" />
                          <p className="text-xs">{t("尚未建立自訂播放器協定", "No custom player protocols registered yet")}</p>
                          <p className="text-[10px] text-zinc-600 mt-1">
                            {t("您可以點擊右上角「進階偏好設定」來新增您私人的播放器！", "You can click 'Advanced Settings' at the top-right to add your own custom player links!")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gemini Live Translation Subtitles Controller */}
                <div className="bg-zinc-950/85 border border-zinc-900 rounded-2xl p-4 flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 animate-pulse text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-white">{t("Gemini Live 即時 AI 字幕翻譯助理", "Gemini Live Real-time AI Subtitle Assistant")}</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{t("採用 Google WebSocket 極速低延遲 Multimodal Live 技術", "Powered by Google Multimodal Live low-latency WebSocket SDK tech")}</p>
                      </div>
                    </div>
                    {geminiStatus !== 'disconnected' && (
                      <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${geminiStatus === 'refreshing' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${geminiStatus === 'refreshing' ? 'bg-amber-500 animate-ping' : 'bg-emerald-400'}`} />
                        {geminiStatus === 'connecting' && t('正在連線中', 'Connecting...')}
                        {geminiStatus === 'ready' && t('雙向通道已就緒', 'Channel Ready')}
                        {geminiStatus === 'listening' && t('雙向聽音生成辨識中', 'Subtitles Syncing')}
                        {geminiStatus === 'refreshing' && t('自動恢復修復中', 'Recovering...')}
                      </span>
                    )}
                  </div>

                  {geminiStatus === 'refreshing' && (
                    <div className="bg-amber-950/10 border border-amber-500/30 rounded-xl p-3 flex gap-2.5 items-center text-xs text-amber-200">
                      <div className="h-3.5 w-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                      <p className="leading-normal font-semibold font-mono">{geminiStatusDesc || t("自動恢復無縫連接中 (Auto-reconnecting)...", "Reconnecting seamlessly (Auto-reconnecting)...")}</p>
                    </div>
                  )}

                  {geminiError && (
                    <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3 flex gap-2 text-xs text-red-200">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="leading-normal">{geminiError}</p>
                    </div>
                  )}

                  {/* Settings section */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900/60">
                    {/* Language Selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider">{t("翻譯目標語言", "Translation Target Language")}</label>
                      <select 
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        disabled={geminiStatus !== 'disconnected'}
                        className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 disabled:opacity-50 disabled:hover:border-zinc-800 rounded-lg py-1 px-2.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-medium"
                      >
                        {LANGUAGES_LIST.map((lang) => (
                          <option key={lang.name} value={lang.name}>
                            {t(lang.labelZh, lang.labelEn)}
                          </option>
                        ))}
                        <option value="none">{t("純聽寫 (不翻譯 - 辨識原始音訊)", "Transcription-only (No Translation)")}</option>
                      </select>
                    </div>

                    {/* Audio Input Source Selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider">{t("音訊來源方式", "Audio Source")}</label>
                      <select 
                        value={audioSource}
                        onChange={(e) => setAudioSource(e.target.value as any)}
                        disabled={geminiStatus !== 'disconnected'}
                        className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 disabled:opacity-50 disabled:hover:border-zinc-800 rounded-lg py-1 px-2.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-medium"
                      >
                        <option value="mic">{t("🎙️ 麥克風聽音模式 (雙端最穩)", "🎙️ Microphone Mode (Most Stable)")}</option>
                        {isDisplayMediaSupported && (
                          <option value="system">{t("💻 系統/分頁聲音抓取 (Loopback 免麥克風/推薦)", "💻 System/Tab Audio Capture (Loopback / Recommended)")}</option>
                        )}
                        <option value="player">{t("📺 網頁播放器直接耦合 (CORS 阻擋時不適用)", "📺 Built-in Player Direct Capture (CORS constraint)")}</option>
                      </select>
                    </div>

                    {/* Caption Layer Toggle */}
                    <div className="flex flex-col gap-1.5 justify-center sm:pl-3">
                      <label className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <span>{t("播放器輔助浮動外殼", "In-Player Subtitle Overlay")}</span>
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 py-0.2 rounded font-mono">NEW</span>
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => setEmbedInPlayer(!embedInPlayer)}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                            embedInPlayer ? 'bg-indigo-600' : 'bg-zinc-800'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                              embedInPlayer ? 'translate-x-[18px]' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="text-xs text-zinc-300 font-semibold select-none font-medium">{t("啟用播放器貼底浮殼", "Render Overlay Over Player")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5">
                      {geminiStatus === 'disconnected' ? (
                        <button
                          onClick={startGeminiCaptioner}
                          className="flex-1 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 font-extrabold text-xs text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/30 transition-all active:scale-98 cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 text-white" />
                          <span>{t("開啟 Gemini Live 即時 AI 字幕助理", "Start Gemini Live Subtitle Assistant")}</span>
                        </button>
                      ) : (
                        <button
                          onClick={stopGeminiCaptioner}
                          className="flex-1 bg-red-600 hover:bg-red-500 font-extrabold text-xs text-white py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5 text-white" />
                          <span>{t("中斷關閉 AI 雙向字幕連線", "Disconnect / Stop Gemini Live Link")}</span>
                        </button>
                      )}
                    </div>

                    {/* Floating & PiP Utilities overlay control panel */}
                    {geminiStatus !== 'disconnected' && (
                      <div className="bg-indigo-950/25 border border-indigo-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-indigo-300 font-black flex items-center gap-1">
                            <span>{t("📺 跨應用/跨分頁 懸浮字幕工具箱", "📺 Cross-App Floating Subtitles Toolbox")}</span>
                            <span className="text-[9px] bg-indigo-500/30 text-indigo-200 border border-indigo-500/50 px-1 py-0.2 rounded font-sans uppercase">Ready</span>
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                            {t("💡 若您想辨識 mpv、其它桌面播放器或其它分頁。請將上方音源設為 🎙️ 麥克風聽訊模式，並點選下方開啟 子母畫面，字幕就會完美懸浮於其它軟體的最上層！", "💡 To overlay captions on mpv or other desktop windows, set Audio Source above to Microphone, and turn on Picture-in-Picture (PiP) below.")}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {/* In-App Floating Panel Toggle */}
                          <button
                            onClick={() => setShowInAppFloatingSub(!showInAppFloatingSub)}
                            className={`text-xs font-extrabold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              showInAppFloatingSub 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/30' 
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                            <span>{showInAppFloatingSub ? t('關閉網頁懸浮', 'Close Overlay') : t('開啟網頁懸浮', 'Open Overlay')}</span>
                          </button>

                          {/* OS System level Picture-in-Picture Overlay Toggle */}
                          <button
                            onClick={isPipActive ? stopPipSubtitles : startPipSubtitles}
                            className={`text-xs font-extrabold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                              isPipActive 
                                ? 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/30' 
                                : 'bg-indigo-650 hover:bg-indigo-600 text-white'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full bg-current shrink-0 ${isPipActive ? 'animate-pulse' : ''}`} />
                            <span>{isPipActive ? t('關閉子母視窗', 'Close PiP') : t('開啟子母視窗 (PiP)', 'Open PiP Bubble')}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subtitle list window board rendering */}
                  {geminiStatus === 'listening' && (
                    <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-1 text-[10px] font-extrabold tracking-wider text-zinc-400">
                        <span>{t("📝 即時語音歷史看板 (SCROLL BOARD)", "📝 Live Subtitles History Board")}</span>
                        <span className="text-emerald-400 font-mono flex items-center gap-1 animate-pulse">
                          {t("● LIVE CHUNKS INCOMING", "● Live Stream Active")}
                        </span>
                      </div>

                      {/* Silence Warning Alert block */}
                      {isAudioSilent && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] rounded-lg p-3 space-y-2 my-1 leading-relaxed">
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertCircle className="h-4 w-4 text-amber-400" />
                            <span>{t("⚠️ 偵測到音訊來源「完全靜音」！", "⚠️ Silent Audio Detected!")}</span>
                          </div>
                          <div className="text-[10.5px] text-zinc-400 space-y-1.5 pl-5">
                            {audioSource === 'player' ? (
                              <>
                                <p>{t("這通常代表：", "This usually indicates:")}</p>
                                <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
                                  <li>{t("當前影音流受到 CORS 跨域安全協定限制（瀏覽器防禦規範），導致網頁播放器無法直接將音軌傳輸給 Web Audio 機制；", "Player sound loopback is blocked by CORS security walls.")}</li>
                                  <li>{t("或是播放器目前處於「暫停狀態」，故無 any 音訊訊號流出（此為正常狀態，播放後警告即會自動關閉）。", "Or the media stream is currently paused (resume play to clear this warning automatically).")}</li>
                                </ul>
                                <p className="text-amber-300 font-semibold">{t("💡 行動裝置（手機）使用者特助提示：", "💡 Mobile User Tip:")}</p>
                                <p className="text-zinc-400">{t("當您在手機/平板上播映此影音時，行動作業系統為防止音訊回嘯與回授，會自動強制阻斷同網頁的音軌監聽。建議將影音連結放在電腦/電視/平板播映，並在手機上啟用 🎙️ 麥克風聽音模式 貼近喇叭收音，即可實現 100% 完美的即時字幕辨識！", "Mobile security sandboxes might suspend web microphones during playback. Cast media on a secondary device & enable mic capture on your phone!")}</p>
                              </>
                            ) : audioSource === 'system' ? (
                              <>
                                <p>{t("偵測到系統或分頁內部音軌為靜音，這通常代表：", "System/tab audio loopback is silent, usually indicating:")}</p>
                                <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
                                  <li>{t("當前選擇分享的分頁內尚未播放影音、或影音目前處於靜音、暫停狀態；", "The target tab hasn't started playing or is muted/paused;")}</li>
                                  <li>{t("⚠️ 最常見原因：您在瀏覽器彈出的畫面分享視窗中，忘記勾選左下角（或特定位置）的「分享分頁音訊」/「共用音訊」核取方塊！", "⚠️ Most common: you forgot to check 'Share tab audio' or 'Include system audio' checkbox inside browser select dialog!")}</li>
                                </ul>
                                <p className="text-amber-355 font-bold">{t("💡 解決方法：", "💡 Resolution:")}</p>
                                <p className="text-zinc-400 leading-normal">{t("請點選上方按鈕中斷，再重新開啟，並在彈出的瀏覽器分享對話框中確認勾選「共用分頁音訊」或「分享系統聲音」再進行分享，即可完美接收高保真無雜音的 99% 精準字幕！", "Please stop, start again, and remember to check 'Include tab audio' in popup browser window.")}</p>
                              </>
                            ) : (
                              <>
                                <p>{t("未偵測到任何麥克風拾音信號，這代表：", "No microphone signals captured, reflecting:")}</p>
                                <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
                                  <li>{t("您目前處於安靜狀態（請試著開口發聲、或大聲說話測試）；", "You are fully silent right now (try speaking up to verify microphone activity);")}</li>
                                  <li>{t("您的麥克風受到實體按鍵靜音、或瀏覽器未取得您的錄音授權許可；", "Your microphone might be hard-muted or permission was rejected in system browser boundaries;")}</li>
                                  <li>{t("手機系統限制：在手機上播放有聲音的影片時，手機作業系統（尤其是 iOS Safari）會自動將麥克風錄音「強制掛起靜音」。", "Mobile sandbox boundaries: Mobile OS (especially iOS Safari) force-kills mic records when playing media.")}</li>
                                </ul>
                                <p className="text-amber-300 font-semibold">{t("💡 手機同步聽音完美方案：", "💡 Smart Mobile Setup:")}</p>
                                <p className="text-zinc-400 leading-normal">{t("請在使用另一台設備（如電腦、平板、電視、喇叭）播映影音的同時，將手機放置在喇叭旁並啟用「🎙️ 麥克風聽音模式」，即可避開所有手機瀏覽器硬體限制，完美進行 AI 即時翻譯與字幕生成！", "If you want to read mobile subtitle tracks, stream content on PC or smart TV and let your phone's microphone grab acoustics next to speakers!")}</p>
                              </>
                            )}
                          </div>
                          {audioSource !== 'mic' && (
                            <div className="pl-5 pt-1">
                              <button
                                onClick={() => {
                                  stopGeminiCaptioner();
                                  setAudioSource('mic');
                                }}
                                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[10px] px-2.5 py-1 rounded transition-all cursor-pointer"
                              >
                                {t("立即切換成「🎙️ 麥克風聽音模式」", "Switch to Microphone Mode now")}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Scrolling historical box */}
                      <div 
                        className="max-h-[140px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent space-y-2.5 flex flex-col-reverse text-xs min-h-[50px] px-1"
                      >
                        {/* Active current subtitle block */}
                        {currentSubtitle && (
                          <div className="text-emerald-300 font-black tracking-wide leading-relaxed pl-2.5 py-0.5 border-l-2 border-emerald-500 animate-pulse">
                            {currentSubtitle}
                          </div>
                        )}

                        {/* Staged subtitle lines */}
                        {subtitleHistory.length === 0 && !currentSubtitle && (
                          <div className="text-zinc-500 font-medium italic text-center py-4">
                            {t("等待音訊輸入以自動辨識生成...", "Waiting for audio input to automatically recognize and generate captions...")}
                          </div>
                        )}
                        {[...subtitleHistory].reverse().map((line, idx) => (
                          <div key={idx} className="text-zinc-300 font-medium tracking-wide leading-relaxed pl-2.5 border-l border-zinc-800">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 bg-zinc-950/40 rounded-3xl border border-zinc-900 border-dashed text-zinc-500 text-center">
                <AlertCircle className="h-10 w-10 text-zinc-600 mb-3" />
                <p className="text-sm">暫無可供播放的媒體項目</p>
                <p className="text-xs text-zinc-600 mt-1">請在右側編輯器輸入正確的串流播放清單格式</p>
              </div>
            )}
          </div>

          {/* Right Block - Custom Parser Settings & Live Output (4 columns) */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6">
            
            {/* Playlist input zone */}
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-extrabold text-white tracking-wider uppercase">{t("影片清單編輯器", "Video List Editor")}</h3>
                </div>
                <button 
                  onClick={() => setPlaylistText(DEFAULT_PLAYLIST)}
                  className="text-[10px] text-sky-400 hover:text-sky-300 border border-sky-400/20 px-2 py-1 rounded bg-sky-400/5 transition-all"
                >
                  {t("重置預設 Demo", "Reset Default Demo")}
                </button>
              </div>
              
              <div className="relative">
                <textarea
                  value={playlistText}
                  onChange={(e) => setPlaylistText(e.target.value)}
                  placeholder={t("輸入範例格式：\n影片名稱$https://link.mp4 --sub=\"https://subtitle.srt\" --referrer=\"https://referer.com\"", "Enter example format:\nVideo Title$https://link.mp4 --sub=\"https://subtitle.srt\" --referrer=\"https://referer.com\"")}
                  className="w-full h-44 bg-[#0d0e12] border border-zinc-800/80 rounded-2xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-sky-500/50 transition-colors resize-y leading-relaxed"
                />
              </div>

              {/* Parsing rules instruction banner */}
              <div className="text-[10px] text-zinc-400 space-y-1 bg-zinc-900/30 border border-zinc-900/50 p-3 rounded-xl leading-relaxed">
                <p className="font-extrabold text-zinc-300 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" /> 
                  {t("動態語法支援與繼承規則：", "Dynamic Syntax Support & Inheritance Rules:")}
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-zinc-400 pl-1 mt-1">
                  <li>{t("自訂名稱：以 $ 字元分隔標題與網址。", "Custom Name: Separate title and URL with a '$' character.")}</li>
                  <li>{t("字幕支援：使用 --sub=\"...\" 或 --sub=網址。", "Subtitle Support: Use --sub=\"...\" or --sub=URL.")}</li>
                  <li>{t("Referrer 標頭：使用 --referrer=\"...\"，如多目標播放，後續網址會自動繼承前置設定。", "Referrer Header: Use --referrer=\"...\", subsequent URLs will automatically inherit previous headers in multi-target mode.")}</li>
                </ul>
              </div>
            </div>

            {/* Live interactive parsed list */}
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#a1a1aa] block px-1">
                {t("已解析的媒體播放清單", "Parsed Media Playlist")} ({items.length})
              </span>
              
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {items.map((item, index) => {
                  const isActive = activeItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveItem(item)}
                      className={`group/item flex flex-col p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                        isActive 
                          ? 'bg-sky-500/5 border-sky-500/40' 
                          : 'bg-zinc-900/30 border-zinc-800/50 hover:bg-zinc-900/60 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-2.5 truncate">
                          <span className={`text-[10px] font-mono h-5 w-5 rounded flex items-center justify-center ${
                            isActive ? 'bg-sky-500 text-white font-bold' : 'bg-zinc-900 text-zinc-500'
                          }`}>
                            {index + 1}
                          </span>
                          <span className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-zinc-300 group-hover/item:text-white'}`}>
                            {item.title}
                          </span>
                        </div>
                        {isActive && <Play className="h-3.5 w-3.5 text-sky-400 shrink-0 fill-sky-400/20 animate-pulse" />}
                      </div>

                      <div className="text-[10px] text-zinc-500 font-mono break-all whitespace-normal pl-7 pr-2 mt-1.5 opacity-70 group-hover/item:opacity-100 transition-opacity">
                        {formatFriendlyUrl(item.videoUrl)}
                      </div>

                      {/* Display Badges for inheritance information */}
                      <div className="flex flex-wrap gap-1.5 pl-7 mt-2">
                        {item.subs.length > 0 && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                            item.inheritedSub 
                              ? 'bg-emerald-950/20 text-emerald-400 border-emerald-950/50' 
                              : 'bg-sky-950/20 text-sky-400 border-sky-950/50'
                          }`}>
                            {t("字幕", "Sub")}{item.subs.length > 1 ? ` (${item.subs.length}${t("個", "x")})` : ''}{item.inheritedSub ? t(" (已繼承)", " (Inherited)") : t(" (自訂)", " (Custom)")}
                          </span>
                        )}
                        {item.referrer && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                            item.inheritedReferrer 
                              ? 'bg-violet-950/20 text-violet-400 border-violet-950/50' 
                              : 'bg-amber-950/20 text-amber-500 border-amber-950/50'
                          }`}>
                            Ref{item.inheritedReferrer ? t(" (已繼承)", " (Inherited)") : t(" (自訂)", " (Custom)")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <p className="text-zinc-600 text-[11px] text-center py-6">{t("無有效的解析項目...", "No parsed items found...")}</p>
                )}
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* Support Developer Modal */}
      {isSupportOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-[#0e0f13] border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-xs text-[#e4e6eb]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-900 bg-zinc-950/50">
              <div className="flex items-center gap-2.5">
                <Heart className="h-5 w-5 text-rose-500 fill-rose-500 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {t("支持與贊助開發者", "Support Developer")}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {t("感謝您的支持，這將推動播放器功能持續更新與改進！", "Thank you! Your backing keeps updates and improvements active.")}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSupportOpen(false)}
                className="h-8 w-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col items-center gap-6">
              <div className="text-center space-y-2">
                <p className="font-bold text-zinc-300 text-xs">
                  {t("掃描下方 QR Code 或複製地址進行轉帳", "Scan QR Code or copy the USDT address below")}
                </p>
                <span className="inline-block px-2.5 py-1 rounded bg-amber-950/30 border border-amber-900/40 text-[10px] text-amber-400 font-extrabold tracking-wider">
                  USDT-TRC20 NETWORK ONLY
                </span>
              </div>

              {/* QR Code Graphic Frame */}
              <div className="bg-white p-3.5 rounded-2xl shadow-xl border border-zinc-700/30 relative group transition-transform duration-300 hover:scale-[1.02]">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=THtQ6hhdJnfR7sNDnsuP7FdEzKN8TVRcNH" 
                  alt="USDT TRC20 QR Code"
                  className="h-[180px] w-[180px] select-none bg-zinc-50"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* USDT Address Copy card */}
              <div className="w-full space-y-2">
                <div className="flex justify-between items-center px-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  <span>USDT TRC-20 Address</span>
                  <span className="text-zinc-600">TRC20 Protocol</span>
                </div>
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                  <span className="font-mono text-[11px] text-emerald-400 flex-1 break-all tracking-wider text-center select-all">
                    THtQ6hhdJnfR7sNDnsuP7FdEzKN8TVRcNH
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("THtQ6hhdJnfR7sNDnsuP7FdEzKN8TVRcNH");
                      setAddressCopied(true);
                      setTimeout(() => setAddressCopied(false), 2000);
                    }}
                    className="h-8 w-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title={t("複製地址", "Copy Address")}
                  >
                    {addressCopied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-center text-[10px] text-zinc-500 max-w-xs leading-relaxed">
                {t("提示：本專案完全開源免費。如果您覺得好用，歡迎打賞支持以維持後續服務的開發與伺服器維護！", "Note: This player is open-source. Donations maintain free services, development, and active hosting.")}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/45 flex justify-end">
              <button
                onClick={() => setIsSupportOpen(false)}
                className="px-4 py-2 bg-[#5145cd] hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                {t("關閉", "Close")}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Slide / Glassmorphic Preference Controls Overlay Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-[#0e0f13] border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-900 bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-400 animate-spin-slow" />
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {t("進階播放設定 & 自訂播放器架構", "Advanced Settings & Custom Player Architecture")}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {t("自訂 PotPlayer、內置網頁播放器及匯入其他第三方 APP 鏈結方案", "Customize PotPlayer, web player, and register custom third-party protocol schemes")}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="h-8 w-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Section 1: PotPlayer Detailed configuration (Addressing user's original rules) */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-1.5 font-bold text-white text-xs uppercase tracking-wider">
                  <Sliders className="h-3.5 w-3.5 text-amber-500" />
                  <span>{t("PotPlayer (Windows) 開發者傳遞規則", "PotPlayer (Windows) Developer Transmission Rules")}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                  
                  {/* Rule 1: No double quotes wrapper for subtitle link */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={settings.potplayerQuoteWrap}
                      onChange={(e) => setSettings({ ...settings, potplayerQuoteWrap: e.target.checked })}
                      className="mt-0.5 accent-indigo-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-zinc-200">{t("字幕連結用引號包圍", "Wrap Subtitle URL in Quotes")}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {t("關閉以符合「字幕鏈結不要用引號包圍」設定，防止命令列格式報錯。", "Disable to satisfy 'no quotes for subtitle links' to avoid command-line errors.")}
                      </p>
                    </div>
                  </label>

                  {/* Rule 2: Subtitle no URL transcoding */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={settings.potplayerUrlEncode}
                      onChange={(e) => setSettings({ ...settings, potplayerUrlEncode: e.target.checked })}
                      className="mt-0.5 accent-indigo-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-zinc-200">{t("字幕連結進行 URL 編碼", "URL-Encode Subtitle Link")}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {t("關閉以防轉碼 (如「字幕鏈結不要做 url 轉碼」)，讓雙字節元數據完美相容。", "Disable to prevent transcoding (e.g., 'Do not URL encode subtitle link') for multi-byte compatibility.")}
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Send title */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={settings.potplayerSendTitle}
                      onChange={(e) => setSettings({ ...settings, potplayerSendTitle: e.target.checked })}
                      className="mt-0.5 accent-indigo-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-zinc-200">{t("傳遞影片名稱", "Pass Video Title")}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {t("是否將 parsed 影片標題以 /title=\"...\" 屬性輸出。", "Whether to pass the parsed video title with the /title=\"...\" attribute.")}
                      </p>
                    </div>
                  </label>

                  {/* Option 4: Send referrer header */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={settings.potplayerSendReferrer}
                      onChange={(e) => setSettings({ ...settings, potplayerSendReferrer: e.target.checked })}
                      className="mt-0.5 accent-indigo-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-zinc-200">{t("傳遞 Referrer Headers 請求標頭", "Pass Referrer Headers")}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {t("是否將安全 Referer 指令包裝在外部通訊協議中，解除某些串流源防盜鏈。", "Wrap secure referer settings within the protocol to bypass original anti-leech blocks.")}
                      </p>
                    </div>
                  </label>

                </div>
              </div>

              {/* Section 2: Web Embedding player configurations */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-1.5 font-bold text-white text-xs uppercase tracking-wider">
                  <Play className="h-3.5 w-3.5 text-sky-400" />
                  <span>{t("內置網頁播放器偏好", "Built-In Web Player Preferences")}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-2">
                  
                  {/* Web autoplay */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={settings.autoplay}
                      onChange={(e) => setSettings({ ...settings, autoplay: e.target.checked })}
                      className="mt-0.5 accent-[#10b981] rounded"
                    />
                    <div>
                      <span className="font-bold text-zinc-200">{t("自動播放 (Autoplay)", "Autoplay")}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {t("當選此影片或新解析載入時，直接播放影片資源。", "Begin media playback immediately upon selection or resource resolution.")}
                      </p>
                    </div>
                  </label>

                  {/* Web CORS crossOrigin setting */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={settings.webPlayerCrossOrigin}
                      onChange={(e) => setSettings({ ...settings, webPlayerCrossOrigin: e.target.checked })}
                      className="mt-0.5 accent-[#10b981] rounded"
                    />
                    <div>
                      <span className="font-bold text-zinc-200">{t("網頁播放器啟用 CORS 跨域屬性", "Enable Web CORS Cross-Origin Attribute")}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {t("對 video 標籤套用 crossorigin=\"anonymous\"。若串流主機無 CORS 跨域標頭，開啟此項會造成「無支援來源」黑屏。預設關閉為最相容模式。", "Apply crossorigin=\"anonymous\" to the video tag. Without proper CORS headers, this causes a black screen. Keeping it off remains most compatible.")}
                      </p>
                    </div>
                  </label>

                  {/* Subtitle font-size adjustment slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-zinc-200">{t("自訂字幕字體大小", "Custom Subtitles Font Size")}</span>
                      <strong className="text-emerald-400 font-mono">{settings.webPlayerSubtitleSize}px</strong>
                    </div>
                    <input 
                      type="range" 
                      min="12" 
                      max="32" 
                      value={settings.webPlayerSubtitleSize}
                      onChange={(e) => setSettings({ ...settings, webPlayerSubtitleSize: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <p className="text-[9px] text-zinc-500 leading-none">
                      {t("調整網頁內置播放器中、外掛字幕的呈現清晰度。", "Adjust the font size of subtitles overlaying the web player for optimal readability.")}
                    </p>
                  </div>

                </div>
              </div>

              {/* Section 2.5: Gemini Live configurations */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-1.5 font-bold text-white text-xs uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{t("Gemini Live 即時字幕偏好設定", "Gemini Live Real-time Subtitles Settings")}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-2">
                  
                  {/* Gemini Only Show Translation */}
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={settings.geminiOnlyTranslation}
                      onChange={(e) => setSettings({ ...settings, geminiOnlyTranslation: e.target.checked })}
                      className="mt-0.5 accent-emerald-500 rounded"
                    />
                    <div>
                      <span className="font-bold text-zinc-200">{t("只顯示翻譯後的即時字幕", "Show Translation Subtitles Only")}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {t("勾選後將隱藏原始發言聽寫，只渲染翻譯後的雙語字幕結果。", "Hide original transcription and display only translated bilingual subtitles.")}
                      </p>
                    </div>
                  </label>

                  {/* Gemini Subtitle font-size adjustment slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-zinc-200">{t("即時 AI 字幕字體大小", "Real-Time AI Subtitles Font Size")}</span>
                      <strong className="text-emerald-400 font-mono">{settings.geminiSubtitleSize}px</strong>
                    </div>
                    <input 
                      type="range" 
                      min="12" 
                      max="60" 
                      value={settings.geminiSubtitleSize}
                      onChange={(e) => setSettings({ ...settings, geminiSubtitleSize: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <p className="text-[9px] text-zinc-500 leading-none">
                      {t("調整 AI 貼底字幕、網頁懸浮客製面板的預設文字字體大小（12px - 60px）。", "Adjust font size of AI subtitles and custom web overlay floating container panels (12px - 60px).")}
                    </p>
                  </div>

                  {/* Gemini Multiple API Key Management */}
                  <div className="col-span-1 sm:col-span-2 border-t border-zinc-900 pt-3.5 mt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-200">{t("自訂 Gemini API 金鑰清單 (輪詢分配)", "Custom Gemini API Keys (Polling Load Balancer)")}</span>
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold uppercase">{t("輪詢管理", "Round Robin")}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <input 
                        type="password"
                        placeholder={t("請輸入 AI Studio API Key (AIzaSy...)", "Please input your AI Studio API Key (AIzaSy...)")}
                        value={newGeminiKey}
                        onChange={(e) => setNewGeminiKey(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:outline-none rounded-lg py-1.5 px-3.5 text-xs text-zinc-300 font-mono"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          if (!newGeminiKey.trim()) return;
                          const keysList = settings.geminiApiKeys || [];
                          if (keysList.includes(newGeminiKey.trim())) return;
                          const updated = {
                            ...settings,
                            geminiApiKeys: [...keysList, newGeminiKey.trim()]
                          };
                          setSettings(updated);
                          setNewGeminiKey('');
                          localStorage.setItem('vlp-settings', JSON.stringify(updated));
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        {t("新增金鑰", "Add Key")}
                      </button>
                    </div>

                    {/* API keys list */}
                    {(settings.geminiApiKeys || []).length > 0 ? (
                      <div className="bg-zinc-950/65 rounded-xl border border-zinc-900/80 p-2.5 max-h-32 overflow-y-auto space-y-1.5">
                        {(settings.geminiApiKeys || []).map((key, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-zinc-900/40 border border-zinc-900 p-1.5 px-2 rounded-lg gap-2 text-[11px]">
                            <span className="text-zinc-400 font-mono truncate select-all">
                              {t("金鑰", "Key")} {idx + 1}: {key.substring(0, 8)}...{key.substring(key.length - 4)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const list = settings.geminiApiKeys || [];
                                const filtered = list.filter((_, i) => i !== idx);
                                const updated = {
                                  ...settings,
                                  geminiApiKeys: filtered
                                };
                                  setSettings(updated);
                                  localStorage.setItem('vlp-settings', JSON.stringify(updated));
                              }}
                              className="text-red-400 hover:text-red-300 font-bold hover:underline py-0.5 px-1.5 cursor-pointer rounded"
                            >
                              {t("刪除", "Delete")}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-500 italic pl-1">
                        {t("目前無配置任何自訂金鑰，預設將使用伺服器的環境變數金鑰。", "No custom keys defined yet. The default backend environmental key will be active.")}
                      </p>
                    )}

                    {/* Restrict toggle */}
                    <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
                      <input 
                        type="checkbox" 
                        checked={!!settings.restrictToCustomApiKeys}
                        onChange={(e) => {
                          const updated = { ...settings, restrictToCustomApiKeys: e.target.checked };
                          setSettings(updated);
                          localStorage.setItem('vlp-settings', JSON.stringify(updated));
                        }}
                        className="mt-0.5 accent-indigo-600 rounded"
                      />
                      <div>
                        <span className="font-bold text-zinc-300">{t("強制只使用我設定的金鑰 (Restrict to Custom)", "Restrict to Custom Keys Only")}</span>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {t("啟用後，後端將僅在您自訂的金鑰清單中輪詢，若清單為空則直接報錯，不使用此伺服器預設/系統環境變數金鑰。", "Once enabled, the server only polls your proprietary list. If empty, it fails instead of falling back to default keys.")}
                        </p>
                      </div>
                    </label>
                  </div>

                </div>
              </div>

              {/* Section 3: User defined custom protocols manager (No more "Too Few Players" issue!) */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-1.5 font-bold text-white text-xs uppercase tracking-wider">
                  <Plus className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{t("建立您的私人播放器啟動協定 (無限擴充)", "Register Your Custom Player (Unlimited Extensions)")}</span>
                </div>
                
                {/* Form to submit and create newly defined player */}
                <form onSubmit={handleAddCustomPlayer} className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-bold block">{t("播放器簡稱*", "Player Alias*")}</label>
                      <input 
                        type="text" 
                        placeholder={t("例如: mpv-net, MXPlayerPro", "e.g., mpv-net, MXPlayer")}
                        required
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        className="w-full bg-[#0d0e12] border border-zinc-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-zinc-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-bold block">{t("副標題/特徵", "Sub-label / Feature Description")}</label>
                      <input 
                        type="text" 
                        placeholder={t("例如: 純淨硬體核心播放", "e.g., HW-accelerated engine")}
                        value={newPlayerDesc}
                        onChange={(e) => setNewPlayerDesc(e.target.value)}
                        className="w-full bg-[#0d0e12] border border-zinc-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-zinc-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                      {t("協定 URI 鏈結格式範本*", "Protocol URI Template*")} 
                      <span className="text-[9px] text-indigo-400 font-normal">({t("請參照右側說明代碼組裝", "Assemble using parameters syntax below")})</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder={t("例如: myplayer://play?url={url}&sub={sub}&title={title}", "e.g., myplayer://play?url={url}&sub={sub}&title={title}")}
                      required
                      value={newPlayerTemplate}
                      onChange={(e) => setNewPlayerTemplate(e.target.value)}
                      className="w-full bg-[#0d0e12] border border-zinc-800 rounded-lg px-2.5 py-1.5 font-mono text-zinc-300 focus:outline-none focus:border-indigo-500"
                    />
                    
                    {/* Interpolation keywords guide checklist */}
                    <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-900/60 text-[9px] text-zinc-500 space-y-1">
                      <p className="font-bold text-zinc-400">{t("可用替換參數旗擺代碼：", "Available placeholder tokens:")}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-1 font-mono">
                        <div><strong className="text-zinc-300">{"{url}"}</strong>: {t("原始 URL (帶冒號)", "Raw URL")}</div>
                        <div><strong className="text-indigo-400">{"{encodedUrl}"}</strong>: {t("轉碼 URL (帶冒號)", "Encoded URL")}</div>
                        <div><strong className="text-emerald-400">{"{urlNoColon}"}</strong>: {t("無冒號 URL (雙斜線)", "Raw URL (No Protocol Scheme)")}</div>
                        <div><strong className="text-teal-400">{"{encodedUrlNoColon}"}</strong>: {t("轉碼無冒號 URL", "Encoded URL (No Protocol Scheme)")}</div>
                        <div><strong className="text-zinc-300">{"{sub}"}</strong>: {t("原始字幕 URL", "Raw Subtitle URL")}</div>
                        <div><strong className="text-indigo-400">{"{encodedSub}"}</strong>: {t("轉碼字幕", "Encoded Subtitle URL")}</div>
                        <div><strong className="text-zinc-300">{"{title}"}</strong>: {t("標題明文", "Raw Title")}</div>
                        <div><strong className="text-indigo-400">{"{encodedTitle}"}</strong>: {t("轉碼標題", "Encoded Title")}</div>
                        <div><strong className="text-zinc-300">{"{referrer}"}</strong>: {t("來源明文", "Raw Referer")}</div>
                        <div><strong className="text-indigo-400">{"{encodedReferrer}"}</strong>: {t("轉碼來源", "Encoded Referer")}</div>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all text-xs flex items-center justify-center gap-1 cursor-pointer mt-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t("註冊此第三方播放器啟動方案", "Register This Player Protocol")}</span>
                  </button>
                </form>

                {/* Listing previously created user custom players */}
                {customPlayers.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wide block">
                      {t("已建立的自訂方案", "Registered Custom Players")} ({customPlayers.length})
                    </span>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {customPlayers.map((player) => (
                        <div 
                          key={player.id}
                          className="bg-[#0b0c10] border border-zinc-900 p-2.5 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-zinc-200">{player.name}</span>
                              {player.description && (
                                <span className="text-[9px] text-zinc-500"> — {player.description}</span>
                              )}
                            </div>
                            <code className="text-[9px] text-[#818cf8] font-mono block truncate mt-0.5" title={player.template}>
                              {player.template}
                            </code>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteCustomPlayer(player.id)}
                            className="h-7 w-7 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                            title={t("刪除此方案", "Delete this definition")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/30 flex justify-end gap-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold transition-colors cursor-pointer text-xs"
              >
                {t("儲存並關閉", "Save & Close")}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Draggable and Resizable Subtitle Floating Panel Component */}
      {showInAppFloatingSub && geminiStatus !== 'disconnected' && (
        <div
          style={{
            position: 'fixed',
            left: `${floatingSubPos.x}px`,
            top: `${floatingSubPos.y}px`,
            width: `${floatingSubPos.width}px`,
            height: `${floatingSubPos.height}px`,
            zIndex: 9999,
            resize: 'both',
            overflow: 'hidden',
          }}
          className="bg-zinc-950/90 backdrop-blur-md rounded-2xl border border-zinc-800 flex flex-col shadow-2xl transition-shadow hover:shadow-indigo-950/45 select-none pb-2 animate-in zoom-in-95 duration-150"
        >
          {/* Header Drag Handle */}
          <div
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="bg-zinc-900 border-b border-zinc-800 px-3 py-1.5 flex items-center justify-between cursor-move text-[11px] font-bold text-zinc-400 select-none shrink-0"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">📋 AI 懸浮字幕 (拖曳此欄移動 / 拖曳右下角縮放)</span>
            </div>
            
            {/* Quick configuration tools with height & width buttons */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
              {/* Font Size controls */}
              <div className="flex items-center border border-zinc-800 rounded bg-zinc-950 px-1 py-0.5 text-[9px] gap-1 font-mono">
                <span>字號:</span>
                <button
                  type="button"
                  onClick={() => setFloatingSubPos(prev => ({ ...prev, fontSize: Math.max(12, prev.fontSize - 2) }))}
                  className="px-1 text-zinc-400 hover:text-white cursor-pointer font-extrabold"
                >
                  -
                </button>
                <span className="text-white font-extrabold">{floatingSubPos.fontSize}px</span>
                <button
                  type="button"
                  onClick={() => setFloatingSubPos(prev => ({ ...prev, fontSize: Math.min(60, prev.fontSize + 2) }))}
                  className="px-1 text-zinc-400 hover:text-white cursor-pointer font-extrabold"
                >
                  +
                </button>
              </div>

              {/* Width Adjusters */}
              <div className="flex items-center border border-zinc-800 rounded bg-zinc-950 px-1 py-0.5 text-[9px] gap-1 font-mono">
                <span>寬:</span>
                <button
                  type="button"
                  onClick={() => setFloatingSubPos(prev => {
                    const newW = Math.max(140, prev.width - 40);
                    return { ...prev, width: newW, x: Math.min(prev.x, window.innerWidth - newW) };
                  })}
                  className="px-1 text-zinc-400 hover:text-white cursor-pointer font-extrabold"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setFloatingSubPos(prev => {
                    const newW = Math.min(window.innerWidth - 10, prev.width + 40);
                    return { ...prev, width: newW, x: Math.min(prev.x, window.innerWidth - newW) };
                  })}
                  className="px-1 text-zinc-400 hover:text-white cursor-pointer font-extrabold"
                >
                  +
                </button>
              </div>

              {/* Height Adjusters */}
              <div className="flex items-center border border-zinc-800 rounded bg-zinc-950 px-1 py-0.5 text-[9px] gap-1 font-mono">
                <span>高:</span>
                <button
                  type="button"
                  onClick={() => setFloatingSubPos(prev => {
                    const newH = Math.max(80, prev.height - 30);
                    return { ...prev, height: newH, y: Math.min(prev.y, window.innerHeight - newH) };
                  })}
                  className="px-1 text-zinc-400 hover:text-white cursor-pointer font-extrabold"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setFloatingSubPos(prev => {
                    const newH = Math.min(window.innerHeight - 10, prev.height + 30);
                    return { ...prev, height: newH, y: Math.min(prev.y, window.innerHeight - newH) };
                  })}
                  className="px-1 text-zinc-400 hover:text-white cursor-pointer font-extrabold"
                >
                  +
                </button>
              </div>

              {/* Close controls */}
              <button
                type="button"
                onClick={() => setShowInAppFloatingSub(false)}
                className="text-zinc-500 hover:text-red-400 p-0.5 rounded transition-all cursor-pointer shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Subtitle Body display */}
          <div 
            className="flex-1 w-full overflow-y-auto px-4.5 py-3 text-center flex items-center justify-center font-bold tracking-wide break-words select-text"
            style={{ 
              fontSize: `${floatingSubPos.fontSize}px`,
              lineHeight: '1.45',
              height: 'calc(100% - 32px)',
              color: '#ffffff',
              textShadow: '2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000, 0 1.5px 0 #000, 0 -1.5px 0 #000, 1.5px 0 0 #000, -1.5px 0 0 #000'
            }}
          >
            {(() => {
              const hasTrans = !!currentTranslatedSubtitle.trim();
              const hasOrig = !!currentOriginalSubtitle.trim();
              const isOrigTarget = hasOrig && (targetLang === "none" || isTargetLanguage(currentOriginalSubtitle, targetLang));

              if (settings.geminiOnlyTranslation) {
                let mainText = "";
                if (hasTrans) {
                  mainText = currentTranslatedSubtitle;
                } else if (isOrigTarget) {
                  mainText = currentOriginalSubtitle;
                } else {
                  mainText = subtitleHistory.length > 0 ? subtitleHistory[subtitleHistory.length - 1] : "🎤 請開始播放聲音或說話，即時 AI 字幕進行中...";
                }
                return (
                  <span className="text-emerald-400 font-extrabold">{mainText}</span>
                );
              } else {
                if (hasTrans) {
                  return (
                    <div className="flex flex-col gap-2.5 w-full">
                      {hasOrig && (
                        <p className="text-zinc-400 font-medium leading-normal tracking-wide" style={{ fontSize: `${Math.max(12, floatingSubPos.fontSize * 0.78)}px` }}>
                          {currentOriginalSubtitle}
                        </p>
                      )}
                      <p className="text-emerald-400 font-extrabold leading-normal tracking-wide">
                        {currentTranslatedSubtitle}
                      </p>
                    </div>
                  );
                } else if (isOrigTarget) {
                  return (
                    <p className="text-emerald-400 font-extrabold leading-normal tracking-wide">
                      {currentOriginalSubtitle}
                    </p>
                  );
                } else {
                  const fallback = subtitleHistory.length > 0 ? subtitleHistory[subtitleHistory.length - 1] : t("🎤 請開始播放聲音或說話，即時 AI 字幕進行中...", "🎤 Please play audio or start speaking, real-time AI captioning active...");
                  return (
                    <p className="text-emerald-400 font-extrabold leading-normal tracking-wide">
                      {fallback}
                    </p>
                  );
                }
              }
            })()}
          </div>

          {/* Bottom-right Resizing hint */}
          <div 
            className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-transparent pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(135deg, transparent 70%, #52525b 70%, #52525b 85%, transparent 85%, transparent 90%, #52525b 90%)',
              backgroundSize: '6px 6px'
            }}
          />
        </div>
      )}

    </div>
  );
}

// Custom Protocol Cards Helper component
function ProtocolCard({ 
  name, 
  description, 
  protocol, 
  onCopy, 
  isCopied,
  bgColor,
  btnColor,
  actionLabel = "傳送",
  activeFeatures,
  isPinned = false,
  onTogglePin,
  download,
  t
}: { 
  name: string; 
  description: string; 
  protocol: string; 
  onCopy: (text: string) => void;
  isCopied: boolean;
  bgColor?: string;
  btnColor?: string;
  actionLabel?: string;
  activeFeatures?: {
    sub?: boolean;
    referrer?: boolean;
    title?: boolean;
  };
  isPinned?: boolean;
  onTogglePin?: () => void;
  download?: boolean;
  t: (zh: string, en: string) => string;
}) {
  return (
    <div className={`p-3 rounded-2xl bg-[#0e0f13] border ${isPinned ? 'border-amber-500/30 shadow-md shadow-amber-500/5 bg-amber-950/5' : 'border-zinc-900'} ${bgColor} flex justify-between items-center transition-all duration-300`}>
      <div className="truncate pr-2">
        <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
          {name}
          {isPinned && <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded scale-90 border border-amber-500/20">{t("已釘選", "Pinned")}</span>}
        </span>
        <span className="text-[10px] text-zinc-500 block truncate mt-0.5">{description}</span>
        {activeFeatures && (activeFeatures.sub || activeFeatures.referrer || activeFeatures.title) && (
          <div className="flex flex-wrap gap-1 mt-1.5 pointer-events-none select-none">
            {activeFeatures.title && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 font-black uppercase tracking-wider">
                📝 {t("標題已啟動", "Title Active")}
              </span>
            )}
            {activeFeatures.sub && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-black uppercase tracking-wider">
                💬 {t("字幕已掛載", "Subs Mounted")}
              </span>
            )}
            {activeFeatures.referrer && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/25 font-black uppercase tracking-wider">
                🔗 Referer
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={onTogglePin}
          className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
            isPinned 
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-400 hover:bg-amber-900/60' 
              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
          }`}
          title={isPinned ? t("取消釘選播放器", "Unpin Player") : t("釘選播放器到最頂部", "Pin Player to Top")}
        >
          <Pin className={`h-3 w-3 ${isPinned ? 'fill-amber-400/30' : ''}`} />
        </button>
        <button
          onClick={() => onCopy(protocol)}
          className={`h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 hover:text-white transition-all cursor-pointer`}
          title={t("複製通訊協定連結", "Copy protocol link")}
        >
          {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-400" />}
        </button>
        <a
          href={protocol}
          download={download ? "" : undefined}
          target={download ? "_blank" : undefined}
          rel={download ? "noopener noreferrer" : undefined}
          className={`h-7 px-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-extrabold flex items-center justify-center transition-all hover:bg-zinc-800 hover:text-white ${btnColor}`}
        >
          {download ? <Download className="h-2.5 w-2.5 mr-1" /> : <ExternalLink className="h-2.5 w-2.5 mr-1" />}
          {actionLabel}
        </a>
      </div>
    </div>
  );
}

// Artplayer React Hook Bridge component with responsive UI and platform gestures orientation features
function ArtPlayerComponent({ 
  url, 
  title, 
  subs,
  referrer,
  settings,
  targetLang,
  onVideoReady,
  geminiSubtitle,
  geminiOriginalSubtitle,
  geminiTranslatedSubtitle,
  isGeminiListening
}: { 
  url: string; 
  title: string; 
  subs: string[];
  referrer?: string;
  settings: AppSettings;
  targetLang: string;
  onVideoReady?: (video: HTMLVideoElement) => void;
  geminiSubtitle?: string;
  geminiOriginalSubtitle?: string;
  geminiTranslatedSubtitle?: string;
  isGeminiListening?: boolean;
}) {
  const artRef = useRef<HTMLDivElement>(null);
  const hudRightRef = useRef<HTMLDivElement | null>(null);
  const hudCenterRef = useRef<HTMLDivElement | null>(null);
  const hudTimerRight = useRef<any>(null);
  const hudTimerCenter = useRef<any>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  // References to the internal Gemini subtitle layer elements to push dynamic text updates instantly
  const geminiSubOriginalContainerRef = useRef<HTMLDivElement | null>(null);
  const geminiSubTranslatedContainerRef = useRef<HTMLDivElement | null>(null);

  // Synchronize Gemini subtitle prop changes directly into the player's custom element layer
  useEffect(() => {
    const origContainer = geminiSubOriginalContainerRef.current;
    const transContainer = geminiSubTranslatedContainerRef.current;
    if (!origContainer || !transContainer) return;

    if (isGeminiListening) {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const pSize = settings.geminiSubtitleSize || 24;
      const primaryFontSize = isMobileDevice ? `${Math.max(14, pSize * 0.75)}px` : `${pSize}px`;
      const secondaryFontSize = isMobileDevice ? `${Math.max(11, pSize * 0.6)}px` : `${Math.floor(pSize * 0.78)}px`;

      const textShadowStyle = `text-shadow: 2.5px 2.5px 0 #000, -2.5px 2.5px 0 #000, 2.5px -2.5px 0 #000, -2.5px -2.5px 0 #000, 0 2.5px 0 #000, 0 -2.5px 0 #000, 2.5px 0 0 #000, -2.5px 0 0 #000, 0 4px 10px rgba(0,0,0,0.85);`;

      if (targetLang === "none") {
        // Transcription-only mode: render at the bottom
        origContainer.style.display = 'none';

        const fallbackVal = geminiOriginalSubtitle || geminiSubtitle || "";
        if (fallbackVal.trim()) {
          transContainer.innerHTML = `<p style="color: #34d399; margin: 0; padding: 0; font-weight: 950; font-size: ${primaryFontSize}; line-height: 1.45; letter-spacing: 0.05em; word-wrap: break-word; font-family: sans-serif; ${textShadowStyle}">${fallbackVal}</p>`;
          transContainer.style.display = 'block';
        } else {
          transContainer.style.display = 'none';
        }
      } else {
        // Translation mode:
        const transVal = geminiTranslatedSubtitle || "";
        const origVal = geminiOriginalSubtitle || "";

        if (!transVal.trim()) {
          // If there is no translation text:
          if (origVal.trim() && isTargetLanguage(origVal, targetLang)) {
            // Since the spoken original text is already in the target language (e.g. Chinese -> Chinese),
            // we display it directly as the primary line under the transContainer
            origContainer.style.display = 'none';
            transContainer.innerHTML = `<p style="color: #34d399; margin: 0; padding: 0; font-weight: 950; font-size: ${primaryFontSize}; line-height: 1.45; letter-spacing: 0.05em; word-wrap: break-word; font-family: sans-serif; ${textShadowStyle}">${origVal}</p>`;
            transContainer.style.display = 'block';
          } else {
            // "在沒有翻譯時，寧可不顯示字幕，也不要顯示原文" -> Hide both if transVal is empty and it's not the target language
            origContainer.style.display = 'none';
            transContainer.style.display = 'none';
          }
        } else {
          // We have translation:
          if (origVal.trim() && !settings.geminiOnlyTranslation) {
            origContainer.innerHTML = `<p style="color: #a1a1aa; margin: 0; padding: 0; font-weight: 700; font-size: ${secondaryFontSize}; line-height: 1.35; letter-spacing: 0.05em; word-wrap: break-word; font-family: sans-serif; ${textShadowStyle}">${origVal}</p>`;
            origContainer.style.display = 'block';
          } else {
            origContainer.style.display = 'none';
          }

          transContainer.innerHTML = `<p style="color: #34d399; margin: 0; padding: 0; font-weight: 950; font-size: ${primaryFontSize}; line-height: 1.45; letter-spacing: 0.05em; word-wrap: break-word; font-family: sans-serif; ${textShadowStyle}">${transVal}</p>`;
          transContainer.style.display = 'block';
        }
      }
    } else {
      origContainer.style.display = 'none';
      transContainer.style.display = 'none';
    }
  }, [geminiSubtitle, geminiOriginalSubtitle, geminiTranslatedSubtitle, isGeminiListening, settings.geminiOnlyTranslation, settings.geminiSubtitleSize, targetLang]);

  const showHud = (text: string, isRight: boolean = false) => {
    const el = isRight ? hudRightRef.current : hudCenterRef.current;
    const timerRef = isRight ? hudTimerRight : hudTimerCenter;
    
    if (!el) return;
    el.innerText = text;
    el.style.opacity = '1';
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (el) el.style.opacity = '0';
    }, 1500);
  };

  useEffect(() => {
    setErrorInfo(null);
  }, [url]);

  useEffect(() => {
    if (!artRef.current || !url || !url.trim()) return;

    const baseStyle = `
      position: absolute;
      background: transparent;
      color: white;
      padding: 4px 10px;
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 4px #000;
    `;

    // Inject ArtPlayer Notice Styles with requested transparent design & text shadow
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .art-notice {
        background: transparent !important;
        background-color: transparent !important;
        box-shadow: none !important;
        border: none !important;
        color: white !important;
        text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 4px #000 !important;
        font-weight: 900 !important;
        font-size: 12px !important;
      }
      .art-notice-inner {
        background: transparent !important;
      }
      .art-subtitle {
        background: transparent !important;
        background-color: transparent !important;
        box-shadow: none !important;
        border: none !important;
        bottom: 30px !important;
        pointer-events: none !important;
      }
      .art-subtitle, .art-subtitle * {
        background: transparent !important;
        background-color: transparent !important;
        box-shadow: none !important;
        border: none !important;
        color: #ffffff !important;
        font-weight: 900 !important;
        text-shadow: 2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000 !important;
      }
    `;
    document.head.appendChild(styleEl);

    const hudRight = document.createElement('div');
    hudRight.style.cssText = baseStyle + 'top: 20px; right: 20px; font-size: 12px;';
    hudRightRef.current = hudRight;

    const hudCenter = document.createElement('div');
    hudCenter.style.cssText = baseStyle + 'top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 18px;';
    hudCenterRef.current = hudCenter;

    let rotationMode: 'landscape' | 'portrait' | 'auto' = 'auto';

    const art = new (Artplayer as any)({
      container: artRef.current,
      url: url,
      volume: 0.5,
      autoplay: settings.autoplay,
      pip: true,
      setting: true,
      loop: false,
      flip: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      customType: {
        m3u8: function (video: HTMLVideoElement, m3u8Url: string, artInstance: any) {
          if (Hls.isSupported()) {
            if (artInstance.hls) artInstance.hls.destroy();
            const hls = new Hls();
            hls.loadSource(m3u8Url);
            hls.attachMedia(video);
            artInstance.hls = hls;
            artInstance.on('destroy', () => {
              if (artInstance.hls) {
                artInstance.hls.destroy();
                artInstance.hls = null;
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = m3u8Url;
          } else {
            console.error('HLS is not supported in this browser');
          }
        }
      },
      moreVideoAttr: {
        ...(settings.webPlayerCrossOrigin ? { crossOrigin: 'anonymous' } : {}),
        // Set referrerpolicy dynamically
        referrerPolicy: referrer ? 'no-referrer' : 'no-referrer-when-downgrade',
      },
      contextmenu: isMobile ? [{ html: '關閉選單' }] : [],
      subtitle: {
        url: subs.length > 0 ? subs[0] : '',
        type: subs.length > 0 ? (subs[0].split('.').pop()?.split('?')[0] || 'srt').toLowerCase() : 'srt',
        style: {
          color: '#ffffff',
          fontSize: isMobile ? '16px' : `${settings.webPlayerSubtitleSize}px`,
          fontWeight: 'bold',
          textShadow: '1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000',
        },
        encoding: 'utf-8',
      },
      playbackRate: true,
      playbackRateList: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4],
      settings: [
        {
          html: '字幕選擇',
          width: 250,
          tooltip: subs.length > 0 ? `自訂字幕已載入 (${subs.length}個)` : '無字幕',
          selector: subs.length > 0 ? subs.map((s, idx) => ({
            default: idx === 0,
            html: `字幕軌 ${idx + 1}`,
            url: s,
          })) : [
            {
              default: true,
              html: '無字幕',
              url: '',
            }
          ],
          onSelect: function(item: any) {
            art.subtitle.switch(item.url, {
              name: item.html,
            });
            return item.html;
          },
        },
      ],
      // Custom single circular rotation controller
      controls: [
        {
          position: 'right',
          name: 'rotation-toggle',
          html: '<span class="rotation-btn-text" style="font-size: 10px; padding: 0 4px; font-weight: 700;">旋轉: 自動</span>',
          click: function() {
            const orientation = screen.orientation as any;
            if (rotationMode === 'auto') {
              rotationMode = 'landscape';
            } else if (rotationMode === 'landscape') {
              rotationMode = 'portrait';
            } else {
              rotationMode = 'auto';
            }

            const modeText = rotationMode === 'auto' ? '自動' : rotationMode === 'landscape' ? '橫屏' : '豎屏';
            art.notice.show = `旋轉模式: ${modeText}`;

            const btn = document.querySelector('.rotation-btn-text');
            if (btn) (btn as HTMLElement).innerText = `旋轉: ${modeText}`;

            // Try to immediately apply rotation lock (works in fullscreen mode)
            if (orientation) {
              if (rotationMode === 'landscape' && orientation.lock) {
                orientation.lock('landscape').catch(() => {});
              } else if (rotationMode === 'portrait' && orientation.lock) {
                orientation.lock('portrait').catch(() => {});
              } else if (orientation.unlock) {
                orientation.unlock();
              }
            }
          },
        },
      ],
    });

    // Add HUD Layers on Mobile
    if (isMobile) {
      art.layers.add({ name: 'hud-right', html: hudRight });
      art.layers.add({ name: 'hud-center', html: hudCenter });
    }

    // Build Gemini Original (top) subtitle layer
    const geminiSubOriginalContainer = document.createElement('div');
    geminiSubOriginalContainer.id = 'art-gemini-sub-original-container';
    geminiSubOriginalContainer.style.cssText = 'position: absolute; top: 15px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 768px; text-align: center; pointer-events: none; z-index: 35; display: none; margin-top: 12px;';
    geminiSubOriginalContainerRef.current = geminiSubOriginalContainer;

    art.layers.add({
      name: 'gemini-subtitle-original',
      html: geminiSubOriginalContainer
    });

    // Build Gemini Translated (bottom) subtitle layer
    const geminiSubTranslatedContainer = document.createElement('div');
    geminiSubTranslatedContainer.id = 'art-gemini-sub-translated-container';
    geminiSubTranslatedContainer.style.cssText = 'position: absolute; bottom: 55px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 768px; text-align: center; pointer-events: none; z-index: 35; display: none; margin-bottom: 12px;';
    geminiSubTranslatedContainerRef.current = geminiSubTranslatedContainer;

    art.layers.add({
      name: 'gemini-subtitle-translated',
      html: geminiSubTranslatedContainer
    });

    // Gesture control handler variables
    let touchStartX = 0;
    let touchStartY = 0;
    let startVolume = 0.5;
    let startBrightness = 1;
    let startTime = 0;
    let longPressTimer: any;
    let isLongPress = false;
    let isDragging = false;
    let gestureType: 'none' | 'vertical' | 'horizontal' = 'none';
    let singleTapTimer: any;
    let lastTapTime = 0;
    let gestureOverlay: HTMLDivElement | null = null;
    let handleTouchStart: any, handleTouchMove: any, handleTouchEnd: any;

    if (isMobile) {
      // Setup touch gesture overlay
      gestureOverlay = document.createElement('div');
      gestureOverlay.style.cssText = 'position:absolute;inset:0;background:transparent;z-index:5;touch-action:none;';
      art.layers.add({
        name: 'gesture-handler',
        html: gestureOverlay,
      });

      handleTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        const rect = gestureOverlay!.getBoundingClientRect();
        const yPercent = (touch.clientY - rect.top) / rect.height;

        // Skip gesture processing if touch is inside the bottom control bar area (bottom 15%)
        if (yPercent > 0.85) {
          return;
        }

        e.preventDefault();
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        startVolume = art.volume;
        startTime = art.currentTime;
        const bMatch = art.video.style.filter.match(/brightness\(([^)]+)\)/);
        startBrightness = bMatch ? parseFloat(bMatch[1]) : 1;
        isDragging = false;
        isLongPress = false;
        gestureType = 'none';

        longPressTimer = setTimeout(() => {
          if (!isDragging) {
            isLongPress = true;
            art.playbackRate = 2.0;
          }
        }, 500);
      };

      handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const rect = gestureOverlay!.getBoundingClientRect();

        if (!isLongPress && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
          clearTimeout(longPressTimer);
          isDragging = true;
          
          if (gestureType === 'none') {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              gestureType = 'horizontal';
            } else {
              gestureType = 'vertical';
            }
          }
        }

        if (isLongPress) {
          e.preventDefault();
          return;
        }

        if (isDragging) {
          e.preventDefault();
          if (gestureType === 'horizontal') {
            const seekPercent = deltaX / rect.width;
            const seekTime = Math.min(Math.max(startTime + (art.duration * seekPercent * 0.5), 0), art.duration);
            art.seek = seekTime;
          } else if (gestureType === 'vertical') {
            const percent = -deltaY / (rect.height * 0.7);
            if (touchStartX < rect.left + rect.width / 2) {
              const newB = Math.min(Math.max(startBrightness + percent, 0.2), 1.5);
              art.video.style.filter = `brightness(${newB})`;
              showHud(`亮度: ${Math.round(newB * 100)}%`, true);
            } else {
              const newV = Math.min(Math.max(startVolume + percent, 0), 1);
              art.volume = newV;
            }
          }
        }
      };

      handleTouchEnd = () => {
        clearTimeout(longPressTimer);

        if (isLongPress) {
          art.playbackRate = 1.0;
          isLongPress = false;
          return;
        }

        if (isDragging) {
          isDragging = false;
          gestureType = 'none';
          return;
        }

        const now = Date.now();
        const rect = gestureOverlay!.getBoundingClientRect();
        const xPercent = (touchStartX - rect.left) / rect.width;

        if (now - lastTapTime < 300) {
          // Double Tap logic
          clearTimeout(singleTapTimer);
          if (xPercent < 0.3) {
            art.backward = 10;
          } else if (xPercent > 0.7) {
            art.forward = 10;
          } else {
            art.toggle();
          }
          lastTapTime = 0;
        } else {
          lastTapTime = now;
          // Single Tap logic
          singleTapTimer = setTimeout(() => {
            if (Date.now() - lastTapTime >= 300) {
               if (art.controls.show) {
                 art.controls.show = false;
               } else {
                 art.controls.show = true;
               }
            }
          }, 300);
        }
      };

      gestureOverlay!.addEventListener('touchstart', handleTouchStart, { passive: false });
      gestureOverlay!.addEventListener('touchmove', handleTouchMove, { passive: false });
      gestureOverlay!.addEventListener('touchend', handleTouchEnd);
    }

    art.on('ready', () => {
      if (isMobile) {
        art.fullscreen = true;
      }
      art.video.style.filter = 'brightness(1)';
      if (onVideoReady) {
        onVideoReady(art.video);
      }
    });

    art.on('subtitle:update', (text: string) => {
      const subEl = art.template.$subtitle;
      if (subEl) {
        const clean = (text || '').trim();
        if (clean.includes('翻譯') || clean.includes('Translation') || clean.includes('字幕組') || clean.includes('出品')) {
          subEl.style.cssText += 'display: none !important; opacity: 0 !important; visibility: hidden !important;';
        } else {
          subEl.style.cssText = subEl.style.cssText.replace(/display:\s*none[^;]*/gi, '')
                                                    .replace(/opacity:\s*0[^;]*/gi, '')
                                                    .replace(/visibility:\s*hidden[^;]*/gi, '');
        }
      }
    });

    const handleVideoError = () => {
      let diagnosis = "⚠️ 無法載入串流影片。該影音資源目前不可用、或目標伺服器未開啟，或回應逾時。";
      
      const isHttps = window.location.protocol === 'https:';
      if (isHttps && url.startsWith('http://')) {
        diagnosis = "⚠️ 瀏覽器混合內容(HTTPS/HTTP)安全限制：您目前在安全的 HTTPS 預覽網頁中，嘗試加載不安全且不加密的 http:// 影音連結。瀏覽器安全防禦系統會強制封鎖此類載入。解決方案：(1) 改用安全的 https:// 連結；(2) 直接使用下方「外部播放器啟動協定」(如 PotPlayer/VLC Player/IINA 等) 一鍵起播，本地點播不具任何網頁安全沙盒限制！";
      } else if (settings.webPlayerCrossOrigin) {
        diagnosis = "⚠️ 網頁播放器 CORS 跨域存取被阻擋：您目前在「進階偏好設定」中啟用了「CORS 跨域屬性」，但此影片伺服器未回傳符合規定的 Access-Control-Allow-Origin 跨域許可標頭。建議：請點擊右上角『進階偏好設定』，將【網頁播放器啟用 CORS 跨域屬性】選項「關閉」並重試，或直接使用下方一鍵啟動本地專業播放器播放！";
      } else {
        const fileExt = url.split('.').pop()?.split('?')[0]?.toLowerCase();
        if (fileExt && ['mkv', 'avi', 'flv', 'rmvb', 'wmv'].includes(fileExt)) {
          diagnosis = `⚠️ 網頁瀏覽器編解碼不支援 (.${fileExt.toUpperCase()} 格式)：一般網頁瀏覽器原生僅支持播放 MP4 和 WebM，並不具備解碼 .${fileExt.toUpperCase()} 影音檔案的能力。這是網頁瀏覽器本身的技術邊界，非程式錯誤。建議：直接點擊下方「VLC Player」或「PotPlayer」或「IINA/Infuse」一鍵發送至本機專業播放器，即可流暢完美播放！`;
        } else {
          diagnosis = "⚠️ 影片加載超時或已被防盜鏈封鎖：此影音主機可能限制了非官方站點的 Referer (跨域防盜鏈)，或連結本身已過期。建議：您可以開啟右上角「進階偏好設定」確認【CORS】功能已關閉，或者直接選擇下方高品質外部播放器協定 (PotPlayer/VLC/IINA) 起播，本地點播將能完美繞過瀏覽器限制！";
        }
      }
      setErrorInfo(diagnosis);
    };

    art.video.addEventListener('error', handleVideoError);

    art.on('fullscreen', (state: boolean) => {
      const orientation = screen.orientation as any;
      if (!orientation) return;

      if (state) {
        // Fullscreen lock behaviors based on active rotating states
        if (rotationMode === 'landscape') {
          orientation.lock('landscape').catch(() => {});
        } else if (rotationMode === 'portrait') {
          orientation.lock('portrait').catch(() => {});
        } else if (rotationMode === 'auto') {
          if (art.video.videoWidth > art.video.videoHeight) {
            orientation.lock('landscape').catch(() => {});
          }
        }
      } else {
        if (rotationMode === 'auto' && orientation.unlock) {
          orientation.unlock();
        }
      }
    });

    return () => {
      if (document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }
      if (art && art.destroy) {
        art.destroy(false);
      }
      if (gestureOverlay) {
        gestureOverlay.removeEventListener('touchstart', handleTouchStart);
        gestureOverlay.removeEventListener('touchmove', handleTouchMove);
        gestureOverlay.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [url, title, subs, referrer, settings]);

  return (
    <div className="relative w-full h-full" id="artplayer-root">
      <div ref={artRef} className="w-full h-full" id="artplayer-container" />
      {errorInfo && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center text-zinc-300 animate-in fade-in duration-200">
          <div className="max-w-md space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">內置網頁播放器加載失敗</h4>
              <p className="text-[10px] text-zinc-500 mt-1 truncate max-w-[340px] mx-auto" title={url}>
                來源：<code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-400 font-mono text-[9px]">{url}</code>
              </p>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/60 text-left">
              {errorInfo}
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => {
                  setErrorInfo(null);
                  if (artRef.current) {
                    const videoNode = artRef.current.querySelector('video');
                    if (videoNode) {
                      videoNode.load();
                    }
                  }
                }}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[10px] font-extrabold text-white transition-colors cursor-pointer"
              >
                重試加載
              </button>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-[10px] font-extrabold text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
              >
                直接開啟連結
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
