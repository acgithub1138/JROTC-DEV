#!/bin/bash

# Mobile Build Script for JROTC Command Center
# This script handles building the app for iOS and Android platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="JROTC Command Center"
BUNDLE_ID="app.lovable.6f3314e6736547a3bcb5db91da6e1b16"
VERSION="1.0.0"
BUILD_NUMBER="1"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check if Capacitor is installed
    if ! npx cap --version &> /dev/null; then
        log_error "Capacitor CLI is not installed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    npm install
    log_success "Dependencies installed"
}

# Build web app
build_web() {
    log_info "Building web application..."
    npm run build
    log_success "Web application built successfully"
}

# Sync with Capacitor
sync_capacitor() {
    log_info "Syncing with Capacitor..."
    npx cap sync
    log_success "Capacitor sync completed"
}

# Add platforms if not already added
add_platforms() {
    local platform=$1
    
    if [ ! -d "$platform" ]; then
        log_info "Adding $platform platform..."
        npx cap add $platform
        log_success "$platform platform added"
    else
        log_info "$platform platform already exists"
    fi
}

# Update platform
update_platform() {
    local platform=$1
    log_info "Updating $platform platform..."
    npx cap update $platform
    log_success "$platform platform updated"
}

# Build for iOS
build_ios() {
    log_info "Building for iOS..."
    
    # Check if running on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "iOS builds require macOS"
        return 1
    fi
    
    # Check if Xcode is installed
    if ! command -v xcodebuild &> /dev/null; then
        log_error "Xcode is not installed"
        return 1
    fi
    
    add_platforms "ios"
    update_platform "ios"
    
    log_info "Opening Xcode project..."
    npx cap open ios
    
    log_success "iOS project opened in Xcode"
    log_info "Complete the build process in Xcode:"
    log_info "1. Select your development team"
    log_info "2. Choose target device/simulator"
    log_info "3. Build and run (Cmd+R)"
}

# Build for Android
build_android() {
    log_info "Building for Android..."
    
    # Check if Android Studio is configured
    if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
        log_warning "ANDROID_HOME or ANDROID_SDK_ROOT not set"
        log_info "Please ensure Android Studio is properly configured"
    fi
    
    add_platforms "android"
    update_platform "android"
    
    log_info "Opening Android Studio project..."
    npx cap open android
    
    log_success "Android project opened in Android Studio"
    log_info "Complete the build process in Android Studio:"
    log_info "1. Sync Gradle files"
    log_info "2. Choose target device/emulator"
    log_info "3. Build and run (Shift+F10)"
}

# Generate app icons and splash screens
generate_assets() {
    log_info "Generating app assets..."
    
    # Create assets directory if it doesn't exist
    mkdir -p resources/icon
    mkdir -p resources/splash
    
    log_warning "Asset generation requires manual setup:"
    log_info "1. Add icon.png (1024x1024) to resources/icon/"
    log_info "2. Add splash.png (2732x2732) to resources/splash/"
    log_info "3. Run: npx @capacitor/assets generate"
}

# Main execution
main() {
    local platform=${1:-"both"}
    
    echo -e "${BLUE}"
    echo "========================================"
    echo "  JROTC Command Center Mobile Build    "
    echo "========================================"
    echo -e "${NC}"
    
    check_prerequisites
    install_dependencies
    build_web
    sync_capacitor
    
    case $platform in
        "ios")
            build_ios
            ;;
        "android")
            build_android
            ;;
        "both")
            build_ios
            build_android
            ;;
        "assets")
            generate_assets
            ;;
        *)
            log_error "Invalid platform: $platform"
            log_info "Usage: $0 [ios|android|both|assets]"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}"
    echo "========================================"
    echo "         Build Process Complete        "
    echo "========================================"
    echo -e "${NC}"
}

# Run main function with all arguments
main "$@"