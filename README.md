# AI Hype Tycoon

Build an AI startup from a garage. Raise rounds, hire researchers, train models, ship hype demos, survive GPU shortages and alignment PR, and go public while the product barely works.

You can play it straight — or go full evil: steal papers, fake benchmarks, farm a waitlist of bots, pivot every quarter.

## Play

The web game is the live preview. Progress autosaves in the browser. Engine and UI source: [`web/`](web/).

The Android app is a native Kotlin / Jetpack Compose port of the same tycoon, ready for Google Play.

## Android (Google Play)

Package: `com.aihypetycoon.app`  
Min SDK 26 · Target SDK 35 · Compose

CI builds a **debug APK** (sideload) and a **release AAB** (Play Console) on every push to `main`.

### GitHub Actions

| Workflow | What it produces |
| --- | --- |
| `.github/workflows/android.yml` | Debug APK + release AAB on push / PR |
| `.github/workflows/release-play.yml` | Signed Play AAB, manual dispatch |

If signing secrets are missing, the release AAB is still produced, signed with the debug key so CI stays green. **Do not upload a debug-signed AAB to Play.**

### Upload key (required for Play)

Generate a keystore once and add these repository secrets:

- `ANDROID_KEYSTORE_BASE64` — `base64 -w0 upload-keystore.jks`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

```bash
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
base64 -w0 upload-keystore.jks > upload-keystore.b64
```

Keep the jks offline. Google Play App Signing will hold the distribution cert; this is your **upload** key.

Then run **Signed Play AAB** from the Actions tab and download the artifact for Play Console.

### Local Gradle

```bash
cd android
gradle :app:assembleDebug :app:bundleRelease
```

APK: `android/app/build/outputs/apk/debug/`  
AAB: `android/app/build/outputs/bundle/release/`

## Endings

- **IPO** — hype and valuation hold; the demo can still crash
- **Acquired** — a giant folds you into a tooltip
- **Useful product** — rare, quiet, actually works
- **Bankrupt** — runway hits zero
- **Indicted** — scandal and karma both run hot
- **National lab** — a seal, not a series

## Privacy

Single-player. Saves stay on device. No accounts, ads, or trackers. See [PRIVACY.md](PRIVACY.md).

## Store listing

Copy, screenshots notes, and content rating: [PLAY_STORE.md](PLAY_STORE.md).
