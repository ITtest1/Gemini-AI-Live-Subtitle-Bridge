# mpv-parser (Gemini Live Audio Bridge & Media Launcher)

A specialized multimedia tool for real-time AI subtitle translation and protocol-based media launching.

---

## 🚀 Free Deployment on Hugging Face / 免費部署指南

You can easily host this project for free on Hugging Face Spaces. / 您可以輕鬆在 Hugging Face Spaces 免費部署本專案。

### Steps / 步驟:
1. **Duplicate Space:** Go to the [Demo Link](https://huggingface.co/spaces/hl001x/Gemini-AI-Live-Subtitle-Bridge) and click the **"..."** (Options) button -> **"Duplicate this Space"**. / 前往 [Demo 頁面](https://huggingface.co/spaces/hl001x/Gemini-AI-Live-Subtitle-Bridge)，點擊右上角 **"..."** -> **"Duplicate this Space"**。
2. **Setup Secrets:** After duplicating, go to **Settings** -> **Variables and secrets** and add your `GEMINI_API_KEY`. / 複製完成後，前往 **Settings** -> **Variables and secrets** 新增您的 `GEMINI_API_KEY`。
3. **Note on Sleeping:** Hugging Face Spaces will automatically put your Space to "sleep" after 48 hours of inactivity. Just manually click "Restart this Space" in the Settings tab to wake it up. / **注意**：Hugging Face 免費空間若 48 小時無人使用會進入休眠。只需在 Settings 點擊 "Restart this Space" 即可喚醒。

### Direct Access Address / 直接訪問地址
To get the independent URL for your client, convert your space URL: / 若要取得客戶端連線用的獨立網址，請依照以下格式轉換：
- **Space URL:** `https://huggingface.co/spaces/USERNAME/SPACE_NAME`
- **Direct URL:** `https://USERNAME-SPACE_NAME.hf.space`
*Enter this URL into your client's "Advanced Preferences" to connect. / 將此 URL 填入您客戶端的 "Advanced Preferences" 即可連線。*

---

## 🚀 Key Features / 核心功能

### 1. Real-time AI Captioning (Gemini Live Audio Bridge) / AI 即時字幕與翻譯
*   **Audio Capture:** Captures audio from system output or microphone (Windows/Linux/macOS). / 擷取系統輸出或麥克風音訊。
*   **Gemini Live Integration:** Real-time transcription & translation via Gemini Live API. / 透過 Gemini Live API 進行即時轉錄與翻譯。
*   **Privacy Note:** Google's free Gemini API tier may use input data for model improvement. To ensure data privacy, users are advised to use a paid Gemini API plan. / 使用免費版 Gemini API 時，Google 可能會使用輸入資料來改善模型。為確保資料隱私，建議使用者自行申請並購買付費版 Gemini API。
*   **Flexible UI:** In-app floating subtitles, PiP mode, and multiple display styles. / 支援網頁內浮動字幕、PiP 子母畫面、多種顯示模式。
*   **Robust Backend:** Automatic reconnection, refusal interception, and multi-key rotation. / 具備自動重連、安全過濾、多金鑰輪詢機制。

### 2. Powerful Media Protocol Launcher / 強大影音啟動器
*   **Universal Link Parsing:** Supports complex URL lists with protocol (mpv, potplayer, vlc) and parameter parsing. / 強大的 URL 列表解析，支援各類播放器協定與參數。
*   **Playlist Chaining (`?play=`):** Chain multiple video sources using the `play` URL parameter, separated by `|@@`. / 使用 `play` 參數串聯多個影片來源，以 `|@@` 分隔。
*   **Custom Protocol Engine:** Generates custom launcher commands with automatic placeholder pruning (Title, Referrer, Subs). / 自訂協定模板引擎，支援自動填入並清理 Title, Referrer, Subs 等參數。
*   **Multi-Player Support:** Integrations for PotPlayer, VLC, MPV, IINA, Infuse, MX Player, etc. / 內建多款主流播放器連結範本。

---

## 🌐 Live Demo / 在線體驗
You can experience the web-based demo via Hugging Face Spaces (please configure your own API key). / 您可以透過 Hugging Face Spaces 體驗網頁版 Demo (需自行填入 API Key):
[Gemini-AI-Live-Subtitle-Bridge Live Demo](https://hl001x-gemini-ai-live-subtitle-bridge.hf.space)

---

## 🔑 Gemini API Key Configuration / API Key 設定方式
This project provides three flexible API key configuration methods, ordered by priority (higher priority overrides lower priority). / 本專案提供三種靈活的 API Key 設定方式，優先級由高到低（若高優先級設定則忽略低優先級）：

1. **Client UI Menu (Highest Priority / 最高優先級):** Configure in "Advanced Preferences" within the Python script or packaged app right-click menu, and check "Force use client API key" to force override `.env` or web settings. / 在 Python 腳本或打包版程式右鍵選單的 "Advanced Preferences" 中填寫，並勾選 "Force use client API key"，即可強制覆蓋 `.env` 或網頁端設定。
2. **Web UI Settings (Web 端設定):** Configure in the web interface settings page, suitable when you prefer not to use `.env` keys. / 在網頁端設定頁面填寫，適用於不想使用 `.env` 金鑰時。
3. **Environment Variable (`.env` / 環境變數):** Configure in the server-side `.env` file; supports multiple keys separated by commas (`,`) for rotation. / 在伺服器端 `.env` 檔案填寫，支援多個 API Key (以逗號 `,` 分隔)，系統會自動輪詢。

---

## 🛠️ Usage Guide / 使用說明

For detailed installation, configuration, and troubleshooting, please refer to the specific user guides provided in the `docs` folder:

若需詳細的安裝、設定與排錯資訊，請參閱 `docs` 資料夾中的使用指南：

- **`docs/user_guide_en.md`**: Comprehensive English user guide. / 詳盡的英文使用指南。
- **`docs/user_guide_zh.md`**: 詳盡的中文使用指南。

**When to read these? / 何時閱讀？**
- **Before setup:** To ensure all system dependencies are met. / **安裝前：** 確保滿足所有系統相依性。
- **Troubleshooting:** If you encounter runtime errors or configuration issues. / **排錯時：** 若遇到執行錯誤或設定問題。
- **Advanced Usage:** For customizing settings beyond the basics. / **進階用法：** 若需進行超出基礎設定的客製化。

---

## 📦 Packaged App Guide / 打包版使用說明

如果您不想手動配置 Python 環境，**強烈建議 Windows 使用者使用打包好的執行檔 (.exe)**，它已經內建了所有依賴，直接執行即可。 / If you prefer not to configure the Python environment manually, **it is highly recommended for Windows users to use the packaged executable (.exe)**, as it includes all necessary dependencies.

### 1. Windows Installation (Raw Script) / Windows 手動安裝 (原始腳本)
If you prefer running the script, use the `install.bat` to setup a virtual environment: / 若您偏好執行原始腳本，請使用 `install.bat` 來設定虛擬環境：
- **Usage:** Navigate to the `/client` folder and **double-click `install.bat`**. It will create a `venv` folder and install all dependencies there. / **使用說明**：進入 `/client` 資料夾並**雙擊 `install.bat`**。它會自動建立一個 `venv` 資料夾並在其中安裝所有依賴。

### 2. Troubleshooting / 遇到問題
若打包版程式運行異常，請依照以下步驟排查：
- **Run Raw Script for Debugging:** If the packaged version fails, please use the original Python script (`gemini_audio_bridge.py`) and run it via terminal/command prompt (`python gemini_audio_bridge.py`). This will output logs directly to the console, helping you identify the exact cause of the failure. / 若打包版程式無法運作，請改用原始 Python 腳本直接在終端機執行，您將能看到完整的錯誤日誌，有助於找出問題根源。

---

## 📂 Client-Side Scripts / 客戶端腳本

These scripts are located in the `/client` directory and facilitate interaction with the bridge and media players. / 這些腳本位於 `/client` 目錄下，用於協助與橋接器及播放器進行互動。

| Script / 腳本 | Platform / 平台 | Purpose / 用途 | Usage / 使用說明 |
| :--- | :--- | :--- | :--- |
| **`gemini_audio_bridge.py`** | Universal / 通用 | Core AI Bridge. / 核心 AI 橋接器。 | Run via venv / 透過虛擬環境執行 |
| **`gemini_toggle_win.lua`** | Windows MPV | MPV plugin for Windows. / Windows 版 MPV 插件。 | Place in `%APPDATA%\mpv\scripts\` |
| **`gemini_toggle.lua`** | Linux MPV | MPV plugin for Linux. / Linux 版 MPV 插件。 | Place in `~/.config/mpv/scripts/` |
| **`run_bridge.sh`** | Linux/macOS | Convenience script. / 方便啟動橋接器的腳本。 | `chmod +x run_bridge.sh && ./run_bridge.sh` |
| **`install.bat`** | Windows | Install dependencies in `venv`. / 在 `venv` 中安裝依賴。 | Double-click to run / 雙擊執行 |

---

### AI Subtitle Translation / AI 字幕設定
1. **API Key Setup:** Obtain your key from [Google AI Studio](https://aistudio.google.com/). Configure in `.env` (server-side) or the client's "Advanced Preferences" (UI).
2. **Launch:** Start the backend server and the Python client.

### Media Launcher & Chaining (`?play=`) / 播放器啟動與串聯
Use the `?play=` parameter in the browser URL to load a playlist directly.

#### Syntax / 語法
`your-app-url/?play=[Protocol]://[URL] --title="[Title]" --sub="[SubtitleURL1]" --sub="[SubtitleURL2]" --referrer="[ReferrerURL]"|@@...`

#### Usage Examples / 使用範例
*   **Multi-Subtitle Support / 支援載入多個字幕檔:**
    You can pass multiple `--sub="..."` flags to load more than one subtitle track / 您可以傳遞多個 `--sub` 參數以載入多個字幕軌道:
    `your-app-url/?play=mpv://video.mp4 --title="Movie Title" --sub="https://example.com/sub1.srt" --sub="https://example.com/sub2.srt"`
*   **Playlist Chaining / 串聯播放清單:**
    `your-app-url/?play=mpv://url1 --title="Title1"|@@mpv://url2 --title="Title2"`

---
## 💰 Support & Donation / 支持開發者
*If you find this project helpful, you are welcome to support the author through the following ways.
若此工具對您有所幫助，歡迎透過 USDT-TRC20 支持專案的持續維護：
* **USDT-TRC20 Address:** `THtQ6hhdJnfR7sNDnsuP7FdEzKN8TVRcNH`
        *   💡 *提示 / Tip*: 如果可以的話，寄給我 USDT 時也順便寄給我一些 TRX。
        *   💡 *Tip*: If possible, please also send some TRX when sending USDT.
*(Note: Ensure you are using the correct network when transferring / 轉帳前請務必確認地址與網路)*
