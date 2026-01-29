param(
  [string]$ChromePath
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$extensionPath = $repoRoot.Path
$keyPath = Join-Path $repoRoot "secrets\\NoMoreGoogleNews.pem"

if (!(Test-Path $keyPath)) {
  throw "Missing key: $keyPath"
}

if (-not $ChromePath) {
  $candidates = @(
    "$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe",
    "$env:ProgramFiles(x86)\\Google\\Chrome\\Application\\chrome.exe",
    "$env:LocalAppData\\Google\\Chrome\\Application\\chrome.exe"
  )
  $ChromePath = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

if (-not $ChromePath -or !(Test-Path $ChromePath)) {
  throw "Chrome executable not found. Pass -ChromePath 'C:\\Path\\to\\chrome.exe'."
}

Write-Host "Packing extension from $extensionPath using key $keyPath"
Start-Process -FilePath $ChromePath -ArgumentList @(
  "--pack-extension=$extensionPath",
  "--pack-extension-key=$keyPath"
) -Wait

$packedCrx = Join-Path (Split-Path $extensionPath -Parent) ("$(Split-Path $extensionPath -Leaf).crx")
if (Test-Path $packedCrx) {
  $destCrx = Join-Path $repoRoot "secrets\\NoMoreGoogleNews.crx"
  Copy-Item -Path $packedCrx -Destination $destCrx -Force
  Write-Host "Packed CRX copied to $destCrx"
  Write-Host "Chrome also left a copy at $packedCrx"
} else {
  Write-Host "No CRX found at $packedCrx. Chrome may have failed to pack the extension."
}
