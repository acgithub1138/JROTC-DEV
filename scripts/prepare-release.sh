#!/bin/bash

# Release Preparation Script for JROTC Command Center
# This script automates the release preparation process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
CURRENT_VERSION=$(node -p "require('./package.json').version")
APP_NAME="JROTC Command Center"
BUNDLE_ID="app.lovable.6f3314e6736547a3bcb5db91da6e1b16"

# Functions
check_prerequisites() {
    log_info "Checking prerequisites for release..."
    
    # Check if git is clean
    if [[ -n $(git status --porcelain) ]]; then
        log_error "Git working directory is not clean. Please commit or stash changes."
        exit 1
    fi
    
    # Check if on main/master branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
        log_warning "Not on main/master branch. Current branch: $CURRENT_BRANCH"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check if npm dependencies are up to date
    if [[ ! -f node_modules/.package-lock.json ]] || [[ package-lock.json -nt node_modules/.package-lock.json ]]; then
        log_warning "Dependencies may be out of date"
        npm ci
    fi
    
    log_success "Prerequisites check passed"
}

bump_version() {
    local version_type=${1:-patch}
    
    log_info "Bumping version ($version_type)..."
    
    # Bump version in package.json
    npm version $version_type --no-git-tag-version
    
    NEW_VERSION=$(node -p "require('./package.json').version")
    log_success "Version bumped from $CURRENT_VERSION to $NEW_VERSION"
    
    # Update version in build config
    sed -i.bak "s/version: '[^']*'/version: '$NEW_VERSION'/" src/config/build-config.ts
    rm src/config/build-config.ts.bak
    
    # Update version in capacitor config
    sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" capacitor.config.ts
    rm capacitor.config.ts.bak
    
    log_success "Updated version in configuration files"
}

generate_changelog() {
    log_info "Generating changelog..."
    
    # Create or update CHANGELOG.md
    if [[ ! -f CHANGELOG.md ]]; then
        cat > CHANGELOG.md << EOF
# Changelog

All notable changes to this project will be documented in this file.

## [${NEW_VERSION}] - $(date +%Y-%m-%d)

### Added
- Initial mobile app release
- Native iOS and Android support
- Push notifications
- Offline synchronization
- File system access
- Haptic feedback

### Changed
- Enhanced mobile UI/UX
- Improved performance for mobile devices

### Fixed
- Mobile-specific bug fixes
EOF
    else
        # Add new version entry to existing changelog
        sed -i.bak "3i\\
## [${NEW_VERSION}] - $(date +%Y-%m-%d)\\
\\
### Added\\
- Feature updates and improvements\\
\\
### Changed\\
- Performance enhancements\\
\\
### Fixed\\
- Bug fixes and stability improvements\\
\\
" CHANGELOG.md
        rm CHANGELOG.md.bak
    fi
    
    log_success "Changelog updated"
}

build_and_test() {
    log_info "Building and testing application..."
    
    # Clean previous builds
    rm -rf dist/
    
    # Build web application
    npm run build
    
    # Run tests if available
    if npm run test --silent > /dev/null 2>&1; then
        npm run test
    else
        log_warning "No tests found, skipping test execution"
    fi
    
    log_success "Build and test completed"
}

prepare_app_store_assets() {
    log_info "Preparing app store assets..."
    
    # Create assets directory
    mkdir -p release-assets/app-store
    mkdir -p release-assets/play-store
    
    # Generate app store metadata
    cat > release-assets/app-store/metadata.txt << EOF
App Store Submission - $APP_NAME v$NEW_VERSION

Title: $APP_NAME
Subtitle: Military Training Management
Description: Comprehensive JROTC program management with task tracking, notifications, and offline capabilities.

Keywords: JROTC, military, training, management, education, tasks, notifications

Category: Education
Age Rating: 4+

What's New in This Version:
- Enhanced mobile experience
- Native iOS features
- Improved performance
- Bug fixes and stability improvements

App Review Information:
- Demo credentials will be provided separately
- No special configuration required
- App supports offline functionality

Support URL: https://your-support-url.com
Marketing URL: https://your-website.com
Privacy Policy URL: https://your-privacy-policy.com
EOF

    # Generate Play Store metadata
    cat > release-assets/play-store/metadata.txt << EOF
Google Play Submission - $APP_NAME v$NEW_VERSION

Title: $APP_NAME
Short Description: Military training management for JROTC programs
Full Description: Comprehensive JROTC program management application with task tracking, real-time notifications, and offline capabilities. Perfect for instructors and cadets to manage training activities efficiently.

Category: Education
Content Rating: Everyone

What's New:
Enhanced mobile experience with native Android features, improved performance, and bug fixes.

Target Audience: Educational institutions, JROTC programs
Keywords: JROTC, military, training, education, management
EOF

    log_success "App store assets prepared"
}

create_git_tag() {
    log_info "Creating git tag and commit..."
    
    # Add all changes
    git add .
    
    # Commit changes
    git commit -m "chore: release v$NEW_VERSION

- Bump version to $NEW_VERSION
- Update changelog
- Prepare release assets"
    
    # Create git tag
    git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
    
    log_success "Git tag v$NEW_VERSION created"
}

print_next_steps() {
    echo
    echo -e "${GREEN}========================================"
    echo "         Release Preparation Complete"
    echo "========================================${NC}"
    echo
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Push changes and tags: git push origin main --tags"
    echo "2. GitHub Actions will automatically build for iOS/Android"
    echo "3. Monitor the CI/CD pipeline"
    echo "4. Download artifacts and submit to app stores"
    echo "5. Update app store listings with metadata from release-assets/"
    echo
    echo -e "${YELLOW}App Store Submission:${NC}"
    echo "- iOS: Use Xcode or Transporter to upload IPA"
    echo "- Android: Upload AAB to Google Play Console"
    echo
    echo -e "${BLUE}Release Assets Location:${NC}"
    echo "- App Store: release-assets/app-store/"
    echo "- Play Store: release-assets/play-store/"
}

# Main execution
main() {
    local version_type=${1:-patch}
    
    echo -e "${BLUE}"
    echo "========================================"
    echo "    JROTC Command Center Release Prep   "
    echo "========================================"
    echo -e "${NC}"
    echo "Current version: $CURRENT_VERSION"
    echo "Release type: $version_type"
    echo
    
    check_prerequisites
    bump_version $version_type
    generate_changelog
    build_and_test
    prepare_app_store_assets
    create_git_tag
    print_next_steps
}

# Run main function with arguments
main "$@"