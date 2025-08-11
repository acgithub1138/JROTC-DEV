# Production Deployment Guide

## JROTC Command Center - Production Release Process

This guide covers the complete production deployment workflow for the JROTC Command Center mobile application.

## 🚀 Quick Release Process

### 1. Prepare Release
```bash
# Run the automated release preparation script
chmod +x scripts/prepare-release.sh
./scripts/prepare-release.sh [patch|minor|major]

# Example for patch release (1.0.0 → 1.0.1)
./scripts/prepare-release.sh patch
```

### 2. Deploy via CI/CD
```bash
# Push changes and trigger deployment
git push origin main --tags

# Monitor deployment
# GitHub Actions will automatically:
# - Build web application
# - Create iOS/Android apps
# - Run tests and validations
# - Deploy to app stores (if tagged)
```

## 📋 Release Types

### Patch Release (1.0.0 → 1.0.1)
- Bug fixes
- Minor improvements
- Security patches
```bash
./scripts/prepare-release.sh patch
```

### Minor Release (1.0.0 → 1.1.0)
- New features
- Enhancements
- Non-breaking changes
```bash
./scripts/prepare-release.sh minor
```

### Major Release (1.0.0 → 2.0.0)
- Breaking changes
- Major new features
- Architectural changes
```bash
./scripts/prepare-release.sh major
```

## 🏗️ CI/CD Pipeline

### GitHub Actions Workflow
The `.github/workflows/mobile-build.yml` workflow handles:

1. **Web Build** (Ubuntu)
   - Install dependencies
   - Build React application
   - Upload build artifacts

2. **iOS Build** (macOS)
   - Setup Xcode environment
   - Add iOS platform
   - Build and archive
   - Export IPA file
   - Upload to TestFlight (on tag)

3. **Android Build** (Ubuntu)
   - Setup Android SDK
   - Add Android platform
   - Build AAB file
   - Sign release
   - Upload to Google Play (on tag)

### Required Secrets

Configure these secrets in GitHub repository settings:

#### iOS Deployment
```
APPSTORE_ISSUER_ID=your_issuer_id
APPSTORE_API_KEY_ID=your_api_key_id
APPSTORE_API_PRIVATE_KEY=your_private_key
```

#### Android Deployment
```
ANDROID_SIGNING_KEY=base64_encoded_keystore
ANDROID_KEY_ALIAS=your_key_alias
ANDROID_KEYSTORE_PASSWORD=your_keystore_password
ANDROID_KEY_PASSWORD=your_key_password
GOOGLE_PLAY_SERVICE_ACCOUNT=service_account_json
```

#### Supabase Configuration
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 App Store Submission

### iOS App Store

1. **Automatic Upload** (via CI/CD)
   - Builds are automatically uploaded to TestFlight
   - Internal testing available immediately
   - External testing requires approval

2. **Manual Process**
   - Download IPA from GitHub Actions artifacts
   - Use Xcode or Transporter to upload
   - Complete app review information in App Store Connect

3. **App Store Metadata**
   ```
   Title: JROTC Command Center
   Subtitle: Military Training Management
   Category: Education
   Age Rating: 4+
   Keywords: JROTC, military, training, management, education
   ```

### Google Play Store

1. **Automatic Upload** (via CI/CD)
   - AAB files uploaded to Internal Testing track
   - Can be promoted to production

2. **Manual Process**
   - Download AAB from GitHub Actions artifacts
   - Upload to Google Play Console
   - Complete store listing information

3. **Play Store Metadata**
   ```
   Title: JROTC Command Center
   Short Description: Military training management for JROTC programs
   Category: Education
   Content Rating: Everyone
   ```

## 🔧 Environment Configuration

### Production Environment Variables
```env
VITE_ENVIRONMENT=production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

### Capacitor Configuration
```typescript
// capacitor.config.ts
{
  appId: 'app.lovable.6f3314e6736547a3bcb5db91da6e1b16',
  appName: 'JROTC Command Center',
  webDir: 'dist',
  server: {
    // Remove URL for production builds
    // url: 'https://...' // Only for development
  }
}
```

## 📊 Monitoring & Analytics

### Release Monitoring
- **GitHub Actions**: Monitor build status and deployment
- **App Store Connect**: Track app review status and crashes
- **Google Play Console**: Monitor release rollout and user feedback
- **Supabase**: Monitor API usage and performance

### Update Management
The app includes automatic update checking:
- **Web**: Service Worker cache updates
- **iOS**: App Store update notifications
- **Android**: In-app update prompts

### User Analytics
- App usage statistics
- Feature adoption rates
- Crash reporting and diagnostics
- Performance monitoring

## 🚨 Rollback Procedures

### Emergency Rollback
1. **App Stores**: Revert to previous version
2. **Web**: Deploy previous build
3. **Database**: Run migration rollback if needed

### Hotfix Process
1. Create hotfix branch from production tag
2. Apply minimal fix
3. Test thoroughly
4. Release as patch version
5. Merge back to main branch

## 📚 Release Checklist

### Pre-Release
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Version numbers updated
- [ ] Changelog generated
- [ ] App store assets prepared

### Release
- [ ] Tag created and pushed
- [ ] CI/CD pipeline successful
- [ ] Apps uploaded to stores
- [ ] Store listings updated
- [ ] Release notes published

### Post-Release
- [ ] Monitor for crashes/issues
- [ ] Check user feedback
- [ ] Verify analytics data
- [ ] Plan next release cycle

## 🆘 Troubleshooting

### Common Build Issues

#### iOS Build Failures
```bash
# Certificate/provisioning issues
# - Check Apple Developer account
# - Verify provisioning profiles
# - Update Xcode if needed
```

#### Android Build Failures
```bash
# Signing issues
# - Verify keystore configuration
# - Check Gradle build settings
# - Ensure SDK versions match
```

### Deployment Issues

#### App Store Rejection
- Review App Store Guidelines
- Address specific feedback
- Test on physical devices
- Ensure metadata compliance

#### Google Play Rejection
- Check policy compliance
- Verify target SDK version
- Test on various devices
- Complete all required fields

## 📞 Support

For deployment assistance:
- Review GitHub Actions logs
- Check app store feedback
- Consult Capacitor documentation
- Contact development team

---

**Note**: Always test releases in staging environment before production deployment.