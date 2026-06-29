# Android TWA

This app wraps `https://example.com/` as a Trusted Web Activity for Google Play.

## Debug Build

```bash
cd apps/android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
ANDROID_HOME="$HOME/Library/Android/sdk" \
./gradlew :app:assembleDebug
```

The debug APK is generated at:

```text
apps/android/app/build/outputs/apk/debug/app-debug.apk
```

## Release Signing

Create the release keystore outside the repo:

```bash
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore "$HOME/.android/app-template-release.keystore" \
  -alias app-template \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Then build the Play Store bundle:

```bash
cd apps/android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
ANDROID_HOME="$HOME/Library/Android/sdk" \
pnpm dlx @bubblewrap/cli build --manifest=twa-manifest.json
```

Bubblewrap will ask for the keystore password and produce a signed Android App Bundle.

## Digital Asset Links

The web app must publish Digital Asset Links for every certificate used to sign installed Android builds. The repo includes the Play App Signing certificate fingerprint and local debug certificate fingerprint in:

```text
apps/web/public/.well-known/assetlinks.json
```

That fixes Play Store builds and locally installed debug APKs after the web app is deployed.

If Play App Signing is disabled, use the release keystore certificate fingerprint instead:

```bash
keytool -list \
  -v \
  -keystore "$HOME/.android/app-template-release.keystore" \
  -alias app-template
```

The deployed URL must return the JSON at:

```text
https://example.com/.well-known/assetlinks.json
```
