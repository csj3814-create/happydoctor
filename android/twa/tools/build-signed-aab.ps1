param(
  [string]$KeystorePath,
  [string]$Alias = 'android'
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($KeystorePath)) {
  $KeystorePath = Join-Path $projectRoot 'android.keystore'
}

if (-not (Test-Path -LiteralPath $KeystorePath -PathType Leaf)) {
  throw "Upload keystore not found. Run tools/create-upload-key.ps1 first: $KeystorePath"
}

$jarsigner = Get-Command jarsigner -ErrorAction Stop
$gradle = Join-Path $projectRoot 'gradlew.bat'
$unsignedBundle = Join-Path $projectRoot 'app\build\outputs\bundle\release\app-release.aab'
$signedBundle = Join-Path $projectRoot 'app\build\outputs\bundle\release\app-release-signed.aab'

& $gradle bundleRelease
if ($LASTEXITCODE -ne 0) {
  throw "Gradle failed with exit code $LASTEXITCODE."
}

if (-not (Test-Path -LiteralPath $unsignedBundle -PathType Leaf)) {
  throw "Unsigned release bundle was not created: $unsignedBundle"
}

Copy-Item -LiteralPath $unsignedBundle -Destination $signedBundle -Force

Write-Output 'Jarsigner will ask for the upload-keystore password. The password is not saved by this script.'
& $jarsigner.Source `
  -keystore $KeystorePath `
  -sigalg SHA256withRSA `
  -digestalg SHA-256 `
  $signedBundle `
  $Alias

if ($LASTEXITCODE -ne 0) {
  throw "jarsigner failed with exit code $LASTEXITCODE."
}

& $jarsigner.Source -verify -verbose -certs $signedBundle
if ($LASTEXITCODE -ne 0) {
  throw "Signed bundle verification failed with exit code $LASTEXITCODE."
}

Write-Output "signed-aab: $signedBundle"
