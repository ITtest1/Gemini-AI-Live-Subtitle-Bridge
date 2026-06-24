# mpv-parser (Gemini Live Audio Bridge & Media Launcher)

A specialized multimedia tool for real-time AI subtitle translation and protocol-based media launching.

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

## 📋 System Pre-requisites / 系統準備需求

Before running the Python script or using the packaged executable, ensure your system meets these requirements / 在啟動 Python 腳本或執行打包版程式前，請確保系統滿足以下需求：

### 1. For Packaged Executables / 針對打包版執行檔
*   **Windows:**
    - Enable **Stereo Mix** / 啟用「**立體聲混音**」: `Control Panel (控制台) -> Sound (聲音) -> Recording (錄製) -> Right-click to Enable Stereo Mix`.
    - Alternatively, install a virtual audio driver like [VB-CABLE](https://vb-audio.com/Cable/) for reliable system-wide loopback capture. / 或安裝虛擬音訊驅動程式（如 VB-CABLE）以獲得最穩定的系統音訊擷取。
*   **Linux (Ubuntu/Debian):**
    - Install necessary system-level audio and UI dependencies / 安裝系統層級音訊與 UI 依賴套件:
      ```bash
      sudo apt-get update && sudo apt-get install -y libportaudio2 libxcb-xinerama0 libxcb-icccm4 libxcb-image0 libxcb-keysyms1 libxcb-randr0 libxcb-render-util0 libxcb-shape0 libxkbcommon-x11-0
      ```
    - Ensure `parec` and `pactl` (PulseAudio/PipeWire-pulse tools) are installed. / 確保系統已安裝 `parec` 與 `pactl` 工具。
    - Give execution permissions to the binary / 賦予執行檔運行權限: `chmod +x gemini_subtitle_linux`
*   **macOS:**
    - macOS does not natively support system loopback audio. You **must** install a virtual driver / macOS 不支援原生系統音訊擷取，您**必須**安裝虛擬驅動程式:
      ```bash
      brew install blackhole-2ch
      ```
    - Configure BlackHole as your system output in "System Settings -> Sound -> Output". / 在「系統設定 -> 聲音 -> 輸出」中選擇 BlackHole。

### 2. For Running the Raw Python Script (`gemini_audio_bridge.py`) / 針對執行原始 Python 腳本
*   Python 3.8 or above installed on your machine. / 電腦需安裝 Python 3.8 或以上版本。
*   Install python requirements / 安裝 Python 套件依賴:
    ```bash
    pip install websockets numpy sounddevice PyQt6
    ```
*   Follow the audio device setup instructions above depending on your OS. / 根據您的作業系統，遵循上方對應的音訊裝置設定。

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

## 📦 Packaged App Guide / 打包版使用說明

如果您使用的是已打包的執行檔 (Packaged Executable)：

### 1. Configuration (No Recompilation Needed) / 設定與參數調整
- **`config.json`:** 應用程式啟動後會產生此檔案。您可以直接用文字編輯器開啟它，修改 `GEMINI_API_KEY`、`TARGET_LANGUAGE`、字體大小等參數。修改後重新啟動程式即可生效。

### 2. Troubleshooting / 遇到問題
若打包版程式運行異常，請依照以下步驟排查：
- **Run Raw Script for Debugging:** If the packaged version fails, please use the original Python script (`gemini_audio_bridge.py`) and run it via terminal/command prompt (`python gemini_audio_bridge.py`). This will output logs directly to the console, helping you identify the exact cause of the failure. / 若打包版程式無法運作，請改用原始 Python 腳本直接在終端機執行，您將能看到完整的錯誤日誌，有助於找出問題根源。

---

## 💰 Support & Donation / 支持開發者

若此工具對您有所幫助，歡迎透過 USDT-TRC20 支持專案的持續維護：
* **USDT-TRC20 Address:** `THtQ6hhdJnfR7sNDnsuP7FdEzKN8TVRcNH`

*(Note: Ensure you are using the correct network when transferring / 轉帳前請務必確認地址與網路)*
