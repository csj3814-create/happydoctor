$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$buildFile = Join-Path $projectRoot 'app\build.gradle'
$manifestFile = Join-Path $projectRoot 'twa-manifest.json'
$androidManifestFile = Join-Path $projectRoot 'app\src\main\AndroidManifest.xml'

$buildText = Get-Content -LiteralPath $buildFile -Raw -Encoding UTF8
$manifest = Get-Content -LiteralPath $manifestFile -Raw -Encoding UTF8 | ConvertFrom-Json
$androidManifestText = Get-Content -LiteralPath $androidManifestFile -Raw -Encoding UTF8

if ($buildText -notmatch 'compileSdkVersion\s+36') {
  throw 'compileSdkVersion must be 36.'
}

if ($buildText -notmatch 'targetSdkVersion\s+36') {
  throw 'targetSdkVersion must be 36.'
}

if ($buildText -notmatch 'minSdkVersion\s+26') {
  throw 'minSdkVersion must be 26.'
}

if ($manifest.packageId -ne 'kr.happydoctor.app') {
  throw 'Unexpected Android package ID.'
}

if ($manifest.enableNotifications -ne $false) {
  throw 'Notification delegation must stay disabled.'
}

if ($androidManifestText -match 'POST_NOTIFICATIONS') {
  throw 'POST_NOTIFICATIONS must not be declared.'
}

Write-Output 'twa-sdk-config-ok'
