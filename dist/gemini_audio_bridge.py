#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import asyncio
import websockets
import json
import base64
import subprocess
import threading
import sys
import signal
import os
import re
import platform
import urllib.request
import ssl  # 新增：用於處理 SSL 憑證略過

from PyQt6.QtWidgets import QApplication, QLabel, QMenu, QInputDialog, QDialog, QVBoxLayout, QHBoxLayout, QPushButton, QMessageBox
from PyQt6.QtCore import Qt, pyqtSignal, QObject, QPoint, QRect, QTimer
from PyQt6.QtGui import QFont, QColor, QPainter, QPen, QPixmap

# ================= 0. 跨平台偵測 =================
CURRENT_OS = platform.system()  # "Linux", "Windows", "Darwin"

def get_os_display_name():
    """回傳人類可讀的作業系統名稱"""
    names = {"Linux": "Linux", "Windows": "Windows", "Darwin": "macOS"}
    return names.get(CURRENT_OS, CURRENT_OS)

# ================= 1. 商業級：外部配置檔案讀取與儲存機制 =================
CONFIG_FILE = "config.json"

# 預設的配置參數
DEFAULT_CONFIG = {
    "APP_WS_URL": "ws://localhost:8081/api/gemini/live",
    "TARGET_LANGUAGE": "English",
    "WINDOW_WIDTH": 1200,       # 字幕視窗預設寬度
    "WINDOW_HEIGHT": 120,       # 字幕視窗預設高度
    "INIT_FONT_SIZE": 26,       # 初始字幕字體大小
    "BOTTOM_OFFSET": 220,       # 距離螢幕底部多高
    "DISPLAY_MODE": "translation_only", # "translation_only" (無閃現純翻譯) / "translation_smart" (智慧顯示) / "dual" (雙行)
    "AUTO_CLEAR_MS": 4000,       # 字幕自動消失時間（毫秒），設為 0 可停用此功能
    "GEMINI_API_KEY": "",        # 本地端自訂 Gemini API Key (可使用逗號分隔多個 Key)
    "FORCE_CLIENT_KEY": False,    # 是否強制使用此本地金鑰（無視伺服器設定）
    "MENU_LANGUAGE": "English" # 介面與日誌語言: Traditional Chinese / English
}

# 如果檔案不存在，自動幫用戶建立一個
if not os.path.exists(CONFIG_FILE):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_CONFIG, f, indent=4, ensure_ascii=False)
    except:
        pass

# 讀取設定檔
try:
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        config = json.load(f)
except:
    config = DEFAULT_CONFIG

# 語系翻譯字典
LOCALES = {
    "Traditional Chinese": {
        "menu_mode": "⚙️ 字幕顯示模式",
        "menu_lang": "🌐 翻譯目標語言",
        "menu_width": "📏 調整視窗寬度",
        "menu_height": "↕️ 調整視窗高度",
        "menu_font": "🔤 調整字體大小",
        "menu_key": "🔑 Gemini API 金鑰設定",
        "menu_ws_url": "🔌 後端連線位址設定",
        "menu_ui_lang": "🌍 介面與日誌語言",
        "menu_support": "💖 支持與贊助開發者",
        "menu_exit": "❌ 關閉字幕翻譯程式",
        "dialog_width_title": "自訂視窗寬度",
        "dialog_width_label": "請輸入寬度 (px):",
        "dialog_height_title": "自訂視窗高度",
        "dialog_height_label": "請輸入高度 (px):",
        "dialog_font_title": "自訂字體大小",
        "dialog_font_label": "請輸入字體大小 (px):",
        "dialog_key_title": "設定 Gemini API 金鑰",
        "dialog_key_label": "請輸入您的 Gemini API 密鑰 (若有多個可以用逗號分隔):",
        "dialog_ws_url_title": "設定後端連線位址",
        "dialog_ws_url_label": "請輸入後端 WebSocket 位址 (WS URL):",
        "placeholder_disconnected": "[ ❌ 未連線 ]",
        "placeholder_connecting": "[ 🔄 正在與 AI 建立安全字幕連線... ]",
        "placeholder_connected": "[ 🎉 連線成功！請開始播放語音... ]",
        "placeholder_error": "[ ❌ 發生錯誤 ]",
        "placeholder_reconnect": "[ ⚠️ 連線異常中斷，5秒後自動重新連線... ]",
        "log_detect_os": "[🖥️] 偵測到作業系統",
        "log_connecting": "[📡] 正在嘗試建立 WebSocket 字幕管道...",
        "log_connected": "[✅] 已成功連線至後端伺服器！",
        "log_disconnect": "[❌] 管道斷開: {e}，5 秒後自動重連...",
        "log_exit": "\n[🛑] 正在關閉程式...",
        "support_title": "支持與贊助開發者",
        "support_desc": "感謝您的支持！這將推動播放器功能持續更新與改進。轉帳地址如下（USDT-TRC20 協議）:",
        "support_note": "提示：本專案完全開源免費。如果您覺得好用，歡迎打賞支持以維持後續服務的開發與伺服器維護！",
        "close": "關閉",
        "copied": "已複製",
        "prompt_ui_lang": "請選擇介面語言",
        "mode_only": "顯示單行：僅翻譯文 (完全無原文閃現)",
        "mode_smart": "顯示單行：智慧翻譯 (同語系顯示原文)",
        "mode_dual": "顯示雙行：原文 + 翻譯文",
        "lang_none": "無 (僅轉錄，不翻譯)",
        "key_title": "📝 設定本地端 API 金鑰"
    },
    "English": {
        "menu_mode": "⚙️ Subtitle Mode",
        "menu_lang": "🌐 Target Language",
        "menu_width": "📏 Window Width",
        "menu_height": "↕️ Window Height",
        "menu_font": "🔤 Font Size",
        "menu_key": "🔑 Gemini API Key Settings",
        "menu_ws_url": "🔌 WebSocket URL Settings",
        "menu_ui_lang": "🌍 Interface Language",
        "menu_support": "💖 Support Developer",
        "menu_exit": "❌ Close Caption application",
        "dialog_width_title": "Custom Width",
        "dialog_width_label": "Enter width (px):",
        "dialog_height_title": "Custom Height",
        "dialog_height_label": "Enter height (px):",
        "dialog_font_title": "Custom Font Size",
        "dialog_font_label": "Enter font size (px):",
        "dialog_key_title": "Set Gemini API Key",
        "dialog_key_label": "Enter your Gemini API Key (comma-separated):",
        "dialog_ws_url_title": "Set WebSocket URL",
        "dialog_ws_url_label": "Enter WebSocket URL (WS URL):",
        "placeholder_disconnected": "[ ❌ Disconnected ]",
        "placeholder_connecting": "[ 🔄 Connecting with AI Subtitle Server... ]",
        "placeholder_connected": "[ 🎉 Connected! Please play audio or speak... ]",
        "placeholder_error": "[ ❌ Error Occurred ]",
        "placeholder_reconnect": "[ ⚠️ Disconnected, reconnecting in 5 seconds... ]",
        "log_detect_os": "[🖥️] Detected OS",
        "log_connecting": "[📡] Attempting to establish WebSocket subtitle channel...",
        "log_connected": "[✅] Successfully connected to backend server!",
        "log_disconnect": "[❌] Connection lost: {e}, reconnecting in 5s...",
        "log_exit": "\n[🛑] Closing program...",
        "support_title": "Support Developer",
        "support_desc": "Thank you for your support! It drives ongoing development. USDT-TRC20 Address:",
        "support_note": "Note: This is open-source. Donations maintain free services, development, and hosting.",
        "close": "Close",
        "copied": "Copied",
        "prompt_ui_lang": "Select UI Language",
        "mode_only": "Single line: Translation only (No original flash)",
        "mode_smart": "Single line: Smart Translation (Original if same language)",
        "mode_dual": "Dual line: Original + Translation",
        "lang_none": "None (Transcription Only, no translation)",
        "key_title": "📝 Configure Local API Key"
    }
}

def t_py(key):
    lang = config.get("MENU_LANGUAGE", "Traditional Chinese")
    if lang not in LOCALES:
        lang = "Traditional Chinese"
    return LOCALES[lang].get(key, key)

print(f"{t_py('log_detect_os')}: {get_os_display_name()} ({CURRENT_OS})")

# 判斷文字是否符合目標語言（用於智慧單行模式下防止外語原文閃現）
def is_target_language(text, lang_code):
    if not text:
        return False
    lang_lower = lang_code.lower()
    
    # 常見語言字元偵測 regex
    has_hanzi = bool(re.search(r'[\u4e00-\u9fa5]', text))
    has_kana = bool(re.search(r'[\u3040-\u309f\u30a0-\u30ff]', text))
    has_hangul = bool(re.search(r'[\uac00-\ud7a3]', text))
    
    if "chinese" in lang_lower or lang_lower == "zh":
        # 中文：必須包含漢字，且不能含有日文假名
        return has_hanzi and not has_kana
    if "japanese" in lang_lower or lang_lower == "ja":
        # 日文：必須含有日文假名
        return has_kana
    if "korean" in lang_lower or lang_lower == "ko":
        # 韓文：必須含有韓文字母
        return has_hangul
        
    # For other non-CJK languages (English, Spanish, French, German, Italian, etc.),
    # we default to verifying the text does not contain CJK (Chinese, Japanese, Korean) characters.
    return not has_hanzi and not has_kana and not has_hangul

# 如果檔案不存在，自動幫用戶建立一個
if not os.path.exists(CONFIG_FILE):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(DEFAULT_CONFIG, f, indent=4, ensure_ascii=False)

# 讀取設定檔
try:
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        config = json.load(f)
except:
    config = DEFAULT_CONFIG

# 將讀取到的參數 assign 給全域變數
APP_WS_URL = config.get("APP_WS_URL", DEFAULT_CONFIG["APP_WS_URL"])
TARGET_LANGUAGE = config.get("TARGET_LANGUAGE", DEFAULT_CONFIG["TARGET_LANGUAGE"])
WINDOW_WIDTH = int(config.get("WINDOW_WIDTH", DEFAULT_CONFIG["WINDOW_WIDTH"]))
WINDOW_HEIGHT = int(config.get("WINDOW_HEIGHT", DEFAULT_CONFIG["WINDOW_HEIGHT"]))
INIT_FONT_SIZE = int(config.get("INIT_FONT_SIZE", DEFAULT_CONFIG["INIT_FONT_SIZE"]))
BOTTOM_OFFSET = int(config.get("BOTTOM_OFFSET", DEFAULT_CONFIG["BOTTOM_OFFSET"]))
DISPLAY_MODE = config.get("DISPLAY_MODE", DEFAULT_CONFIG["DISPLAY_MODE"])
AUTO_CLEAR_MS = int(config.get("AUTO_CLEAR_MS", DEFAULT_CONFIG["AUTO_CLEAR_MS"]))
GEMINI_API_KEY = config.get("GEMINI_API_KEY", DEFAULT_CONFIG["GEMINI_API_KEY"])
FORCE_CLIENT_KEY = bool(config.get("FORCE_CLIENT_KEY", DEFAULT_CONFIG["FORCE_CLIENT_KEY"]))
MENU_LANGUAGE = config.get("MENU_LANGUAGE", DEFAULT_CONFIG["MENU_LANGUAGE"])

audio_proc = None
sub_win = None
active_ws = None
main_loop = None

class SignalBridge(QObject):
    text_received = pyqtSignal(str)
    subtitle_received = pyqtSignal(str, str) # 元組傳遞: (原文, 翻譯文)

# ================= 1.5 跨平台音訊擷取抽象層 =================

class AudioCaptureBase:
    """音訊擷取基底類別 — 定義統一介面"""
    SAMPLE_RATE = 16000
    CHANNELS = 1
    CHUNK_SIZE = 16000  # 每次讀取的 bytes 數量 (0.5 秒的音訊)

    def start(self):
        raise NotImplementedError
    
    def read_chunk(self):
        """讀取一個音訊區塊，回傳 bytes (PCM s16le)，若無資料回傳 b''"""
        raise NotImplementedError
    
    def stop(self):
        raise NotImplementedError

    def is_alive(self):
        return True


class LinuxAudioCapture(AudioCaptureBase):
    """Linux 平台：使用 PulseAudio 的 pactl + parec 擷取系統音訊"""

    def __init__(self):
        self.proc = None
    
    def start(self):
        # 自動偵測 PulseAudio monitor source
        monitor = None
        try:
            res = subprocess.check_output(["pactl", "list", "sources", "short"]).decode()
            for line in res.splitlines():
                if ".monitor" in line: 
                    monitor = line.split()[1]
                    break
        except Exception as e:
            print(f"[⚠️] 無法列舉 PulseAudio 來源: {e}")

        cmd = ["parec", "--format=s16le", "--channels=1", "--rate=16000", "--latency-msec=50"]
        if monitor:
            cmd.extend(["-d", monitor])
        
        print(f"[🎙️] Linux 音訊擷取啟動: {' '.join(cmd)}")
        self.proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=0)
    
    def read_chunk(self):
        if self.proc and self.proc.poll() is None:
            return self.proc.stdout.read(self.CHUNK_SIZE)
        return b''
    
    def stop(self):
        if self.proc:
            try:
                self.proc.terminate()
                self.proc.wait(timeout=2)
            except:
                try:
                    self.proc.kill()
                except:
                    pass
            self.proc = None
    
    def is_alive(self):
        return self.proc is not None and self.proc.poll() is None


class WindowsAudioCapture(AudioCaptureBase):
    """Windows 平台：使用 sounddevice + WASAPI loopback 擷取系統音訊"""

    def __init__(self):
        self._running = False
        self._buffer = None

    def start(self):
        try:
            import sounddevice as sd
            import numpy as np
        except ImportError:
            print("[❌] 缺少必要套件！請執行：pip install sounddevice numpy")
            print("    Windows 也需要安裝 VB-CABLE 或使用 WASAPI loopback 裝置。")
            raise

        import queue
        self._buffer = queue.Queue(maxsize=200)
        self._running = True
        self._sd = sd
        self._np = np

        # 找到 WASAPI loopback 裝置（Windows 系統迴路音訊）
        loopback_device = None
        try:
            # 優先搜尋 Windows WASAPI Host API，因為 loopback 只存在於 WASAPI 下
            wasapi_idx = None
            for idx, api in enumerate(sd.query_hostapis()):
                if api['name'] == 'Windows WASAPI':
                    wasapi_idx = idx
                    break

            devices = sd.query_devices()
            
            # 1. 優先尋找 WASAPI 底下的 loopback 裝置
            for i, dev in enumerate(devices):
                if wasapi_idx is not None and dev['hostapi'] != wasapi_idx:
                    continue
                dev_name = dev['name'].lower()
                if 'loopback' in dev_name and dev['max_input_channels'] > 0:
                    loopback_device = i
                    print(f"[🎙️] 找到 WASAPI Loopback 裝置: {dev['name']} (index={i})")
                    break

            # 2. 若沒有 WASAPI loopback，尋找其他 host API 下的「立體聲混音」(Stereo Mix)
            if loopback_device is None:
                for i, dev in enumerate(devices):
                    dev_name = dev['name'].lower()
                    if ('stereo mix' in dev_name or '立體聲混音' in dev_name or 
                        'what u hear' in dev_name or 'wave out' in dev_name) and dev['max_input_channels'] > 0:
                        loopback_device = i
                        print(f"[🎙️] 找到 Stereo Mix 裝置: {dev['name']} (index={i})")
                        break
            
            if loopback_device is None:
                print("[⚠️] 未找到 Loopback 或 Stereo Mix 裝置！")
                print("    請確認已啟用以下其中一項：")
                print("    1. Windows 控制台 → 聲音 → 錄製 → 啟用「立體聲混音」")
                print("    2. 安裝 VB-CABLE 虛擬音訊：https://vb-audio.com/Cable/")
                print("    3. 使用支援 WASAPI loopback 的音訊驅動")
                print("    將使用系統預設輸入裝置 (麥克風) 作為替代...")
        except Exception as e:
            print(f"[⚠️] 列舉音訊裝置時發生錯誤: {e}")

        def audio_callback(indata, frames, time_info, status):
            if status:
                print(f"[⚠️] sounddevice 狀態: {status}")
            if self._running:
                # 直接將 int16 格式資料轉成 bytes，無須手動浮點數轉換
                pcm_data = indata.tobytes()
                try:
                    self._buffer.put_nowait(pcm_data)
                except queue.Full:
                    pass  # 丟棄最舊的資料避免堆積

        self._stream = sd.InputStream(
            samplerate=self.SAMPLE_RATE,
            channels=self.CHANNELS,
            dtype='int16',  # 直接設定為 int16 格式
            blocksize=self.CHUNK_SIZE // 2,  # blocksize 以 samples 為單位
            device=loopback_device,
            callback=audio_callback
        )
        self._stream.start()
        dev_name = "預設裝置" if loopback_device is None else sd.query_devices(loopback_device)['name']
        print(f"[🎙️] Windows 音訊擷取啟動 (裝置: {dev_name})")
    
    def read_chunk(self):
        if not self._running or self._buffer is None:
            return b''
        
        collected = b''
        try:
            while len(collected) < self.CHUNK_SIZE:
                chunk = self._buffer.get(timeout=0.5)
                collected += chunk
        except:
            pass
        return collected
    
    def stop(self):
        self._running = False
        try:
            if hasattr(self, '_stream') and self._stream:
                self._stream.stop()
                self._stream.close()
        except:
            pass
    
    def is_alive(self):
        return self._running and hasattr(self, '_stream') and self._stream.active


class MacOSAudioCapture(AudioCaptureBase):
    """macOS 平台：使用 sounddevice 擷取系統音訊 (需要虛擬音訊裝置如 BlackHole)"""

    def __init__(self):
        self._running = False
        self._buffer = None

    def start(self):
        try:
            import sounddevice as sd
            import numpy as np
        except ImportError:
            print("[❌] 缺少必要套件！請執行：pip install sounddevice numpy")
            raise
        
        import queue
        self._buffer = queue.Queue(maxsize=200)
        self._running = True
        self._sd = sd
        self._np = np

        # 在 macOS 上搜尋虛擬音訊裝置 (BlackHole, Loopback, Soundflower 等)
        virtual_device = None
        try:
            devices = sd.query_devices()
            virtual_keywords = ['blackhole', 'loopback', 'soundflower', 'multi-output', 'virtual']
            for i, dev in enumerate(devices):
                dev_name = dev['name'].lower()
                if dev['max_input_channels'] > 0:
                    for keyword in virtual_keywords:
                        if keyword in dev_name:
                            virtual_device = i
                            print(f"[🎙️] 找到虛擬音訊裝置: {dev['name']} (index={i})")
                            break
                    if virtual_device is not None:
                        break

            if virtual_device is None:
                print("[⚠️] 未找到虛擬音訊裝置！")
                print("    macOS 不支援直接擷取系統音訊，需要安裝虛擬音訊裝置。")
                print("    推薦方案（擇一安裝）：")
                print("    1. BlackHole (免費開源): https://github.com/ExistentialAudio/BlackHole")
                print("       brew install blackhole-2ch")
                print("    2. Loopback (付費): https://rogueamoeba.com/loopback/")
                print("    安裝後，前往「系統設定 → 聲音 → 輸出」選擇虛擬裝置，")
                print("    或使用「音訊 MIDI 設定」建立多輸出裝置。")
                print("    將使用系統預設輸入裝置 (麥克風) 作為替代...")
        except Exception as e:
            print(f"[⚠️] 列舉音訊裝置時發生錯誤: {e}")

        def audio_callback(indata, frames, time_info, status):
            if status:
                print(f"[⚠️] sounddevice 狀態: {status}")
            if self._running:
                pcm_data = (indata[:, 0] * 32767).astype(self._np.int16).tobytes()
                try:
                    self._buffer.put_nowait(pcm_data)
                except queue.Full:
                    pass

        self._stream = sd.InputStream(
            samplerate=self.SAMPLE_RATE,
            channels=self.CHANNELS,
            dtype='float32',
            blocksize=self.CHUNK_SIZE // 2,
            device=virtual_device,
            callback=audio_callback
        )
        self._stream.start()
        dev_name = "預設裝置" if virtual_device is None else sd.query_devices(virtual_device)['name']
        print(f"[🎙️] macOS 音訊擷取啟動 (裝置: {dev_name})")

    def read_chunk(self):
        if not self._running or self._buffer is None:
            return b''
        
        collected = b''
        try:
            while len(collected) < self.CHUNK_SIZE:
                chunk = self._buffer.get(timeout=0.5)
                collected += chunk
        except:
            pass
        return collected

    def stop(self):
        self._running = False
        try:
            if hasattr(self, '_stream') and self._stream:
                self._stream.stop()
                self._stream.close()
        except:
            pass

    def is_alive(self):
        return self._running and hasattr(self, '_stream') and self._stream.active


def create_audio_capture():
    """工廠函式：根據當前作業系統自動建立對應的音訊擷取實例"""
    if CURRENT_OS == "Linux":
        return LinuxAudioCapture()
    elif CURRENT_OS == "Windows":
        return WindowsAudioCapture()
    elif CURRENT_OS == "Darwin":
        return MacOSAudioCapture()
    else:
        print(f"[❌] 不支援的作業系統: {CURRENT_OS}")
        print("    目前僅支援 Linux、Windows、macOS。")
        sys.exit(1)


# ================= 1.8 贊助支持視窗 =================
class SupportDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle(t_py("support_title"))
        self.setStyleSheet("background-color: #0e0f13; border: 1px solid #3f3f46; border-radius: 12px;")
        self.setFixedSize(400, 520)
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowType.WindowContextHelpButtonHint)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(12)
        
        # Title
        title_label = QLabel(f"💖 {t_py('support_title')}", self)
        title_label.setStyleSheet("color: #f43f5e; font-size: 16px; font-weight: bold; border: none;")
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title_label)
        
        # Subtitle
        sub_label = QLabel(t_py("support_desc"), self)
        sub_label.setStyleSheet("color: #a1a1aa; font-size: 11px; border: none;")
        sub_label.setWordWrap(True)
        sub_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(sub_label)
        
        # QR Code label
        self.qr_label = QLabel(self)
        self.qr_label.setFixedSize(160, 160)
        self.qr_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.qr_label.setStyleSheet("background-color: white; border: 2px solid #5145cd; border-radius: 8px;")
        
        # Load QR code from network
        self.load_qr_code()
        
        qr_container = QHBoxLayout()
        qr_container.addWidget(self.qr_label)
        layout.addLayout(qr_container)
        
        # Network marker
        network_marker = QLabel("USDT TRC-20 NETWORK ONLY", self)
        network_marker.setStyleSheet("color: #f59e0b; font-size: 10px; font-weight: bold; background-color: #271400; border: 1px solid #78350f; border-radius: 4px; padding: 3px; border: none;")
        network_marker.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(network_marker)

        # Address label (selectable and copyable)
        addr_layout = QHBoxLayout()
        self.addr_val = "THtQ6hhdJnfR7sNDnsuP7FdEzKN8TVRcNH"
        self.addr_label = QLabel(self.addr_val, self)
        self.addr_label.setTextInteractionFlags(Qt.TextInteractionFlag.TextSelectableByMouse)
        self.addr_label.setStyleSheet("color: #10b981; font-family: monospace; font-size: 11px; background-color: #022c22; border: 1px solid #064e3b; border-radius: 6px; padding: 6px; border: none;")
        self.addr_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        addr_layout.addWidget(self.addr_label)
        
        copy_btn = QPushButton("📋", self)
        copy_btn.setFixedSize(30, 30)
        copy_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        copy_btn.setStyleSheet("""
            QPushButton {
                background-color: #1f2937; border: 1px solid #374151; color: white; border-radius: 6px; font-size: 12px;
            }
            QPushButton:hover {
                background-color: #374151;
            }
        """)
        copy_btn.clicked.connect(self.copy_address)
        addr_layout.addWidget(copy_btn)
        layout.addLayout(addr_layout)
        
        # Note label
        note_label = QLabel(t_py("support_note"), self)
        note_label.setStyleSheet("color: #71717a; font-size: 9px; border: none; line-height: 1.3;")
        note_label.setWordWrap(True)
        note_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(note_label)
        
        # Close button
        close_btn = QPushButton(t_py("close"), self)
        close_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        close_btn.setFixedSize(90, 30)
        close_btn.setStyleSheet("""
            QPushButton {
                background-color: #5145cd; border: none; color: white; border-radius: 6px; font-weight: bold;
            }
            QPushButton:hover {
                background-color: #4338ca;
            }
        """)
        close_btn.clicked.connect(self.accept)
        
        close_container = QHBoxLayout()
        close_container.addWidget(close_btn)
        layout.addLayout(close_container)

    def load_qr_code(self):
        # Background network fetch so Qt GUI never hangs
        def req():
            try:
                url = "https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=THtQ6hhdJnfR7sNDnsuP7FdEzKN8TVRcNH"
                req_obj = urllib.request.Request(
                    url, 
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                data = urllib.request.urlopen(req_obj, timeout=3).read()
                pixmap = QPixmap()
                if pixmap.loadFromData(data):
                    self.qr_label.setPixmap(pixmap)
            except Exception as e:
                # Text-based high contrast fallback
                self.qr_label.setText("QR CODE")
                self.qr_label.setStyleSheet("color: #5145cd; background-color: white; font-weight: bold; font-size: 16px; border: 2px solid #5145cd;")
        
        threading.Thread(target=req, daemon=True).start()

    def copy_address(self):
        clipboard = QApplication.clipboard()
        clipboard.setText(self.addr_val)
        QMessageBox.information(self, t_py("copied"), f"{t_py('copied')}!\n{self.addr_val}")


# ================= 2. 升級版視窗 =================
class SubtitleWindow(QLabel):
    def __init__(self):
        super().__init__()
        self.bridge = SignalBridge()
        self.bridge.text_received.connect(self.update_text)
        self.bridge.subtitle_received.connect(self.update_subtitles)
        
        self.drag_position = QPoint()
        self.current_font_size = INIT_FONT_SIZE
        self.display_mode = DISPLAY_MODE
        self.target_lang = TARGET_LANGUAGE
        self.gemini_api_key = GEMINI_API_KEY
        self.force_client_key = FORCE_CLIENT_KEY
        self.menu_lang = MENU_LANGUAGE
        self.app_ws_url = APP_WS_URL
        
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint | 
            Qt.WindowType.WindowStaysOnTopHint |
            Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)
        
        # 字幕內容快取
        self.display_text = f"[ GEMINI LIVE {t_py('placeholder_ready')} ({get_os_display_name()}) ]"
        self.display_original = ""
        self.display_translation = ""
        
        # 跨平台字型選擇
        font_family = self._get_system_font()
        self.setFont(QFont(font_family, self.current_font_size, QFont.Weight.Bold))
        self.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.setWordWrap(True)
        
        # 核心：置中定位
        self.recenter_position(WINDOW_WIDTH, WINDOW_HEIGHT)
        
        # 自動清除字幕的定時器
        self.clear_timer = QTimer(self)
        self.clear_timer.setSingleShot(True)
        self.clear_timer.timeout.connect(self.clear_subtitles)

    def _get_system_font(self):
        """根據作業系統回傳最適合的中文字型"""
        if CURRENT_OS == "Windows":
            return "Microsoft JhengHei"   # 微軟正黑體
        elif CURRENT_OS == "Darwin":
            return "PingFang TC"          # 蘋方-繁
        else:  # Linux
            return "Noto Sans CJK TC"     # Google Noto 思源黑體
        
    def recenter_position(self, w, h):
        screen = QApplication.primaryScreen().geometry()
        center_x = (screen.width() - w) // 2
        center_y = screen.height() - BOTTOM_OFFSET
        self.setGeometry(center_x, center_y, w, h)
        
    def save_settings(self):
        global config, TARGET_LANGUAGE, GEMINI_API_KEY, FORCE_CLIENT_KEY, MENU_LANGUAGE, APP_WS_URL
        config["TARGET_LANGUAGE"] = self.target_lang
        config["WINDOW_WIDTH"] = self.width()
        config["WINDOW_HEIGHT"] = self.height()
        config["INIT_FONT_SIZE"] = self.current_font_size
        config["DISPLAY_MODE"] = self.display_mode
        config["GEMINI_API_KEY"] = self.gemini_api_key
        config["FORCE_CLIENT_KEY"] = self.force_client_key
        config["MENU_LANGUAGE"] = self.menu_lang
        config["APP_WS_URL"] = self.app_ws_url
        TARGET_LANGUAGE = self.target_lang
        GEMINI_API_KEY = self.gemini_api_key
        FORCE_CLIENT_KEY = self.force_client_key
        MENU_LANGUAGE = self.menu_lang
        APP_WS_URL = self.app_ws_url
        try:
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=4, ensure_ascii=False)
        except Exception as e:
            print(f"[⚠️] 無法儲存設定檔: {e}")

    def update_text(self, text):
        # 用於一般連線提示訊息
        self.display_text = text
        self.display_original = ""
        self.display_translation = ""
        self.update() 

    def update_subtitles(self, original_text, translation_text):
        orig = original_text.strip()
        trans = translation_text.strip()

        # 當開始接收到實際語音字幕時，永久清除連線狀態提示字樣，防止在字幕空檔閃現
        if orig or trans:
            self.display_text = ""
            # 有新字幕內容時，重啟自動清空計時器
            if AUTO_CLEAR_MS > 0:
                self.clear_timer.start(AUTO_CLEAR_MS)

        # 1. 更新原文
        if orig:
            # 如果新原文較短或不以舊原文開頭，代表是新的一句話 (New Turn)，清除舊翻譯
            if not orig.startswith(self.display_original) or len(orig) < len(self.display_original):
                self.display_translation = ""
            self.display_original = orig

        # 2. 更新翻譯文
        if trans:
            self.display_translation = trans

        # 3. 終端機日誌列印
        if orig or trans:
            log_parts = []
            if self.display_original: log_parts.append(f"原: {self.display_original}")
            if self.display_translation: log_parts.append(f"譯: {self.display_translation}")
            print(f"👉 [AI 實時字幕]: {' | '.join(log_parts)}", flush=True)

        self.update()

    def clear_subtitles(self):
        self.display_original = ""
        self.display_translation = ""
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        painter.setRenderHint(QPainter.RenderHint.TextAntialiasing)

        font = self.font()
        rect = self.rect()

        def draw_outlined_text(target_rect, text_str, point_size, color):
            font.setPointSize(point_size)
            painter.setFont(font)
            # 黑色粗描邊外框
            pen = QPen(QColor(10, 10, 10), 8, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap, Qt.PenJoinStyle.RoundJoin)
            painter.setPen(pen)
            for dx in [-2, 0, 2]:
                for dy in [-2, 0, 2]:
                    if dx != 0 or dy != 0:
                        painter.drawText(target_rect.translated(dx, dy), Qt.AlignmentFlag.AlignCenter | Qt.TextFlag.TextWordWrap, text_str)
            # 繪製最上層填充顏色
            painter.setPen(color)
            painter.drawText(target_rect, Qt.AlignmentFlag.AlignCenter | Qt.TextFlag.TextWordWrap, text_str)

        # A. 雙行字幕模式
        if self.display_mode == "dual":
            orig_text = self.display_original
            trans_text = self.display_translation
            
            # 若無任何動態字幕，顯示連線提示 (置中)
            if not orig_text.strip() and not trans_text.strip():
                draw_outlined_text(rect, self.display_text, self.current_font_size, QColor(255, 255, 255))
            else:
                # 分割上下兩半區塊，避免字體重疊與版面跳動
                original_rect = QRect(rect.left(), rect.top(), rect.width(), rect.height() // 2)
                translation_rect = QRect(rect.left(), rect.top() + rect.height() // 2, rect.width(), rect.height() // 2)
                
                # 原文在上方 (稍小，淡灰色)
                draw_outlined_text(original_rect, orig_text, int(self.current_font_size * 0.85), QColor(210, 210, 210))
                # 翻譯在下方 (正常，純白色)
                if trans_text.strip():
                    draw_outlined_text(translation_rect, trans_text, self.current_font_size, QColor(255, 255, 255))
        
        # B. 顯示單行：僅翻譯文 (完全無原文閃現)
        elif self.display_mode == "translation_only":
            text_to_draw = ""
            if self.display_translation.strip():
                text_to_draw = self.display_translation
            elif self.target_lang == "none" and self.display_original.strip():
                text_to_draw = self.display_original
            
            if not text_to_draw.strip():
                text_to_draw = self.display_text
                
            draw_outlined_text(rect, text_to_draw, self.current_font_size, QColor(255, 255, 255))

        # C. 顯示單行：智慧翻譯 (同語系顯示原文，防外語原文閃現)
        else: # translation_smart
            text_to_draw = ""
            if self.display_translation.strip():
                text_to_draw = self.display_translation
            elif self.display_original.strip():
                # 僅在說的語言符合目標語系，或是無翻譯（僅轉錄）時才作為單行 fallback 顯示
                if self.target_lang == "none" or is_target_language(self.display_original, self.target_lang):
                    text_to_draw = self.display_original
            
            if not text_to_draw.strip():
                text_to_draw = self.display_text
                
            draw_outlined_text(rect, text_to_draw, self.current_font_size, QColor(255, 255, 255))

        painter.end()

    # ====== 🛠️ 滑鼠拖曳移動視窗 ======
    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.drag_position = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            event.accept()
            
    def mouseMoveEvent(self, event):
        if event.buttons() == Qt.MouseButton.LeftButton:
            self.move(event.globalPosition().toPoint() - self.drag_position)
            event.accept()

    # ====== 🛠️ 滑鼠滾輪調整字幕大小 ======
    def wheelEvent(self, event):
        angle = event.angleDelta().y()
        if angle > 0:
            self.current_font_size = min(80, self.current_font_size + 2) 
        else:
            self.current_font_size = max(12, self.current_font_size - 2) 
        self.save_settings()
        self.update()
        event.accept()

    # ====== 🛠️ 進階右鍵選單功能 ======
    def contextMenuEvent(self, event):
        context_menu = QMenu(self)
        context_menu.setStyleSheet("background-color: #18181b; color: white; border: 1px solid #3f3f46;")
        
        # 1. 字幕顯示模式子選單
        mode_menu = context_menu.addMenu(t_py("menu_mode"))
        modes = [
            (t_py("mode_only"), "translation_only"),
            (t_py("mode_smart"), "translation_smart"),
            (t_py("mode_dual"), "dual")
        ]
        for name, mode in modes:
            act = mode_menu.addAction(name)
            act.setCheckable(True)
            act.setChecked(self.display_mode == mode)
            act.triggered.connect(lambda checked, m=mode: self.set_display_mode(m))
            
        # 2. 翻譯目標語言子選單
        lang_menu = context_menu.addMenu(t_py("menu_lang"))
        is_english = self.menu_lang == "English"
        languages = [
            ("繁體中文 (Traditional Chinese)" if not is_english else "Traditional Chinese", "Traditional Chinese"),
            ("簡體中文 (Simplified Chinese)" if not is_english else "Simplified Chinese", "Simplified Chinese"),
            ("英文 (English)" if not is_english else "English", "English"),
            ("日文 (Japanese)" if not is_english else "Japanese", "Japanese"),
            ("韓文 (Korean)" if not is_english else "Korean", "Korean"),
            ("西班牙文 (Spanish)" if not is_english else "Spanish", "Spanish"),
            ("法文 (French)" if not is_english else "French", "French"),
            ("德文 (German)" if not is_english else "German", "German"),
            ("義大利文 (Italian)" if not is_english else "Italian", "Italian"),
            ("俄文 (Russian)" if not is_english else "Russian", "Russian"),
            ("葡萄牙文 (Portuguese)" if not is_english else "Portuguese", "Portuguese"),
            ("越南文 (Vietnamese)" if not is_english else "Vietnamese", "Vietnamese"),
            ("泰文 (Thai)" if not is_english else "Thai", "Thai"),
            ("印尼文 (Indonesian)" if not is_english else "Indonesian", "Indonesian"),
            ("阿拉伯文 (Arabic)" if not is_english else "Arabic", "Arabic"),
            ("印地文 (Hindi)" if not is_english else "Hindi", "Hindi"),
            ("土耳其文 (Turkish)" if not is_english else "Turkish", "Turkish"),
            ("波蘭文 (Polish)" if not is_english else "Polish", "Polish"),
            ("荷蘭文 (Dutch)" if not is_english else "Dutch", "Dutch"),
            ("瑞典文 (Swedish)" if not is_english else "Swedish", "Swedish"),
            ("丹麥文 (Danish)" if not is_english else "Danish", "Danish"),
            ("芬蘭文 (Finnish)" if not is_english else "Finnish", "Finnish"),
            ("挪威文 (Norwegian)" if not is_english else "Norwegian", "Norwegian"),
            ("馬來文 (Malay)" if not is_english else "Malay", "Malay"),
            ("烏克蘭文 (Ukrainian)" if not is_english else "Ukrainian", "Ukrainian"),
            ("菲律賓文 (Filipino)" if not is_english else "Filipino", "Filipino"),
            ("羅馬尼亞文 (Romanian)" if not is_english else "Romanian", "Romanian"),
            ("匈牙利文 (Hungarian)" if not is_english else "Hungarian", "Hungarian"),
            ("捷克文 (Czech)" if not is_english else "Czech", "Czech"),
            ("斯洛伐克文 (Slovak)" if not is_english else "Slovak", "Slovak"),
            ("希臘文 (Greek)" if not is_english else "Greek", "Greek"),
            ("希伯來文 (Hebrew)" if not is_english else "Hebrew", "Hebrew"),
            ("波斯文 (Persian)" if not is_english else "Persian", "Persian"),
            ("孟加拉文 (Bengali)" if not is_english else "Bengali", "Bengali"),
            ("旁遮普文 (Punjabi)" if not is_english else "Punjabi", "Punjabi"),
            ("古吉拉特文 (Gujarati)" if not is_english else "Gujarati", "Gujarati"),
            ("泰米爾文 (Tamil)" if not is_english else "Tamil", "Tamil"),
            ("泰盧固文 (Telugu)" if not is_english else "Telugu", "Telugu"),
            ("卡納達文 (Kannada)" if not is_english else "Kannada", "Kannada"),
            ("馬拉雅拉姆文 (Malayalam)" if not is_english else "Malayalam", "Malayalam"),
            ("克羅埃西亞文 (Croatian)" if not is_english else "Croatian", "Croatian"),
            ("塞爾維亞文 (Serbian)" if not is_english else "Serbian", "Serbian"),
            ("保加利亞文 (Bulgarian)" if not is_english else "Bulgarian", "Bulgarian"),
            ("立陶宛文 (Lithuanian)" if not is_english else "Lithuanian", "Lithuanian"),
            ("拉脫維亞文 (Latvian)" if not is_english else "Latvian", "Latvian"),
            ("愛沙尼亞文 (Estonian)" if not is_english else "Estonian", "Estonian"),
            ("斯洛比尼亞文 (Slovenian)" if not is_english else "Slovenian", "Slovenian"),
            ("愛爾蘭文 (Irish)" if not is_english else "Irish", "Irish"),
            ("威爾斯文 (Welsh)" if not is_english else "Welsh", "Welsh"),
            ("冰島文 (Icelandic)" if not is_english else "Icelandic", "Icelandic"),
            ("南非荷蘭文 (Afrikaans)" if not is_english else "Afrikaans", "Afrikaans"),
            ("斯瓦希里文 (Swahili)" if not is_english else "Swahili", "Swahili"),
            (t_py("lang_none"), "none")
        ]
        for name, code in languages:
            act = lang_menu.addAction(name)
            act.setCheckable(True)
            act.setChecked(self.target_lang == code)
            act.triggered.connect(lambda checked, c=code: self.set_target_language(c))
            
        # 3. 調整視窗寬度子選單
        width_menu = context_menu.addMenu(t_py("menu_width"))
        widths = [1000, 1200, 1400, 1600]
        for w in widths:
            act = width_menu.addAction(f"{w} px" + (" (" + ("default" if self.menu_lang == "English" else "預設") + ")" if w == 1200 else ""))
            act.setCheckable(True)
            act.setChecked(self.width() == w)
            act.triggered.connect(lambda checked, val=w: self.set_window_width(val))
        custom_w = width_menu.addAction("自訂寬度..." if self.menu_lang != "English" else "Custom Width...")
        custom_w.triggered.connect(self.custom_window_width)

        # 4. 調整視窗高度子選單
        height_menu = context_menu.addMenu(t_py("menu_height"))
        heights = [80, 120, 160, 200]
        for h in heights:
            act = height_menu.addAction(f"{h} px" + (" (" + ("default" if self.menu_lang == "English" else "預設") + ")" if h == 120 else ""))
            act.setCheckable(True)
            act.setChecked(self.height() == h)
            act.triggered.connect(lambda checked, val=h: self.set_window_height(val))
        custom_h = height_menu.addAction("自訂高度..." if self.menu_lang != "English" else "Custom Height...")
        custom_h.triggered.connect(self.custom_window_height)

        # 5. 調整字體大小子選單
        font_menu = context_menu.addMenu(t_py("menu_font"))
        sizes = [20, 26, 32, 38]
        for s in sizes:
            act = font_menu.addAction(f"{s} px" + (" (" + ("default" if self.menu_lang == "English" else "預設") + ")" if s == 26 else ""))
            act.setCheckable(True)
            act.setChecked(self.current_font_size == s)
            act.triggered.connect(lambda checked, val=s: self.set_font_size(val))
        custom_f = font_menu.addAction("自訂字體大小..." if self.menu_lang != "English" else "Custom Font Size...")
        custom_f.triggered.connect(self.custom_font_size)

        # 5.5 調整 Gemini API 金鑰子選單
        api_menu = context_menu.addMenu(t_py("menu_key"))
        
        # 5.5a 輸入 API key Action
        api_key_str = self.gemini_api_key if self.gemini_api_key else ""
        masked_api_key = api_key_str if len(api_key_str) < 10 else f"{api_key_str[:6]}...{api_key_str[-4:]}"
        not_set_str = "Not Set" if self.menu_lang == "English" else "未設定"
        key_label = t_py("key_title") + (f" ({masked_api_key})" if api_key_str else f" ({not_set_str})")
        api_key_act = api_menu.addAction(key_label)
        api_key_act.triggered.connect(self.prompt_api_key)
        
        # 5.5b 切換是否強制使用本地金鑰 Action
        force_label = "🔒 Force local API Key (ignore server)" if self.menu_lang == "English" else "🔒 強制使用此本地端金鑰 (無視伺服器設定)"
        force_act = api_menu.addAction(force_label)
        force_act.setCheckable(True)
        force_act.setChecked(self.force_client_key)
        force_act.triggered.connect(self.toggle_force_client_key)

        # 5.5c 調整後端連線位址 (WebSocket URL)
        ws_url_label = t_py("menu_ws_url") #+ f" ({self.app_ws_url})"
        ws_url_act = context_menu.addAction(ws_url_label)
        ws_url_act.triggered.connect(self.prompt_ws_url)

        # 5.6 調整介面語言子選單 (Language)
        ui_lang_menu = context_menu.addMenu(t_py("menu_ui_lang"))
        ui_languages = [
            ("繁體中文", "Traditional Chinese"),
            ("English", "English")
        ]
        for name, code in ui_languages:
            act = ui_lang_menu.addAction(name)
            act.setCheckable(True)
            act.setChecked(self.menu_lang == code)
            act.triggered.connect(lambda checked, c=code: self.set_menu_language(c))

        # 5.7 支持開發者 (Support Developer)
        support_act = context_menu.addAction(t_py("menu_support"))
        support_act.triggered.connect(self.open_support_dialog)

        context_menu.addSeparator()
        
        # 6. 安全關閉選項
        exit_action = context_menu.addAction(t_py("menu_exit"))
        
        action = context_menu.exec(self.mapToGlobal(event.pos()))
        if action == exit_action:
            clean_exit()

    # ------ 槽函式 (Slot Functions) ------
    def set_display_mode(self, mode):
        self.display_mode = mode
        self.save_settings()
        self.update()

    def set_target_language(self, lang_code):
        self.target_lang = lang_code
        self.save_settings()
        # 觸發主執行緒關閉 WebSocket 重連
        global active_ws, main_loop
        if active_ws and main_loop:
            asyncio.run_coroutine_threadsafe(active_ws.close(), main_loop)

    def set_window_width(self, w):
        self.recenter_position(w, self.height())
        self.save_settings()

    def custom_window_width(self):
        val, ok = QInputDialog.getInt(self, t_py("dialog_width_title"), t_py("dialog_width_label"), self.width(), 400, 3000, 50)
        if ok:
            self.set_window_width(val)

    def set_window_height(self, h):
        self.recenter_position(self.width(), h)
        self.save_settings()

    def custom_window_height(self):
        val, ok = QInputDialog.getInt(self, t_py("dialog_height_title"), t_py("dialog_height_label"), self.height(), 40, 1000, 10)
        if ok:
            self.set_window_height(val)

    def set_font_size(self, size):
        self.current_font_size = size
        self.save_settings()
        self.update()

    def custom_font_size(self):
        val, ok = QInputDialog.getInt(self, t_py("dialog_font_title"), t_py("dialog_font_label"), self.current_font_size, 10, 150, 1)
        if ok:
            self.set_font_size(val)

    def prompt_api_key(self):
        text, ok = QInputDialog.getText(
            self, t_py("dialog_key_title"), 
            t_py("dialog_key_label"), 
            text=self.gemini_api_key
        )
        if ok:
            self.gemini_api_key = text.strip()
            self.save_settings()
            # 觸發主執行緒關閉 WebSocket 重連，讓新金鑰立即生效！
            global active_ws, main_loop
            if active_ws and main_loop:
                asyncio.run_coroutine_threadsafe(active_ws.close(), main_loop)

    def toggle_force_client_key(self, checked):
        self.force_client_key = checked
        self.save_settings()
        # 觸發主執行緒關閉 WebSocket 重連，讓新設定立即生效！
        global active_ws, main_loop
        if active_ws and main_loop:
            asyncio.run_coroutine_threadsafe(active_ws.close(), main_loop)

    def prompt_ws_url(self):
        text, ok = QInputDialog.getText(
            self, t_py("dialog_ws_url_title"), 
            t_py("dialog_ws_url_label"), 
            text=self.app_ws_url
        )
        if ok:
            self.app_ws_url = text.strip()
            self.save_settings()
            # 觸發主執行緒關閉 WebSocket 重連，讓新位址立即生效！
            global active_ws, main_loop
            if active_ws and main_loop:
                asyncio.run_coroutine_threadsafe(active_ws.close(), main_loop)

    def set_menu_language(self, lang):
        self.menu_lang = lang
        self.save_settings()
        # 更新字幕初始提示文字以在介面切換時使其實時生效
        self.display_text = f"[ GEMINI LIVE {t_py('placeholder_ready')} ({get_os_display_name()}) ]"
        self.update()

    def open_support_dialog(self):
        dialog = SupportDialog(self)
        dialog.exec()

# ================= 3. AI 處理與重連連線大腦 =================
audio_capture = None  # 全域音訊擷取實例

async def run_ai():
    global sub_win, audio_capture, active_ws, main_loop
    main_loop = asyncio.get_running_loop()
    
    # 使用工廠函式建立對應平台的音訊擷取器
    audio_capture = create_audio_capture()
    try:
        audio_capture.start()
    except Exception as e:
        print("[❌] " + ("Audio capture start failed: " if MENU_LANGUAGE == "English" else "音訊擷取啟動失敗: ") + f"{e}")
        if sub_win:
            sub_win.bridge.text_received.emit("[ ❌ " + ("Audio capture failed: " if MENU_LANGUAGE == "English" else "音訊擷取失敗: ") + f"{e} ]")
        return

    while True:
        try:
            print(t_py("log_connecting"))
            if sub_win:
                sub_win.bridge.text_received.emit(t_py("placeholder_connecting"))

            # --- 修改開始：強制略過 SSL 憑證驗證 ---
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            is_secure = APP_WS_URL.startswith("wss://")

            async with websockets.connect(
                APP_WS_URL, 
                origin="http://localhost:3000",
                ssl=ssl_context if is_secure else None
            ) as ws:
            # --- 修改結束 ---
                active_ws = ws
                setup_payload = {
                    "type": "setup",
                    "targetLang": TARGET_LANGUAGE
                }
                if GEMINI_API_KEY:
                    # Support multiple comma-separated keys entered locally
                    setup_payload["customApiKeys"] = [k.strip() for k in GEMINI_API_KEY.split(",") if k.strip()]
                    setup_payload["restrictToCustomKeys"] = FORCE_CLIENT_KEY
                
                await ws.send(json.dumps(setup_payload))
                is_yes = "Yes" if MENU_LANGUAGE == "English" else "是"
                is_no = "No" if MENU_LANGUAGE == "English" else "否"
                success_log = f"[✅] " + ("Successfully connected to backend server!" if MENU_LANGUAGE == "English" else "已成功連線至後端伺服器！") + f" (Target: {TARGET_LANGUAGE}, Custom key: {is_yes if GEMINI_API_KEY else is_no}, Force local: {is_yes if FORCE_CLIENT_KEY else is_no})"
                print(success_log)
                if sub_win:
                    sub_win.bridge.text_received.emit(t_py("placeholder_connected"))

                async def send_audio():
                    loop = asyncio.get_event_loop()
                    try:
                        while True:
                            if not audio_capture.is_alive():
                                print("[⚠️] " + ("Audio capture stopped" if MENU_LANGUAGE == "English" else "音訊擷取已停止"))
                                break
                            data = await loop.run_in_executor(None, audio_capture.read_chunk)
                            if data:
                                await ws.send(json.dumps({"type": "audio", "data": base64.b64encode(data).decode('utf-8')}))
                            await asyncio.sleep(0.05)
                    except websockets.exceptions.ConnectionClosed:
                        print("[⚠️] " + ("Sender detected connection closed..." if MENU_LANGUAGE == "English" else "發送端偵測到連線中斷..."))
                    except asyncio.CancelledError:
                        pass

                async def recv_text():
                    try:
                        async for raw_message in ws:
                            message = json.loads(raw_message)
                            if message.get("type") == "gemini_message":
                                data = message.get("data", {})
                                
                                # 分別擷取原文 (input) 與翻譯文 (output)
                                original = data.get("inputTranscriptionText", "").strip()
                                translation = data.get("outputTranscriptionText", "").strip()
                                
                                combined_clean = (original + " " + translation).lower()
                                
                                # 🛡️ 審查牆過濾
                                if "language model and can't help" in combined_clean or "無法對此提供幫助" in combined_clean:
                                    print("[⚠️] " + ("Triggered safety wall, auto-restarting channel..." if MENU_LANGUAGE == "English" else "觸發安全牆，自動重啟管道..."))
                                    await ws.close()
                                    return
                                    
                                if sub_win and (original or translation):
                                    sub_win.bridge.subtitle_received.emit(original, translation)
                                    
                    except websockets.exceptions.ConnectionClosed:
                        print("[⚠️] " + ("Receiver detected connection closed..." if MENU_LANGUAGE == "English" else "接收端偵測到連線中斷..."))
                    except asyncio.CancelledError:
                        pass

                await asyncio.gather(send_audio(), recv_text())

        except (websockets.exceptions.ConnectionClosed, OSError, Exception) as e:
            print(t_py("log_disconnect").format(e=e))
            if sub_win:
                sub_win.bridge.text_received.emit(t_py("placeholder_reconnect"))
            await asyncio.sleep(5)

def clean_exit():
    global audio_capture
    print("\n[🛑] 正在關閉程式...")
    if audio_capture:
        try:
            audio_capture.stop()
        except:
            pass
    # 相容舊版：清理 audio_proc（如果存在）
    global audio_proc
    if audio_proc:
        try:
            audio_proc.terminate()
            audio_proc.wait(timeout=1)
        except:
            pass
    QApplication.quit()
    os._exit(0)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    sub_win = SubtitleWindow()
    sub_win.show()

    def handle_signal(sig, frame): clean_exit()
    signal.signal(signal.SIGINT, handle_signal)  
    signal.signal(signal.SIGTERM, handle_signal) 

    ai_thread = threading.Thread(target=lambda: asyncio.run(run_ai()), daemon=True)
    ai_thread.start()

    try:
        sys.exit(app.exec())
    except KeyboardInterrupt:
        clean_exit()
