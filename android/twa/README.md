# Happy Doctor Android TWA

This project wraps `https://app.happydoctor.kr` as an Android Trusted Web Activity.

- Package ID: `kr.happydoctor.app` (final availability must be confirmed by Play Console)
- `compileSdkVersion`: 36
- `targetSdkVersion`: 36
- `minSdkVersion`: 26
- Bubblewrap CLI: 1.24.1
- Android Browser Helper: 2.6.2
- Notifications, Play Billing, ads, and geolocation: disabled

## Verify and build

```powershell
npm ci
npm run verify:target-sdk
.\gradlew.bat bundleRelease
```

The Gradle command produces an unsigned release bundle. Do not commit signing keys,
passwords, APKs, or AABs. To create an upload key without placing a password in the
repository or command line, run the interactive scripts locally:

```powershell
.\tools\create-upload-key.ps1
.\tools\build-signed-aab.ps1
```

`keytool` and `jarsigner` prompt for the password directly. Store the password in a
password manager and keep offline backups of both the keystore and recovery details.
The signed output is `app/build/outputs/bundle/release/app-release-signed.aab` and is
ignored by Git.

For local TWA verification, the upload-key SHA-256 can be used in Digital Asset Links.
For the Google Play build, `assetlinks.template.json` must include the **Play App
Signing** certificate SHA-256 shown in Play Console. Replace every retained placeholder
with a real fingerprint and remove any unused placeholder before publishing the valid
JSON at:

`https://app.happydoctor.kr/.well-known/assetlinks.json`

Run `npm run verify:target-sdk` after every `bubblewrap update`, because Bubblewrap
1.24.1 currently regenerates `targetSdkVersion 35` unless corrected.
