@echo off
echo Setting up virtual environment and installing dependencies...
echo 正在建立虛擬環境並安裝依賴套件...

:: Create virtual environment named 'venv'
python -m venv venv

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Upgrade pip and install requirements
python -m pip install --upgrade pip
pip install websockets numpy sounddevice PyQt6

echo.
echo Setup complete! Virtual environment is ready in 'venv' folder.
echo 安裝完成！虛擬環境已建立在 'venv' 資料夾中。
pause
