@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title 更新文档列表

set "SITE=%~dp0"
set "DOC=%SITE%document"
set "OUT=%DOC%\files.js"

echo ==========================================
echo   正在扫描 document 文件夹...
echo ==========================================
echo.

if not exist "%DOC%" (
    echo 错误：找不到 document 文件夹
    echo.
    goto :done
)

set "BASE=%DOC%\"

(
    echo var FILES = [
    for /r "%DOC%" %%F in (*) do (
        if /i not "%%~nxF"=="index.html" (
            if /i not "%%~nxF"=="files.js" (
                set "f=%%~fF"
                set "rel=!f:%BASE%=!"
                set "rel=!rel:\=/!"

                set "type=文件"
                set "icon=📄"
                if /i "%%~xF"==".pdf"  set "type=PDF 文档"
                if /i "%%~xF"==".doc"  set "type=Word 文档" & set "icon=📝"
                if /i "%%~xF"==".docx" set "type=Word 文档" & set "icon=📝"
                if /i "%%~xF"==".xls"  set "type=Excel 表格" & set "icon=📊"
                if /i "%%~xF"==".xlsx" set "type=Excel 表格" & set "icon=📊"
                if /i "%%~xF"==".ppt"  set "type=PPT 演示文稿" & set "icon=📽️"
                if /i "%%~xF"==".pptx" set "type=PPT 演示文稿" & set "icon=📽️"
                if /i "%%~xF"==".txt"  set "type=文本文档"
                if /i "%%~xF"==".jpg"  set "type=图片" & set "icon=🖼️"
                if /i "%%~xF"==".jpeg" set "type=图片" & set "icon=🖼️"
                if /i "%%~xF"==".png"  set "type=图片" & set "icon=🖼️"
                if /i "%%~xF"==".gif"  set "type=图片" & set "icon=🖼️"
                if /i "%%~xF"==".zip"  set "type=压缩包" & set "icon=🗜️"
                if /i "%%~xF"==".rar"  set "type=压缩包" & set "icon=🗜️"
                if /i "%%~xF"==".7z"   set "type=压缩包" & set "icon=🗜️"
                if /i "%%~xF"==".mp4"  set "type=视频" & set "icon=🎬"
                if /i "%%~xF"==".mp3"  set "type=音频" & set "icon=🎵"

                echo   {
                echo     name: '!rel!',
                echo     size: %%~zF,
                echo     date: '%%~tF',
                echo     type: '!type!',
                echo     icon: '!icon!',
                echo     url: '!rel!'
                echo   },
            )
        )
    )
    echo ];
) > "%OUT%"

echo 完成! 已生成文件列表。
echo.

:done
echo ==========================================
echo   更新完成,按任意键关闭窗口...
echo ==========================================
pause >nul
