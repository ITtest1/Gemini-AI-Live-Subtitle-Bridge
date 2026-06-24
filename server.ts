import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Create HTTP server to share between Express and WebSocket Server
  const server = http.createServer(app);

  // Initialize WebSocket server on the same HTTP server
  const wss = new WebSocketServer({ server, path: "/api/gemini/live" });
  
  // Initialize Gemini client (server-side)
  // Set User-Agent as required: 'aistudio-build'
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // REST endpoints for health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", hasApiKey: !!process.env.GEMINI_API_KEY });
  });

  let globalKeyIndex = 0;

  function checkSafetyRefusal(...texts: (string | undefined)[]): boolean {
    for (const text of texts) {
      if (!text) continue;
      const lower = text.toLowerCase();
      if (
        lower.includes("language model") ||
        lower.includes("can't help") ||
        lower.includes("cant help") ||
        lower.includes("cannot help")
      ) {
        return true;
      }
    }
    return false;
  }

  // Handle WebSocket connections
  wss.on("connection", async (ws) => {
    console.log("Client connected to Gemini Live WebSocket proxy");
    let geminiSession: any = null;
    let audioChunkCount = 0;
    let audioQueue: string[] = [];

    // Session-specific context state
    let lastSetupPayload: any = null;
    let isExplicitlyClosed = false;
    let isRefreshing = false;

    async function connectSession() {
      if (!lastSetupPayload) return;
      const { targetLang, customApiKeys = [], restrictToCustomKeys = false } = lastSetupPayload;

      console.log(`[Proxy] Connecting to Gemini Live Session (targetLang=${targetLang})...`);

      // Determine model name
      const modelName = "gemini-3.5-live-translate-preview";
      const actualModality = targetLang === "none" ? Modality.TEXT : Modality.AUDIO;

      // Construct instructions
      let systemInstruction = "You are an automated real-time subtitle captioning and translation assistant.";
      if (targetLang === "none") {
        systemInstruction += " Transcribe the spoken audio in its original language accurately in real-time. Output only the plain transcription text, do not prefix, do not chatter, do not repeat yourself, do not converse.";
      } else {
        systemInstruction += ` Translate the spoken audio directly and instantly into beautiful ${targetLang} language in real-time. Output only the translation text. Try to make the captions flow naturally, keeping them brief, accurate, and highly readable. Do not repeat anything else.`;
      }

      const liveConfig: any = {
        responseModalities: [actualModality], // Optimize response modalities based on transcription vs translation needs
        systemInstruction,
        inputAudioTranscription: {}, 
        outputAudioTranscription: {}, 
      };

      if (targetLang !== "none" && modelName === "gemini-3.5-live-translate-preview") {
        let langCode = "zh";

        const SERVER_LANGUAGES = [
          { code: "zh", name: "Traditional Chinese" },
          { code: "zh-CN", name: "Simplified Chinese" },
          { code: "en", name: "English" },
          { code: "ja", name: "Japanese" },
          { code: "ko", name: "Korean" },
          { code: "es", name: "Spanish" },
          { code: "fr", name: "French" },
          { code: "de", name: "German" },
          { code: "it", name: "Italian" },
          { code: "ru", name: "Russian" },
          { code: "pt", name: "Portuguese" },
          { code: "vi", name: "Vietnamese" },
          { code: "th", name: "Thai" },
          { code: "id", name: "Indonesian" },
          { code: "ar", name: "Arabic" },
          { code: "hi", name: "Hindi" },
          { code: "tr", name: "Turkish" },
          { code: "pl", name: "Polish" },
          { code: "nl", name: "Dutch" },
          { code: "sv", name: "Swedish" },
          { code: "da", name: "Danish" },
          { code: "fi", name: "Finnish" },
          { code: "no", name: "Norwegian" },
          { code: "ms", name: "Malay" },
          { code: "uk", name: "Ukrainian" },
          { code: "fil", name: "Filipino" },
          { code: "ro", name: "Romanian" },
          { code: "hu", name: "Hungarian" },
          { code: "cs", name: "Czech" },
          { code: "sk", name: "Slovak" },
          { code: "el", name: "Greek" },
          { code: "he", name: "Hebrew" },
          { code: "fa", name: "Persian" },
          { code: "bn", name: "Bengali" },
          { code: "pa", name: "Punjabi" },
          { code: "gu", name: "Gujarati" },
          { code: "ta", name: "Tamil" },
          { code: "te", name: "Telugu" },
          { code: "kn", name: "Kannada" },
          { code: "ml", name: "Malayalam" },
          { code: "hr", name: "Croatian" },
          { code: "sr", name: "Serbian" },
          { code: "bg", name: "Bulgarian" },
          { code: "lt", name: "Lithuanian" },
          { code: "lv", name: "Latvian" },
          { code: "et", name: "Estonian" },
          { code: "sl", name: "Slovenian" },
          { code: "ga", name: "Irish" },
          { code: "cy", name: "Welsh" },
          { code: "is", name: "Icelandic" },
          { code: "af", name: "Afrikaans" },
          { code: "sw", name: "Swahili" }
        ];

        const match = SERVER_LANGUAGES.find(
          (l) => l.name.toLowerCase() === targetLang.toLowerCase() || l.code.toLowerCase() === targetLang.toLowerCase()
        );
        if (match) {
          langCode = match.code;
        }

        liveConfig.translationConfig = {
          targetLanguageCode: langCode,
          echoTargetLanguage: false
        };
      }

      // 1. Resolve API keys for round-robin rotation
      let rawCustomKeys: string[] = [];
      if (customApiKeys) {
        if (Array.isArray(customApiKeys)) {
          customApiKeys.forEach((k: any) => {
            if (typeof k === "string") {
              k.split(",").map(item => item.trim()).filter(Boolean).forEach(splitted => {
                rawCustomKeys.push(splitted);
              });
            }
          });
        } else if (typeof customApiKeys === "string") {
          rawCustomKeys = customApiKeys.split(",").map(k => k.trim()).filter(Boolean);
        }
      }

      // Read all environment key configurations
      const envKeysSet = new Set<string>();
      if (process.env.GEMINI_API_KEYS) {
        process.env.GEMINI_API_KEYS.split(",").map(k => k.trim()).filter(Boolean).forEach(k => envKeysSet.add(k));
      }
      if (process.env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY.split(",").map(k => k.trim()).filter(Boolean).forEach(k => envKeysSet.add(k));
      }
      for (const envVar of Object.keys(process.env)) {
        if (envVar.startsWith("GEMINI_API_KEY_")) {
          const val = process.env[envVar];
          if (val) {
            val.split(",").map(k => k.trim()).filter(Boolean).forEach(k => envKeysSet.add(k));
          }
        }
      }
      const envKeys = Array.from(envKeysSet);

      let activeKeys: string[] = [];
      if (restrictToCustomKeys && rawCustomKeys.length > 0) {
        console.log(`[Proxy] Client requested 'restrictToCustomKeys'. Ignoring server-side .env keys. Using client-provided keys: ${rawCustomKeys.length} total.`);
        activeKeys = rawCustomKeys;
      } else {
        if (rawCustomKeys.length > 0) {
          activeKeys = [...rawCustomKeys, ...envKeys];
        } else {
          activeKeys = envKeys;
        }
      }

      if (activeKeys.length === 0) {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ 
            type: "error", 
            error: "伺服器與網頁端均未配置任何有效的 Gemini API Key，請點擊「進階偏好設定」填寫 API 密鑰。" 
          }));
        }
        return;
      }

      // 2. Select index and rotate round-robin
      const keyToUse = activeKeys[globalKeyIndex % activeKeys.length];
      globalKeyIndex = (globalKeyIndex + 1) % activeKeys.length;

      const maskedKey = keyToUse.length > 10 
        ? `${keyToUse.substring(0, 6)}...${keyToUse.substring(keyToUse.length - 4)}` 
        : "***";
      console.log(`[Rotation] Assigned API index #${globalKeyIndex - 1} (${maskedKey}) to Live translation engine.`);

      // 3. Initialize fresh per-session client instance
      const sessionAi = new GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      try {
        geminiSession = await sessionAi.live.connect({
          model: modelName,
          config: liveConfig,
          callbacks: {
            onmessage: async (liveMessage: any) => {
              try {
                const getField = (obj: any, camelKey: string, snakeKey: string) => {
                  if (!obj) return undefined;
                  return obj[camelKey] !== undefined ? obj[camelKey] : obj[snakeKey];
                };

                const sc = getField(liveMessage, 'serverContent', 'server_content');
                const setupComp = getField(liveMessage, 'setupComplete', 'setup_complete');

                let inputTrans = undefined;
                let outputTrans = undefined;
                let modelPartsArr: any[] = [];

                if (sc) {
                  const it = getField(sc, 'inputTranscription', 'input_transcription');
                  if (it) {
                    inputTrans = getField(it, 'text', 'text');
                  }
                  const ot = getField(sc, 'outputTranscription', 'output_transcription');
                  if (ot) {
                    outputTrans = getField(ot, 'text', 'text');
                  }
                  const mt = getField(sc, 'modelTurn', 'model_turn');
                  if (mt) {
                    const parts = getField(mt, 'parts', 'parts');
                    if (Array.isArray(parts)) {
                      modelPartsArr = parts.map((p: any) => getField(p, 'text', 'text')).filter((x: any) => x !== undefined && x !== null);
                    }
                  }
                }

                const modelTextVal = modelPartsArr.join("");

                // [Safety Interceptor] Monitor input, output and model generated fields for refusal markers
                if (checkSafetyRefusal(inputTrans, outputTrans, modelTextVal)) {
                  console.log("[Safety Intercept] Security refusal markers found in transcript or output. Intercepting package...");
                  
                  if (!isRefreshing) {
                    isRefreshing = true;

                    // Sever current session 
                    if (geminiSession) {
                      try {
                        geminiSession.close();
                      } catch (_) {}
                    }

                    // Feed back refreshing status to client to avoid UI rendering gaps
                    if (ws.readyState === ws.OPEN) {
                      ws.send(JSON.stringify({
                        type: "status",
                        status: "refreshing",
                        reason: "safety_refusal",
                        description: "偵測到安全限制拒絕回覆，後台正在 0.5 秒內強制啟動全新 Session 自動恢復..."
                      }));
                    }

                    // Force Refresh in 500ms
                    setTimeout(async () => {
                      try {
                        isRefreshing = false;
                        await connectSession();
                      } catch (recErr) {
                        console.error("[Safety Intercept] Re-creation error:", recErr);
                      }
                    }, 500);
                  }
                  return; // TRUNCATE EXPLICITLY: Do NOT bubble this refusal packet to client!
                }

                // If session is ready and we have buffer backlog, flush it
                if (audioQueue.length > 0 && geminiSession && !isRefreshing) {
                  const backlogCount = audioQueue.length;
                  console.log(`[Backlog] Flushing ${backlogCount} buffered chunks to new session...`);
                  for (const cached of audioQueue) {
                    try {
                      await geminiSession.sendRealtimeInput({
                        audio: {
                          data: cached,
                          mimeType: "audio/pcm;rate=16000"
                        }
                      });
                    } catch (_) {}
                  }
                  audioQueue = [];
                }

                if (ws.readyState === ws.OPEN) {
                  ws.send(JSON.stringify({
                    type: "gemini_message",
                    data: {
                      setupComplete: setupComp,
                      inputTranscriptionText: inputTrans || "",
                      outputTranscriptionText: modelTextVal || outputTrans || "",
                      modelText: modelTextVal,
                      raw: liveMessage
                    }
                  }));
                }
              } catch (err) {
                console.error("Error packaging live message:", err);
                if (ws.readyState === ws.OPEN) {
                  ws.send(JSON.stringify({
                    type: "gemini_message",
                    data: { raw: liveMessage }
                  }));
                }
              }
            },
            onclose: () => {
              console.log("Gemini Live session closed");
              
              // Handle 10-minute timeout connection drop
              if (ws.readyState === ws.OPEN && !isExplicitlyClosed && !isRefreshing) {
                console.log("[Auto-Reconnect] 10-minute connection cap or unexpected close hit. Seamlessly reconnecting...");
                isRefreshing = true;

                ws.send(JSON.stringify({
                  type: "status",
                  status: "refreshing",
                  reason: "timeout",
                  description: "連線滿 10 分鐘，後端系統正在為您辦理 Auto-Reconnect 無縫自動重連中..."
                }));

                setTimeout(async () => {
                  try {
                    isRefreshing = false;
                    await connectSession();
                  } catch (conErr) {
                    console.error("[Auto-Reconnect] Session re-creation failed:", conErr);
                  }
                }, 500);
              } else {
                if (ws.readyState === ws.OPEN && !isRefreshing) {
                  ws.send(JSON.stringify({ type: "status", status: "closed", message: "Gemini session ended." }));
                }
              }
            },
            onerror: (err: any) => {
              console.error("Gemini Live error callback:", err);
              // Fail the reconnecting state if appropriate, feed through error
              if (ws.readyState === ws.OPEN && !isRefreshing) {
                ws.send(JSON.stringify({ type: "error", error: err.message || String(err) }));
              }
            }
          }
        });

        console.log("Gemini Live API connection established successfully!");
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "status", status: "ready" }));
        }
      } catch (connErr: any) {
        console.error("Failed to connect to Gemini Live session:", connErr);
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "error", error: `Failed to initiate Gemini Live: ${connErr.message || connErr}` }));
        }
      }
    }

    ws.on("message", async (message) => {
      try {
        const payload = JSON.parse(message.toString());

        // 1. Connection setup request
        if (payload.type === "setup") {
          lastSetupPayload = payload;
          isExplicitlyClosed = false;
          isRefreshing = false;
          audioQueue = []; // Clear current buffer
          await connectSession();
        }

        // 2. Audio input data chunk
        if (payload.type === "audio") {
          audioChunkCount++;
          if (audioChunkCount <= 5 || audioChunkCount % 100 === 0) {
            console.log(`Audio chunk count: ${audioChunkCount}, active Gemini session: ${!!geminiSession}, refreshing state: ${isRefreshing}, data length: ${payload.data?.length || 0}`);
          }

          if (geminiSession && !isRefreshing) {
            try {
              await geminiSession.sendRealtimeInput({
                audio: {
                  data: payload.data,
                  mimeType: "audio/pcm;rate=16000"
                }
              });
            } catch (audioErr: any) {
              console.error(`Failed to send audio chunk to Gemini Session at chunk #${audioChunkCount}:`, audioErr?.message || audioErr);
            }
          } else {
            // Buffer raw Base64 audio PCM during refreshing/connecting phase up to 10 seconds of speech
            if (isRefreshing || !geminiSession) {
              if (audioQueue.length < 40 && payload.data) {
                audioQueue.push(payload.data);
              }
            }
          }
        }
      } catch (err: any) {
        console.error("Error processing websocket payload:", err);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected from WebSocket proxy");
      isExplicitlyClosed = true;
      if (geminiSession) {
        try {
          geminiSession.close();
        } catch (_) {}
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
