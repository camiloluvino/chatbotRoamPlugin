# Build script for Chatbot Roam Plugin
# Concatenates all source files into a single bundle

$ErrorActionPreference = "Stop"

$version = "1.3.4"
$srcDir = $PSScriptRoot
$outputFile = Join-Path $srcDir "..\chatbot-roam-plugin.js"

# Source files in order of dependencies
$sourceFiles = @(
    "patterns.js",
    "cleaners.js",
    "opciones-limpieza.js",
    "formatter.js",
    "processing.js",
    "styles.js",
    "roam\parser.js",
    "roam\inserter.js",
    "ui.js",
    "index.js"
)

# Header
$header = @"
// CHATBOT ROAM PLUGIN v$version
// Importador de conversaciones de chatbots (Claude, ChatGPT, Gemini) a Roam
// Uso: Ctrl+Shift+I o Command Palette
// Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

"@

Write-Host "Building Chatbot Roam Plugin v$version..." -ForegroundColor Cyan

# Build content
$contentBuilder = New-Object System.Text.StringBuilder
[void]$contentBuilder.Append($header)

foreach ($file in $sourceFiles) {
    $filePath = Join-Path $srcDir $file
    if (Test-Path $filePath) {
        Write-Host "  + $file" -ForegroundColor Green
        [void]$contentBuilder.AppendLine()
        [void]$contentBuilder.AppendLine("// --- $file ---")
        $fileContent = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
        [void]$contentBuilder.Append($fileContent)
        [void]$contentBuilder.AppendLine()
    }
    else {
        Write-Host "  ! Missing: $file" -ForegroundColor Red
        throw "Missing file: $file"
    }
}

# Write output with UTF-8 NO BOM
$finalContent = $contentBuilder.ToString()
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($outputFile, $finalContent, $Utf8NoBom)

$size = (Get-Item $outputFile).Length / 1024
Write-Host ""
Write-Host "Build complete!" -ForegroundColor Green
Write-Host "Output: $outputFile ($([math]::Round($size, 1)) KB)" -ForegroundColor Yellow
Write-Host "Lines: $($finalContent.Split("`n").Count)" -ForegroundColor Gray
