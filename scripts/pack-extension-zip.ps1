param(
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$defaultOutput = Join-Path $repoRoot "NoMoreGoogleNews.zip"
$zipPath = if ($OutputPath) { $OutputPath } else { $defaultOutput }

if (Test-Path $zipPath) {
  Remove-Item -Path $zipPath -Force
}

$exclude = @(".git", ".idea", "secrets", "scripts")
$items = Get-ChildItem -Path $repoRoot -Force | Where-Object {
  $exclude -notcontains $_.Name
}

if ($items.Count -eq 0) {
  throw "No files found to package."
}

Compress-Archive -Path $items.FullName -DestinationPath $zipPath
Write-Host "Packed ZIP created at $zipPath"
