@echo off
title 更新文档网盘
echo ==========================================
echo   正在扫描 document 文件夹...
echo ==========================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0update_docs.ps1"
echo.
echo ==========================================
echo   更新完成,按任意键关闭窗口...
echo ==========================================
pause >nul
