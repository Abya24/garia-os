# Garia OS v2.4.0 — Android Release Build & Deployment Guide

## Overview
Garia OS is configured as a native Android Trusted Web Activity (TWA) application package with complete branding, profile isolation, and offline PWA capabilities.

- **App Name:** Garia OS
- **Package ID:** `com.gariaos.app`
- **Version Name:** `2.4.0`
- **Version Code:** `7`
- **Launcher Icon:** Official Garia OS logo (`@mipmap/ic_launcher` and `@mipmap/ic_launcher_round`)

---

## 1. Cloud APK Build via GitHub Actions (Recommended)

This project includes an automated GitHub Actions CI/CD pipeline in `.github/workflows/build-apk.yml`.

### How to trigger the APK build on GitHub:
1. Push this repository to **GitHub**.
2. Go to the **Actions** tab in your GitHub repository.
3. Select **Build Garia OS Android APK** workflow.
4. Click **Run workflow** (or simply push to `main`/`master` branch).
5. Once complete (approx 2–3 minutes), download the generated artifact:
   **`Garia_OS_v2.4.0_Release_APK`**

The generated APK artifact will be located in:
`android/app/build/outputs/apk/release/`

---

## 2. Local Android APK Build Instructions

If you have JDK 17 and Android SDK installed on your local machine:

```bash
# 1. Navigate to the android directory
cd android

# 2. Make gradlew executable (macOS / Linux)
chmod +x gradlew

# 3. Build release APK
./gradlew assembleRelease
```

Output binary path:
`android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 3. How to Sign the APK for Android Installation / Play Store

To install directly on Android devices or publish to Google Play:

```bash
# Generate a release keystore if you don't have one
keytool -genkey -v -keystore garia-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias gariaos

# Align the APK
zipalign -v -p 4 app-release-unsigned.apk Garia_OS_v2.4.0_Aligned.apk

# Sign the APK using apksigner (from Android SDK build-tools)
apksigner sign --ks garia-release-key.jks --out Garia_OS_v2.4.0_Signed.apk Garia_OS_v2.4.0_Aligned.apk
```

---

## 4. Android Device Installation
1. Transfer `Garia_OS_v2.4.0_Signed.apk` (or debug build) to your Android phone.
2. Enable **"Install from unknown sources"** in Android Settings if prompted.
3. Tap the file to install Garia OS v2.4.0 with full offline support and Abya AI access.
