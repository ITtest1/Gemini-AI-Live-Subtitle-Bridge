-- gemini_toggle.lua
--[[
  Setup Instructions / 設定說明:
  1. Ensure the Python script is executable / 請確保 Python 腳本已賦予執行權限:
     chmod +x /path/to/gemini_audio_bridge.py path/to/run_bridge.sh
  2. Update 'script_path' below to the absolute path of your executable / 請將下方的 'script_path' 修改為您的執行檔絕對路徑
  3. Update 'proc_name' to match your executable's name / 請將 'proc_name' 修改為與您的執行檔名稱一致
--]]

local active = false
-- Path to your packaged executable / 執行檔路徑
local script_path = "/path/to/Gemini-AI-Live-Subtitle-Bridge/dist/run_bridge.sh"
-- Process name for cleanup / 用於清理進程的名稱
local proc_name = "gemini_audio_bridge.py"

function toggle_gemini()
    if active then
        -- Disable: Kill the Python process / 關閉：殺死 Python 進程
        os.execute("pkill -f " .. proc_name)
        mp.osd_message("AI Subtitles: Disabled", 2)
        active = false
    else
        -- Enable: Run the script in the background / 開啟：在背景執行啟動腳本
        os.execute(script_path .. " &")
        mp.osd_message("AI Subtitles: Enabled", 2)
        active = true
    end
end

-- Bind to 'g' key / 綁定快捷鍵 'g'
mp.add_key_binding("g", "toggle_gemini", toggle_gemini)
