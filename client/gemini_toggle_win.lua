-- gemini_toggle_win.lua (Windows 專用, 支援 EXE)
local utils = require 'mp.utils'

function toggle_gemini()
    -- 直接指向打包好的 .exe 檔案路徑
    -- Direct path to the packaged .exe file
    local cmd = {"C:\\path\\to\\gemini_audio_bridge.exe"}
    
    mp.osd_message("Launching Gemini Bridge...")
    utils.subprocess_detached({args = cmd})
end

mp.add_key_binding("g", "toggle_gemini", toggle_gemini)
EOF
