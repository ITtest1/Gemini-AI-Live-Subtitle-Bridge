# 🎙️ Gemini Live Real-time Subtitle & Translation Bridge — Cross-Platform User Guide

This guide explains how to install, configure, and run the `gemini_audio_bridge.py` real-time bilingual subtitle tool on **Windows**, **macOS**, and **Linux** platforms.

---

## 📌 System Requirements & Common Dependencies
* **Python Version**: Python 3.8 or above.
* **Backend Server**: Requires an active WebSocket proxy server compatible with this script (default is `ws://localhost:8081/api/gemini/live`).

---

## 1. 🏁 Windows Platform Guide

The Windows platform utilizes the Python `sounddevice` library paired with Microsoft's official **WASAPI Loopback** technology to capture lossless, ultra-low-latency audio directly from the system output.

### Step A: Install Python Dependencies
Open Windows Command Prompt (`cmd`) or PowerShell, navigate to your project directory or virtual environment, and run:
```bash
pip install PyQt6 websockets sounddevice numpy certifi
```

### Step B: Configure Audio Capture Source
When the script starts, it automatically searches under **WASAPI** for an audio device containing `Loopback`.
* **If no audio is captured (warning appears in the terminal)**:
  1. **Enable "Stereo Mix"**:
     * Press `Win + R`, type `control mmsys.cpl,,recording` and press Enter to open the Sound Recording settings.
     * Right-click on any empty space and check "Show Disabled Devices".
     * Right-click "Stereo Mix" and select "Enable", then set it as the default device.
  2. **Install a Virtual Audio Driver (Recommended)**:
     * If your hardware does not support Stereo Mix, install the free [VB-AUDIO Virtual Cable](https://vb-audio.com/Cable/).
     * Once installed, set your Windows default audio playback output to `CABLE Input`. The script will automatically detect and capture the system sound.

### Step C: Launch the Script
```bash
python gemini_audio_bridge.py
```

---

## 2. 🍎 macOS Platform Guide

Due to Apple's strict system security policies, macOS does not support recording system output audio directly from the kernel. Therefore, you **must install a virtual audio device** to route the audio.

### Step A: Install Python Dependencies
Open your macOS terminal (`Terminal`) and run:
```bash
pip install PyQt6 websockets sounddevice numpy
```

### Step B: Install & Configure Virtual Audio Device (BlackHole)
1. **Install Free & Open-source BlackHole**:
   * Open the Terminal and install via Homebrew:
     ```bash
     brew install blackhole-2ch
     ```
   * *(If Homebrew is not installed, download the installer directly from the official [Existential Audio Github page](https://github.com/ExistentialAudio/BlackHole))*.
2. **Create a "Multi-Output Device" (So you can hear the audio while recording it)**:
   * Search for and open the **"Audio MIDI Setup"** application on your Mac.
   * Click the `+` button in the lower-left corner and choose **"Create Multi-Output Device"**.
   * In the right panel, check both your physical speakers (e.g., `MacBook Pro Speakers` or `Headphones`) and `BlackHole 2ch`.
   * Set the "Master Device" to your physical speakers, and enable "Drift Correction" on BlackHole.
3. **Switch System Audio Output**:
   * Click the Sound icon in the Mac menu bar and switch your output device to the newly created **"Multi-Output Device"**.
   * Now, all system playback audio will be sent to both your speakers (for you to hear) and BlackHole (for the script to capture).

### Step C: Launch the Script
```bash
python3 gemini_audio_bridge.py
```

---

## 3. 🐧 Linux Platform Guide

Linux natively supports PulseAudio (or compatible PipeWire) via the standard `pactl` and `parec` commands to capture lossless system-level loopback, making setup straightforward and intuitive.

### Step A: Install System Tools & Python Dependencies
On Ubuntu / Debian systems, execute the following commands:
```bash
# 1. Update package list and install virtualenv, system audio libraries, PulseAudio tools, and required UI X11/XCB libraries for PyQt6
sudo apt update
sudo apt install -y python3-venv libportaudio2 pulseaudio-utils \
  libxcb-cursor0 libxcb-xinerama0 libxcb-icccm4 libxcb-image0 \
  libxcb-keysyms1 libxcb-randr0 libxcb-render-util0 libxcb-shape0 \
  libxcb-shm0 libxcb-sync1 libxcb-util1 libxcb-xfixes0 libxkbcommon-x11-0

# 2. Install Python dependencies
pip install PyQt6 websockets
```

### Step B: Verify PulseAudio Service Status
Most desktop distributions have PulseAudio or PipeWire enabled by default. The script will automatically invoke `pactl list sources short` to detect any loopback device ending in `.monitor`. No manual configuration is required.

### Step C: Launch the Script
```bash
python3 gemini_audio_bridge.py
```

---

## 🛠️ Subtitle Overlay Interactions & Context Menu Guide

Upon launch, a semi-transparent, stay-on-top subtitle overlay will appear. You can interact with it using mouse gestures or the right-click context menu:

| Gesture / Action | Description |
| :--- | :--- |
| **Left-click and Drag** | Drag the subtitle window freely to position it anywhere on the screen. |
| **Mouse Wheel** | Scroll up to increase font size; scroll down to decrease font size. |
| **Right-Click -> Subtitle Mode** | Toggle between "Single line: Translation only", "Single line: Smart Translation (original if same language)", or "Dual-row (original + translation)". |
| **Right-Click -> Target Language** | Change translation output language (Traditional Chinese, English, Japanese, Korean, or Transcription-only). |
| **Right-Click -> Width / Height / Font** | Resize the window dimensions or customize font size. |
| **Right-Click -> Gemini API Key** | Enter your custom Gemini API Key locally (allows multiple keys separated by commas). |
* **Right-Click -> Interface Language** | Switch UI and console log language (English / Traditional Chinese).
* **Right-click -> Support Developer** | Displays the developer's donation USDT address and QR code.
* **Right-click -> Close** | Closes the subtitle application safely.

---

## Support & Donation
If you find this tool helpful for your language learning or viewing experiences, feel free to support its ongoing development via USDT-TRC20:
* **USDT-TRC20 Address:** `THtQ6hhdJnfR7sNDnsuP7FdEzKN8TVRcNH`

*(Note: Always verify you are using the correct network when transferring.)*
