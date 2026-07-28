param(
  [string]$KeystorePath,
  [string]$Alias = 'android'
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($KeystorePath)) {
  $KeystorePath = Join-Path $projectRoot 'android.keystore'
}

$keytool = Get-Command keytool -ErrorAction Stop
$keystoreParent = Split-Path -Parent $KeystorePath

if (-not (Test-Path -LiteralPath $keystoreParent -PathType Container)) {
  throw "Keystore parent directory does not exist: $keystoreParent"
}

if (Test-Path -LiteralPath $KeystorePath) {
  throw "Refusing to overwrite an existing keystore: $KeystorePath"
}

Write-Output 'Keytool will ask for a new keystore password. Store it in a password manager; it is not saved by this script.'
& $keytool.Source `
  -genkeypair `
  -v `
  -keystore $KeystorePath `
  -alias $Alias `
  -keyalg RSA `
  -keysize 4096 `
  -validity 10000 `
  -dname 'CN=Happy Doctor, OU=Mobile, O=Happy Doctor, L=Seoul, ST=Seoul, C=KR'

if ($LASTEXITCODE -ne 0) {
  throw "keytool failed with exit code $LASTEXITCODE."
}

Write-Output "upload-key-created: $KeystorePath"
Write-Output 'Back up the keystore and its password in separate secure locations before uploading an app.'
