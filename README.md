# AI Hype Tycoon

Build an AI startup from a garage. Raise rounds, hire a crew, train models, ship a product, go public — and **keep playing**. The tape never ends.

Version **2.1** is a living HQ, not a wall of menus. Days run slower. Revenue comes from products, not a waitlist. IPO is a milestone, not a credits roll.

## Play

The web game is the live preview. Progress autosaves on this device. Engine and UI source: [`web/`](web/).

The Android app is a native Kotlin / Jetpack Compose port of the same tycoon.

## What 2.1 changed

- **HQ is the game.** Photo stages (garage → loft → office → warehouse → campus → tower), GPU racks, walking staff, room picker. Hire is a grid. Models are tiles. Rivals are bars.
- **Unlimited timeline.** Friends → pre-seed → seed → A/B/C → IPO → follow-ons. Listing does not end the run. You only stop if you go broke, get indicted, or take an acquisition.
- **Slower days.** ~3.4s per day at 1x (pause / 2x / 4x still there). First model trains in 8 days so the loop still bites.
- **Economy that is a company.** You start with one card. Train → demo → launch → users pay. Valuation is ARR × cycle multiple plus narrative. GPUs have lead time. Morale, rivals, and market cycles (winter / quiet / boom / mania) push back.
- **Fail states are earned.** 36 days insolvent, or scandal + karma hot enough for a docket. Acquisition is optional.

## Android (Google Play)

Package: `com.aihypetycoon.app`  
Version: auto-bumped from [`android/version.properties`](android/version.properties)  
Min SDK 26 · Target SDK 35 · Compose

**Every commit to `main` bumps the patch version + `versionCode`, builds a release APK and Play AAB, and publishes a GitHub Release.** PRs build without bumping. A follow-up `chore(release)` commit with `[skip ci]` writes the new version back to the repo so tags and Play uploads stay in lockstep.

### GitHub Actions

| Workflow | What it produces |
| --- | --- |
| `.github/workflows/android.yml` | Auto-bump → **release APK** + AAB on every `main` commit, GitHub Release tagged `vX.Y.Z` |
| `.github/workflows/release-play.yml` | Signed Play AAB, manual dispatch |

If signing secrets are missing, the release APK/AAB is still produced, signed with the debug key so CI stays green. **Do not upload a debug-signed AAB to Play.** Sideload the APK from the GitHub Release instead.

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

### Local Gradle

```bash
cd android
gradle :app:assembleRelease :app:bundleRelease
```

Version comes from `android/version.properties`, or override:

```bash
VERSION_CODE=12 VERSION_NAME=2.1.9 gradle :app:assembleRelease
```

APK: `android/app/build/outputs/apk/release/`  
AAB: `android/app/build/outputs/bundle/release/`

## Endings

- **Bankrupt** — runway stays red long enough
- **Indicted** — scandal and karma both run hot
- **Acquired** — optional. You can walk.

IPO, unicorn, a million users, a product that actually works — milestones. The company keeps going.

## Privacy

Single-player. Saves stay on device. No accounts, ads, or trackers. See [PRIVACY.md](PRIVACY.md).

## Store listing

Copy, screenshots notes, and content rating: [PLAY_STORE.md](PLAY_STORE.md).
