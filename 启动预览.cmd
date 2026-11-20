@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动本地预览（http://127.0.0.1:8800）...
start "个人介绍-预览服务" /min cmd /c "node _tools\serve.mjs . 8800"
timeout /t 2 >nul
start "" "http://127.0.0.1:8800/"
echo 关掉这个窗口不会停止服务；要停止请关闭任务栏里的「个人介绍-预览服务」窗口。
timeout /t 3 >nul
