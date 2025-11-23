#!/bin/bash

# WaveSwap Build Script
# This script builds all packages and applications in the WaveSwap monorepo

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        print_success "$1"
    else
        print_error "$1 failed"
        exit 1
    fi
}

# Clean build artifacts
clean() {
    print_status "Cleaning build artifacts..."

    # Clean packages
    rm -rf packages/ui/dist
    rm -rf packages/sdk/dist
    rm -rf packages/programs/target

    # Clean apps
    rm -rf apps/web/.next
    rm -rf apps/backend/dist
    rm -rf apps/docs/build

    # Clean root
    rm -rf node_modules/.cache

    print_success "Build artifacts cleaned"
}

# Build packages
build_packages() {
    print_status "Building packages..."

    # Build UI package
    print_status "Building @waveswap/ui..."
    cd packages/ui
    bun run build
    check_status "@waveswap/ui build"
    cd ../..

    # Build SDK package
    print_status "Building @waveswap/sdk..."
    cd packages/sdk
    bun run build
    check_status "@waveswap/sdk build"
    cd ../..

    # Build Solana programs
    print_status "Building Solana programs..."
    cd packages/programs
    bun run anchor:build
    check_status "Solana programs build"
    cd ../..

    print_success "All packages built successfully"
}

# Build applications
build_apps() {
    print_status "Building applications..."

    # Build web app
    print_status "Building web application..."
    cd apps/web
    bun run build
    check_status "Web application build"
    cd ../..

    # Build backend
    print_status "Building backend..."
    cd apps/backend
    bun run build
    check_status "Backend build"
    cd ../..

    # Build documentation
    print_status "Building documentation..."
    cd apps/docs
    bun run build
    check_status "Documentation build"
    cd ../..

    print_success "All applications built successfully"
}

# Build Docker images
build_docker() {
    print_status "Building Docker images..."

    if command -v docker &> /dev/null; then
        # Build web app Docker image
        print_status "Building web app Docker image..."
        docker build -t waveswap/web:latest ./apps/web
        check_status "Web app Docker image build"

        # Build backend Docker image
        print_status "Building backend Docker image..."
        docker build -t waveswap/backend:latest ./apps/backend
        check_status "Backend Docker image build"

        # Build documentation Docker image
        print_status "Building documentation Docker image..."
        docker build -t waveswap/docs:latest ./apps/docs
        check_status "Documentation Docker image build"

        print_success "All Docker images built successfully"
    else
        print_warning "Docker not found. Skipping Docker image builds."
    fi
}

# Generate IDLs
generate_idls() {
    print_status "Generating IDLs..."

    cd packages/programs
    bun run idl:extract
    check_status "IDL generation"
    cd ../..

    print_success "IDLs generated successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."

    # Test packages
    bun run test:packages
    check_status "Package tests"

    # Test applications
    bun run test:apps
    check_status "Application tests"

    print_success "All tests passed"
}

# Build with production optimizations
build_production() {
    print_status "Building for production..."

    # Set NODE_ENV to production
    export NODE_ENV=production

    # Build packages with production optimizations
    build_packages

    # Build applications with production optimizations
    build_apps

    # Build Docker images for production
    build_docker

    unset NODE_ENV

    print_success "Production build completed successfully"
}

# Analyze bundle sizes
analyze_bundles() {
    print_status "Analyzing bundle sizes..."

    # Analyze web app bundle
    if [ -d "apps/web/.next" ]; then
        print_status "Web app bundle analysis:"
        du -sh apps/web/.next
        find apps/web/.next -name "*.js" -exec ls -lh {} \; | head -10
    fi

    # Analyze package sizes
    print_status "Package sizes:"
    du -sh packages/*/dist

    print_success "Bundle analysis completed"
}

# Build summary
build_summary() {
    print_status "Build Summary:"
    echo "=================="

    # Check if builds exist
    if [ -d "packages/ui/dist" ]; then
        print_success "✅ @waveswap/ui built"
    else
        print_error "❌ @waveswap/ui not built"
    fi

    if [ -d "packages/sdk/dist" ]; then
        print_success "✅ @waveswap/sdk built"
    else
        print_error "❌ @waveswap/sdk not built"
    fi

    if [ -d "packages/programs/target/deploy" ]; then
        print_success "✅ Solana programs built"
    else
        print_error "❌ Solana programs not built"
    fi

    if [ -d "apps/web/.next" ]; then
        print_success "✅ Web app built"
    else
        print_error "❌ Web app not built"
    fi

    if [ -d "apps/backend/dist" ]; then
        print_success "✅ Backend built"
    else
        print_error "❌ Backend not built"
    fi

    if [ -d "apps/docs/build" ]; then
        print_success "✅ Documentation built"
    else
        print_error "❌ Documentation not built"
    fi

    echo "=================="
}

# Main function
main() {
    case "${1:-all}" in
        "all")
            clean
            build_packages
            build_apps
            build_summary
            ;;
        "packages")
            build_packages
            ;;
        "apps")
            build_apps
            ;;
        "docker")
            build_docker
            ;;
        "production")
            build_production
            ;;
        "clean")
            clean
            ;;
        "test")
            clean
            build_packages
            build_apps
            run_tests
            ;;
        "analyze")
            analyze_bundles
            ;;
        "idl")
            generate_idls
            ;;
        "help"|"-h"|"--help")
            echo "WaveSwap Build Script"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  all         Build everything (default)"
            echo "  packages    Build all packages"
            echo "  apps        Build all applications"
            echo "  docker      Build Docker images"
            echo "  production  Build with production optimizations"
            echo "  clean       Clean build artifacts"
            echo "  test        Clean, build, and run tests"
            echo "  analyze     Analyze bundle sizes"
            echo "  idl         Generate IDLs"
            echo "  help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0              # Build everything"
            echo "  $0 packages     # Build packages only"
            echo "  $0 production   # Production build"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"