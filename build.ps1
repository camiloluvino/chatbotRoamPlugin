# Build script for Chatbot Roam Plugin
# La compilacion vive en scripts/build.js (Node); este archivo solo la llama
# Uso: .\build.ps1   (equivale a: node scripts/build.js)

$ErrorActionPreference = "Stop"
node (Join-Path $PSScriptRoot "scripts\build.js")
if ($LASTEXITCODE -ne 0) { throw "Build fallido" }
