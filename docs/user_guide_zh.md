# 🎙️ Gemini Live 實時語音字幕翻譯工具 —— 跨平台使用指南

本指南將說明如何在 **Windows**、**macOS** 與 **Linux** 平台上安裝、設定並運行 `gemini_audio_bridge.py` 實時雙語字幕工具。

---

## 📌 系統需求與共用依賴
* **Python 版本**：Python 3.8 或以上。
* **後端伺服器**：需開啟配合此腳本的 WebSocket 轉接伺服器（預設為 `ws://localhost:8081/api/gemini/live`）。

---

## 1. 🏁 Windows 平台使用指南

Windows 平台使用 Python 的 `sounddevice` 庫，配合微軟官方的 **WASAPI Loopback** 技術，能以無損、極低延遲的方式直接獲取系統播放的聲音。

### 步驟 A：安裝 Python 依賴套件
開啟 Windows 命令提示字元 (`cmd`) 或 PowerShell，進入您的專案目錄或虛擬環境，執行以下命令：
```bash
pip install PyQt6 websockets sounddevice numpy certifi
```

### 步驟 B：設定系統聲音擷取來源
腳本啟動時，會自動在 **WASAPI** 下尋找含有 `Loopback` 的音訊設備。
* **如果抓取不到聲音（終端機出現警告）**：
  1. **啟用「立體聲混音」**：
     * 按下 `Win + R` 輸入 `control mmsys.cpl,,recording` 開啟聲音錄製設定。
     * 在空白處點擊滑鼠右鍵，勾選「顯示已停用的裝置」。
     * 對著「立體聲混音 (Stereo Mix)」點擊右鍵，選擇「啟用」，並設為預設裝置。
  2. **安裝虛擬音軌（推薦）**：
     * 若硬體不支援立體聲混音，請安裝免費的 [VB-AUDIO Virtual Cable](https://vb-audio.com/Cable/)。
     * 安裝後，將 Windows 系統的聲音輸出設備設為 `CABLE Input`，腳本即會自動選取並擷取系統聲音。

### 步驟 C：啟動腳本
```bash
python gemini_audio_bridge.py
```

---

## 2. 🍎 macOS 平台使用指南

macOS 由於 Apple 系統安全限制，無法直接從作業系統核心錄製輸出端音訊。因此，**必須安裝虛擬音訊裝置**來傳遞聲音。

### 步驟 A：安裝 Python 依賴套件
開啟 macOS 終端機 (`Terminal`)，執行以下命令：
```bash
pip install PyQt6 websockets sounddevice numpy
```

### 步驟 B：安裝與設定虛擬音訊裝置（BlackHole）
1. **安裝免費開源的 BlackHole**：
   * 開啟終端機，使用 Homebrew 安裝：
     ```bash
     brew install blackhole-2ch
     ```
   * *（若無 Homebrew，可至 [Existential Audio 官網](https://github.com/ExistentialAudio/BlackHole) 下載安裝檔）*。
2. **建立「多輸出裝置」（讓您在聽得到聲音的同時也能錄音）**：
   * 在 Mac 上搜尋並開啟「**音訊 MIDI 設定**」應用程式。
   * 點擊左下角的 `+` 號，選擇「**建立多輸出裝置**」。
   * 在右側面板中，同時勾選您平時使用的喇叭（如 `MacBook Pro 揚聲器` 或 `耳機`）以及 `BlackHole 2ch`。
   * 將「主要裝置」設為您的實體揚聲器，並啟用「漂移修正」。
3. **切換系統輸出**：
   * 點擊 Mac 頂部選單列的「聲音」圖示，將輸出裝置切換為剛剛建立的「**多輸出裝置**」。
   * 如此一來，電腦播放的音訊會同時傳送到您的耳機（供您聆聽）與 BlackHole（供腳本錄製）。

### 步驟 C：啟動腳本
```bash
python3 gemini_audio_bridge.py
```

---

## 3. 🐧 Linux 平台使用指南

Linux 平台預設使用 PulseAudio (或相容的 PipeWire) 的 `pactl` 與 `parec` 命令進行無失真系統監聽擷取，設定最為直覺簡單。

### 步驟 A：安裝系統工具與 Python 依賴
在 Ubuntu / Debian 系統下，執行以下命令：
```bash
# 1. 更新套件清單並安裝 Python 虛擬環境、系統音訊庫、PulseAudio 工具以及 PyQt6 所需的 X11/XCB 圖形庫
sudo apt update
sudo apt install -y python3-venv libportaudio2 pulseaudio-utils \
  libxcb-cursor0 libxcb-xinerama0 libxcb-icccm4 libxcb-image0 \
  libxcb-keysyms1 libxcb-randr0 libxcb-render-util0 libxcb-shape0 \
  libxcb-shm0 libxcb-sync1 libxcb-util1 libxcb-xfixes0 libxkbcommon-x11-0

# 2. 安裝 Python 依賴包
pip install PyQt6 websockets
```

### 步驟 B：確認 PulseAudio 服務運作
大部分桌面版發行版均已預設啟用。腳本會自動執行 `pactl list sources short` 來偵測以 `.monitor` 結尾的系統輸出監聽裝置，不需額外手動設定。

### 步驟 C：啟動腳本
```bash
python3 gemini_audio_bridge.py
```

---

## 🛠️ 字幕視窗互動與右鍵選單功能說明

執行腳本後，畫面上會出現半透明置頂字幕。您可以使用滑鼠或右鍵選單進行以下設定：

| 互動動作 | 功能說明 |
| :--- | :--- |
| **滑鼠左鍵拖曳** | 自由移動字幕視窗在螢幕上的位置。 |
| **滑鼠滾輪** | 向上捲動放大字型，向下捲動縮小字型。 |
| **右鍵選單 -> 字幕顯示模式** | 選擇「單行僅翻譯」、「單行智慧顯示（同語系顯示原文）」或「雙行顯示（原文+翻譯）」。 |
| **右鍵選單 -> 翻譯目標語言** | 變更翻譯目標語系，提供繁中、英文、日文、韓文或僅轉錄不翻譯。 |
| **右鍵選單 -> 調整寬度/高度/字體** | 快速設定視窗大小，或自訂精確數值。 |
| **右鍵選單 -> Gemini API 金鑰設定** | 在本地端直接設定或切換 Gemini API Key，可輸入多組（以逗號分隔）以分流流量。 |
| **右鍵選單 -> 後端連線位址設定** | **(新功能)** 免重啟直接修改 WebSocket URL（如修改伺服器 Port 或對接遠端主機）。 |
| **右鍵選單 -> 介面與日誌語言** | 切換視窗介面與終端機 Log 為繁體中文或英文。 |

---

## 🔍 疑難排解 (Troubleshooting)

### Q1：連線中斷出現 `connection closed` 或 `ConnectionRefusedError`？
* 請確認您的後端橋接伺服器已正常啟動並在該 Port（預設 `8081`）進行監聽。
* 如果伺服器部署在其他主機，請在右鍵選單的「後端連線位址設定」輸入正確的 `ws://<伺服器IP>:<Port>/api/gemini/live`。

### Q2：字幕視窗啟動了，但播放影片時沒有顯示任何字幕？
* 請檢查終端機 Log。如果出現 `[⚠️] 未找到 Loopback 或 Stereo Mix 裝置`，代表它正在用麥克風錄音。請確認是否已正確設定 **Windows 的立體聲混音** 或 **macOS 的 BlackHole 多輸出裝置**。
* 開啟瀏覽器或音樂播放器，確認有聲音在播放。
