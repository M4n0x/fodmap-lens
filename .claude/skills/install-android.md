---
name: install-android
description: Build a release APK with Gradle and install it on the connected Android device. No Expo, no Metro — fully standalone.
---

# Install on Android

Build and install a standalone release APK on the connected Android device.

## Steps

1. **Verify device is connected:**
   ```
   adb devices
   ```
   Confirm a device shows as `device` (not `unauthorized` or empty).

2. **Build release APK with Gradle:**
   ```
   cd <project-root>/android && ./gradlew assembleRelease
   ```
   Wait for `BUILD SUCCESSFUL`.

3. **Install on device:**
   ```
   adb install -r <project-root>/android/app/build/outputs/apk/release/app-release.apk
   ```
   Confirm `Success`.

## Important

- Do NOT use `expo start`, `expo run:android`, or `eas build`.
- Do NOT start Metro bundler — the release APK bundles JS.
- If the build fails on signing, check `android/app/build.gradle` for signing config.
