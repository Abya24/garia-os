# Garia OS v1.6 - Android Trusted Web Activity (TWA) Package

This directory contains the standalone Android packaging configuration for **Garia OS v1.6** using Trusted Web Activity (TWA).

## Package Details
- **App Name:** Garia OS
- **Package ID:** `com.gariaos.app`
- **Version Name:** `1.6.0`
- **Version Code:** `1`
- **Target SDK:** 36
- **Minimum SDK:** 21
- **Orientation:** Portrait
- **Production URL:** `https://ais-pre-v7vcv6eevdr5eg5w3uyx6h-727347822999.asia-southeast1.run.app/`

---

## Building the Release AAB (Android App Bundle)

### Option A: Using Bubblewrap CLI (Recommended)
1. Install Node.js & Java 17+.
2. Install Bubblewrap CLI:
   ```bash
   npm install -g @bubblewrap/cli
   ```
3. Navigate to this directory and build:
   ```bash
   bubblewrap build
   ```

### Option B: Using Android Studio / Gradle
1. Open the `/android` folder in Android Studio.
2. Generate your production Keystore (if not already created):
   - **Build > Generate Signed Bundle / APK...**
   - Choose **Android App Bundle (.aab)**
   - Create or select your keystore file.
3. Extract your signing SHA-256 fingerprint:
   ```bash
   keytool -list -v -keystore my-release-key.jks -alias my-alias
   ```
4. Build the release bundle via command line:
   ```bash
   ./gradlew bundleRelease
   ```
   The generated `.aab` file will be located at:
   `app/build/outputs/bundle/release/app-release.aab`

---

## Digital Asset Links Setup (`.well-known/assetlinks.json`)
To remove the URL address bar when running inside the TWA app, host the following file at:
`https://ais-pre-v7vcv6eevdr5eg5w3uyx6h-727347822999.asia-southeast1.run.app/.well-known/assetlinks.json`

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.gariaos.app",
    "sha256_cert_fingerprints": [
      "<YOUR_ACTUAL_RELEASE_KEY_SHA256_FINGERPRINT>"
    ]
  }
}]
```
*Note: Replace `<YOUR_ACTUAL_RELEASE_KEY_SHA256_FINGERPRINT>` with the actual SHA-256 fingerprint generated from your keystore or Google Play App Signing console.*
