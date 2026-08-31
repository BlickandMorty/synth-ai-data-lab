param(
  [switch]$InstallWeb = $true,
  [switch]$InstallPython = $true
)

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($InstallWeb) {
  npm ci
}

if ($InstallPython) {
  if (-not (Test-Path 'engine\.venv\Scripts\python.exe')) {
    python -m venv engine\.venv
  }
  .\engine\.venv\Scripts\python.exe -m pip install --upgrade pip
  .\engine\.venv\Scripts\python.exe -m pip install -r engine\requirements.txt
}

Write-Host 'SYNTH setup complete. Start the lab with: .\scripts\start-synth.ps1'
