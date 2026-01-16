# Building an APK for Your Expo App

## Method 1: EAS Build (Recommended - Cloud Build)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure EAS Build
```bash
cd mobile
eas build:configure
```

This will create an `eas.json` file. You can customize it if needed.

### Step 4: Build APK
```bash
# Build APK for Android
eas build --platform android --profile preview

# Or build AAB (for Play Store)
eas build --platform android --profile production
```

The build will run in the cloud and you'll get a download link when it's done.

---

## Method 2: Local Build (Requires Android Studio)

### Step 1: Install Dependencies
```bash
cd mobile
npm install
```

### Step 2: Prebuild Native Code
```bash
npx expo prebuild --platform android
```

### Step 3: Build APK Locally
```bash
# Using Gradle (requires Android Studio setup)
cd android
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

---

## Method 3: Development Build (For Testing)

### Step 1: Create Development Build
```bash
eas build --platform android --profile development
```

### Step 2: Install on Device
Download and install the APK on your Android device.

---

## Quick Start (EAS Build)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login:**
   ```bash
   eas login
   ```

3. **Configure:**
   ```bash
   cd mobile
   eas build:configure
   ```

4. **Build APK:**
   ```bash
   eas build --platform android --profile preview
   ```

The APK will be available for download from the Expo dashboard once the build completes (usually 10-20 minutes).

---

## Notes

- **EAS Build** is free for limited builds, then requires a subscription
- **Local builds** require Android Studio and Android SDK setup
- APK files from `preview` profile are suitable for testing
- AAB files from `production` profile are required for Google Play Store

