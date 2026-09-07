# AI Hype Tycoon

Idle AI-startup tycoon. A living **3D campus** — tap a building, a sheet slides up, you open Chat, and money starts the same night.

## Play

Tap the bouncing Lab. Open Chat. Cash comes in. Ads, GPUs, and hires are how you scale. The tape never ends.

Progress autosaves on this device.

## Android

The APK **is** the 3D game (WebView of the same campus). Sideload the latest GitHub Release — not an older text-only build.

Package: `com.aihypetycoon.app`  
Version: auto-bumped from [`android/version.properties`](android/version.properties)  
Min SDK 26 · Target SDK 35

**Every commit to `main` bumps the patch version + `versionCode`, bundles the 3D game, builds a release APK and Play AAB, and publishes a GitHub Release.**

### GitHub Actions

| Workflow | What it produces |
| --- | --- |
| `.github/workflows/android.yml` | Auto-bump → 3D game bundle → **release APK** + AAB, GitHub Release `vX.Y.Z` |
| `.github/workflows/release-play.yml` | Signed Play AAB, manual dispatch |

If signing secrets are missing, the release APK/AAB is still produced, signed with the debug key. **Do not upload a debug-signed AAB to Play.** Sideload the APK from the GitHub Release instead.

### Upload key (required for Play)

Repository secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

### Local

```bash
npm install
npm run build:apk
cd android
gradle :app:assembleRelease
```

## Endings

- **Bankrupt** — runway stays red long enough
- **Indicted** — scandal and karma both run hot
- **Acquired** — optional. You can walk.

## Privacy

Single-player. Saves stay on device. No accounts, ads, or trackers. See [PRIVACY.md](PRIVACY.md).
