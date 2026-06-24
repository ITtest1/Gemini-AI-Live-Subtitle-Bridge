#!/bin/bash
# 確保腳本以 root 權限執行
if [ "$EUID" -ne 0 ]; then
  echo "請使用 sudo 執行此腳本 (以便安裝系統依賴)"
  exit
fi

echo "正在檢查並安裝系統依賴 (python3.8-venv, libportaudio2, libxcb dependencies)..."
apt-get update && apt-get install -y python3.8-venv libportaudio2 libxcb-cursor0 libxcb-xinerama0 libxcb-icccm4 libxcb-image0 libxcb-keysyms1 libxcb-randr0 libxcb-render-util0 libxcb-shape0 libxcb-shm0 libxcb-sync1 libxcb-util1 libxcb-xfixes0 libxkbcommon-x11-0
#libxcb-xinerama0 libxcb-icccm4 libxcb-image0 libxcb-keysyms1 libxcb-randr0 libxcb-render-util0 libxcb-shape0 libxkbcommon-x11-0

cd /root/Videos/000/tool/srt/
echo "正在建立獨立 Python 環境..."
# 如果已存在，先刪除舊的以確保乾淨
rm -rf venv
python3 -m venv venv
echo "正在安裝必要的套件 (websockets, numpy, sounddevice, PyQt6)..."
./venv/bin/pip install --upgrade pip
./venv/bin/pip install websockets numpy sounddevice PyQt6
echo "部署完成！"
