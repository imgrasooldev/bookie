# Rebuild Bookie and install it on the connected Android phone, in one command.
#
#   cd apps/mobile
#   ./install-to-phone.ps1            # release build (what you ship/test)
#   ./install-to-phone.ps1 -Fast      # debug build (faster, for quick iteration)
#
# The app targets the live API by default (see lib/config.dart -> prodApiUrl),
# so it works over cellular / any network once installed.

param([switch]$Fast)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host 'Looking for a connected Android device...' -ForegroundColor Cyan
# Out-String joins the JSON before parsing — piping line-by-line breaks ConvertFrom-Json.
$device = (flutter devices --machine | Out-String | ConvertFrom-Json) |
  Where-Object { $_.targetPlatform -like 'android*' } | Select-Object -First 1

if (-not $device) {
  Write-Host 'No Android device found. Plug in your phone with USB debugging enabled (or start an emulator) and retry.' -ForegroundColor Red
  exit 1
}
Write-Host ("Target: {0}  ({1})" -f $device.name, $device.id) -ForegroundColor Green

$mode = if ($Fast) { '--debug' } else { '--release' }
Write-Host ("Building {0} APK..." -f $mode) -ForegroundColor Cyan
flutter build apk $mode

Write-Host 'Installing to device...' -ForegroundColor Cyan
flutter install $mode -d $device.id

Write-Host 'Done. Open the Bookie app on your phone.' -ForegroundColor Green
