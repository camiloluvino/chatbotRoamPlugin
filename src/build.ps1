# Build script for Chatbot Roam Plugin
# Concatenates all source files into a single bundle

$version = "1.0.0"
$outputFile = "..\chatbot-roam-plugin.js"
$srcDir = "."

# Source files in order of dependencies
$sourceFiles = @(
    "patterns.js",
    "cleaners.js",
    "processing.js",
    "ui.js",
    "index.js"
)

# Header (simplified to avoid Roam conflicts)
$header = @"
// CHATBOT ROAM PLUGIN v$version
// Importador de conversaciones de chatbots (Claude, ChatGPT, Gemini) a Roam
// Uso: Ctrl+Shift+I o Command Palette
// Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

"@

# Build
Write-Host "Building Chatbot Roam Plugin v$version..." -ForegroundColor Cyan

$content = $header

foreach ($file in $sourceFiles) {
    $filePath = Join-Path $srcDir $file
    if (Test-Path $filePath) {
        Write-Host "  + $file" -ForegroundColor Green
        $content += "`n// --- $file ---`n"
        $content += Get-Content $filePath -Raw
        $content += "`n"
    }
    else {
        Write-Host "  ! Missing: $file" -ForegroundColor Red
    }
}

# Write output with proper UTF-8 encoding (no BOM)
$outputPath = Join-Path $srcDir $outputFile
$Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($outputPath, $content, $Utf8NoBomEncoding)

$size = (Get-Item $outputPath).Length / 1024
Write-Host "`nBuild complete!" -ForegroundColor Green
Write-Host "Output: $outputPath ($([math]::Round($size, 1)) KB)" -ForegroundColor Yellow
