# Word 转博客文章工具
# 用法: .\word2article.ps1 "文档.docx" "模板.html" "输出文件.html"

param(
    [Parameter(Mandatory=$true)]
    [string]$WordPath,
    
    [Parameter(Mandatory=$true)]
    [string]$TemplatePath,
    
    [Parameter(Mandatory=$true)]
    [string]$OutputPath
)

if (-not (Test-Path $WordPath)) {
    Write-Host "错误: 文件不存在 $WordPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $TemplatePath)) {
    Write-Host "错误: 模板不存在 $TemplatePath" -ForegroundColor Red
    exit 1
}

Write-Host "正在处理: $WordPath" -ForegroundColor Cyan

$word = New-Object -ComObject Word.Application
$word.Visible = $false

try {
    $doc = $word.Documents.Open((Resolve-Path $WordPath).Path)
    
    # 获取最后修改时间
    $lastModified = $doc.BuiltInDocumentProperties("Last Save Time").Value
    $dateStr = $lastModified.ToString("yyyy-MM-dd")
    
    # 获取标题（第一个非空段落）
    $title = ""
    $content = @()
    $foundTitle = $false
    
    foreach ($para in $doc.Paragraphs) {
        $text = $para.Range.Text.Trim()
        if ([string]::IsNullOrWhiteSpace($text)) { continue }
        
        # 第一个非空段落作为标题
        if (-not $foundTitle) {
            $title = $text
            $foundTitle = $true
            continue
        }
        
        # 检查是否是标题样式
        $styleName = $para.Style
        if ($styleName -match "Heading|标题") {
            $content += "</p>"
            $content += "<h2>$text</h2>"
            $content += "<p>"
        } else {
            $content += "$text</p>`n<p>"
        }
    }
    
    $doc.Close($false)
    
    # 组装内容
    $bodyContent = ($content -join "`n").Trim()
    if ($bodyContent.StartsWith("</p>")) {
        $bodyContent = $bodyContent.Substring(4)
    }
    if ($bodyContent.EndsWith("<p>")) {
        $bodyContent = $bodyContent.Substring(0, $bodyContent.Length - 3)
    }
    $bodyContent = "<p>" + $bodyContent + "</p>"
    
    # 读取模板
    $html = Get-Content -Path $TemplatePath -Raw -Encoding UTF8
    
    # 替换标题
    $html = $html -replace '<title>.*?</title>', "<title>$title - dRcLoD的博客</title>"
    $html = $html -replace '<h1 class="article-title".*?>.*?</h1>', "<h1 class="article-title">$title</h1>"
    
    # 替换日期
    $html = $html -replace '<span class="article-date".*?>.*?</span>', "<span class="article-date">$dateStr</span>"
    
    # 替换文章内容
    $html = $html -replace '<article class="article-content".*?>.*?</article>', "<article class="article-content">`n$bodyContent`n    </article>"
    
    # 输出文件
    $outputDir = Split-Path $OutputPath -Parent
    if ($outputDir -and -not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    $html | Out-File -FilePath $OutputPath -Encoding UTF8
    
    Write-Host "完成!" -ForegroundColor Green
    Write-Host "标题: $title" -ForegroundColor Yellow
    Write-Host "日期: $dateStr" -ForegroundColor Yellow
    Write-Host "输出: $OutputPath" -ForegroundColor Yellow
    
} finally {
    $word.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
}