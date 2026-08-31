param(
  [int]$WebPort = 3018,
  [int]$EnginePort = 8020
)

$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $root 'engine\.venv\Scripts\python.exe'

if (-not (Test-Path $python)) {
  throw 'Python engine is not installed. Run the setup steps in engine/README.md first.'
}

Start-Process -FilePath $python -ArgumentList '-m', 'uvicorn', 'engine.app.main:app', '--host', '127.0.0.1', '--port', $EnginePort -WorkingDirectory $root -WindowStyle Hidden
Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev', '--', '--port', $WebPort -WorkingDirectory $root -WindowStyle Hidden

Write-Host "SYNTH web lab: http://127.0.0.1:$WebPort"
Write-Host "SYNTH Python engine: http://127.0.0.1:$EnginePort/docs"
