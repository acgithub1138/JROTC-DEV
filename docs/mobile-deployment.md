# Mobile Deployment Guide

## JROTC Command Center - Mobile App Deployment

This guide covers the complete process of building, testing, and deploying the JROTC Command Center mobile application for iOS and Android platforms.

## Prerequisites

### General Requirements
- Node.js 18+ and npm
- Git with repository access
- Capacitor CLI (`npm install -g @capacitor/cli`)

### iOS Development
- macOS with Xcode 14+
- iOS Developer Account ($99/year)
- Valid provisioning profiles and certificates

### Android Development
- Android Studio with Android SDK
- Java Development Kit (JDK) 17+
- Android Developer Account ($25 one-time fee)

## Quick Start

### 1. Clone and Setup
```bash
# Clone your repository
git clone <your-repo-url>
cd jrotc-command-center

# Install dependencies
npm install

# Build web app
npm run build

# Initialize mobile platforms
npx cap add ios
npx cap add android
npx cap sync
```

### 2. Platform-Specific Build

#### iOS Build
```bash
# Open in Xcode
npx cap open ios

# Or use the build script
chmod +x scripts/build-mobile.sh
./scripts/build-mobile.sh ios
```

#### Android Build
```bash
# Open in Android Studio
npx cap open android

# Or use the build script
./scripts/build-mobile.sh android
```

## Configuration

### App Configuration
- **App ID**: `app.lovable.6f3314e6736547a3bcb5db91da6e1b16`
- **App Name**: JROTC Command Center
- **Version**: 1.0.0
- **Minimum iOS**: 13.0
- **Minimum Android**: API 24 (Android 7.0)

### Environment Variables
Create `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ENVIRONMENT=production
```

## Features & Permissions

### Core Features
- ✅ Authentication & User Management
- ✅ Task & Assignment Management
- ✅ Real-time Notifications
- ✅ Camera Integration
- ✅ Offline Synchronization
- ✅ File Management
- ✅ Haptic Feedback

### Required Permissions

#### iOS (Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to capture incident photos and documentation.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs photo library access to attach images to reports.</string>
<key>NSUserNotificationsUsageDescription</key>
<string>This app sends notifications for task assignments and important updates.</string>
```

#### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
```

## Testing

### Device Testing
1. **iOS Simulator**: Test basic functionality and UI
2. **Android Emulator**: Test Android-specific features
3. **Physical Devices**: Test camera, notifications, haptics

### Testing Checklist
- [ ] App launches successfully
- [ ] Authentication flow works
- [ ] Camera captures photos
- [ ] Push notifications receive
- [ ] Offline mode functions
- [ ] File uploads/downloads work
- [ ] Haptic feedback responds
- [ ] Network detection works

## App Store Preparation

### App Store Assets Required

#### iOS App Store
- App Icon (1024x1024 PNG)
- Screenshots (iPhone 6.7", 6.5", 5.5")
- Screenshots (iPad 12.9", 11")
- App Preview videos (optional)

#### Google Play Store
- App Icon (512x512 PNG)
- Feature Graphic (1024x500 PNG)
- Screenshots (phone & tablet)
- Store listing details

### Metadata
- **Title**: JROTC Command Center
- **Subtitle**: Military Training Management
- **Description**: Comprehensive JROTC program management with task tracking, notifications, and offline capabilities.
- **Keywords**: JROTC, military, training, management, education
- **Category**: Education
- **Age Rating**: 4+ (iOS) / Everyone (Android)

## Deployment Process

### iOS Deployment
1. Archive app in Xcode
2. Upload to App Store Connect
3. Complete app review information
4. Submit for review
5. Release after approval

### Android Deployment
1. Generate signed APK/AAB
2. Upload to Google Play Console
3. Complete store listing
4. Submit for review
5. Release to production

## Maintenance

### Updates
- Use Semantic Versioning (1.0.0 → 1.0.1)
- Update build numbers for each submission
- Test thoroughly before each release

### Monitoring
- Monitor crash reports (Crashlytics)
- Track user analytics
- Monitor app store reviews
- Watch performance metrics

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clean and rebuild
npx cap clean
npm run build
npx cap sync
```

#### iOS Certificate Issues
- Verify provisioning profiles
- Check certificate expiration
- Update Xcode if needed

#### Android Signing Issues
- Generate new keystore if needed
- Verify signing configuration
- Check Gradle configuration

### Support Resources
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Developer Portal](https://developer.apple.com)
- [Google Play Console](https://play.google.com/console)

## Security Considerations

### Data Protection
- All sensitive data encrypted
- Secure API communication (HTTPS)
- Proper session management
- Regular security updates

### Privacy Compliance
- COPPA compliant (educational app)
- Clear privacy policy
- Minimal data collection
- User consent for permissions

---

**Support**: For deployment assistance, contact the development team or refer to the documentation links above.