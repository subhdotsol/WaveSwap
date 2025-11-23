#!/bin/bash

# WaveSwap Test Script
# This script runs tests for the WaveSwap monorepo

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
        return 1
    fi
}

# Test packages
test_packages() {
    print_status "Testing packages..."

    local failed_packages=()

    # Test UI package
    print_status "Testing @waveswap/ui..."
    if cd packages/ui && bun run test; then
        print_success "@waveswap/ui tests passed"
    else
        print_error "@waveswap/ui tests failed"
        failed_packages+=("@waveswap/ui")
    fi
    cd ../..

    # Test SDK package
    print_status "Testing @waveswap/sdk..."
    if cd packages/sdk && bun run test; then
        print_success "@waveswap/sdk tests passed"
    else
        print_error "@waveswap/sdk tests failed"
        failed_packages+=("@waveswap/sdk")
    fi
    cd ../..

    # Test Solana programs
    print_status "Testing Solana programs..."
    if cd packages/programs && bun run anchor:test; then
        print_success "Solana programs tests passed"
    else
        print_error "Solana programs tests failed"
        failed_packages+=("Solana programs")
    fi
    cd ../..

    if [ ${#failed_packages[@]} -eq 0 ]; then
        print_success "All package tests passed"
        return 0
    else
        print_error "Failed packages: ${failed_packages[*]}"
        return 1
    fi
}

# Test applications
test_apps() {
    print_status "Testing applications..."

    local failed_apps=()

    # Test web app
    print_status "Testing web application..."
    if cd apps/web && bun run test; then
        print_success "Web app tests passed"
    else
        print_error "Web app tests failed"
        failed_apps+=("Web app")
    fi
    cd ../..

    # Test backend
    print_status "Testing backend..."
    if cd apps/backend && bun run test; then
        print_success "Backend tests passed"
    else
        print_error "Backend tests failed"
        failed_apps+=("Backend")
    fi
    cd ../..

    # Documentation doesn't have tests currently
    print_warning "Documentation tests skipped (no tests configured)"

    if [ ${#failed_apps[@]} -eq 0 ]; then
        print_success "All application tests passed"
        return 0
    else
        print_error "Failed applications: ${failed_apps[*]}"
        return 1
    fi
}

# Test integration
test_integration() {
    print_status "Running integration tests..."

    # Start test environment
    print_status "Starting test environment..."
    docker-compose -f docker-compose.test.yml up -d

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10

    # Run integration tests
    print_status "Running integration tests..."
    if bun run test:integration; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
        docker-compose -f docker-compose.test.yml down
        return 1
    fi

    # Stop test environment
    print_status "Stopping test environment..."
    docker-compose -f docker-compose.test.yml down

    return 0
}

# Test e2e
test_e2e() {
    print_status "Running E2E tests..."

    # Start development environment
    print_status "Starting development environment for E2E tests..."
    docker-compose up -d

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 15

    # Run E2E tests
    print_status "Running E2E tests..."
    if bun run test:e2e; then
        print_success "E2E tests passed"
    else
        print_error "E2E tests failed"
        docker-compose down
        return 1
    fi

    # Stop development environment
    print_status "Stopping development environment..."
    docker-compose down

    return 0
}

# Run tests with coverage
run_coverage() {
    print_status "Running tests with coverage..."

    local failed_tests=()

    # Package coverage
    print_status "Running package tests with coverage..."
    cd packages/ui
    if bun run test:coverage; then
        print_success "@waveswap/ui coverage generated"
    else
        print_error "@waveswap/ui coverage failed"
        failed_tests+=("@waveswap/ui coverage")
    fi
    cd ../..

    cd packages/sdk
    if bun run test:coverage; then
        print_success "@waveswap/sdk coverage generated"
    else
        print_error "@waveswap/sdk coverage failed"
        failed_tests+=("@waveswap/sdk coverage")
    fi
    cd ../..

    # Application coverage
    print_status "Running application tests with coverage..."
    cd apps/web
    if bun run test:coverage; then
        print_success "Web app coverage generated"
    else
        print_error "Web app coverage failed"
        failed_tests+=("Web app coverage")
    fi
    cd ../..

    cd apps/backend
    if bun run test:coverage; then
        print_success "Backend coverage generated"
    else
        print_error "Backend coverage failed"
        failed_tests+=("Backend coverage")
    fi
    cd ../..

    if [ ${#failed_tests[@]} -eq 0 ]; then
        print_success "All coverage reports generated"
        return 0
    else
        print_error "Failed coverage: ${failed_tests[*]}"
        return 1
    fi
}

# Lint code
lint_code() {
    print_status "Running linter..."

    local failed_lint=()

    # Lint all packages and apps
    if bun run lint; then
        print_success "Linting passed"
    else
        print_error "Linting failed"
        failed_lint+=("Linting")
    fi

    if [ ${#failed_lint[@]} -eq 0 ]; then
        print_success "All linting passed"
        return 0
    else
        print_error "Linting failed: ${failed_lint[*]}"
        return 1
    fi
}

# Type check
type_check() {
    print_status "Running type checker..."

    local failed_types=()

    # Type check all packages and apps
    if bun run type-check; then
        print_success "Type checking passed"
    else
        print_error "Type checking failed"
        failed_types+=("Type checking")
    fi

    if [ ${#failed_types[@]} -eq 0 ]; then
        print_success "All type checking passed"
        return 0
    else
        print_error "Type checking failed: ${failed_types[*]}"
        return 1
    fi
}

# Watch mode
watch_tests() {
    print_status "Starting test watch mode..."

    # Start watch mode for all packages and apps
    bun run test:watch
}

# CI tests (comprehensive test suite for CI/CD)
run_ci_tests() {
    print_status "Running CI test suite..."

    local failed_steps=()

    # Type checking
    if ! type_check; then
        failed_steps+=("Type checking")
    fi

    # Linting
    if ! lint_code; then
        failed_steps+=("Linting")
    fi

    # Unit tests
    if ! (test_packages && test_apps); then
        failed_steps+=("Unit tests")
    fi

    # Integration tests
    if ! test_integration; then
        failed_steps+=("Integration tests")
    fi

    if [ ${#failed_steps[@]} -eq 0 ]; then
        print_success "✅ All CI tests passed!"
        return 0
    else
        print_error "❌ CI tests failed: ${failed_steps[*]}"
        return 1
    fi
}

# Test summary
test_summary() {
    print_status "Test Summary:"
    echo "==============="

    # Check test coverage files
    if find . -name "coverage" -type d | head -1 | grep -q .; then
        print_success "✅ Coverage reports generated"
    else
        print_warning "⚠️  No coverage reports found"
    fi

    # Check test results
    if find . -name "test-results.xml" | head -1 | grep -q .; then
        print_success "✅ Test results files found"
    else
        print_warning "⚠️  No test results files found"
    fi

    echo "==============="
}

# Main function
main() {
    case "${1:-all}" in
        "all")
            (test_packages && test_apps) || exit 1
            test_summary
            ;;
        "packages")
            test_packages || exit 1
            ;;
        "apps")
            test_apps || exit 1
            ;;
        "integration")
            test_integration || exit 1
            ;;
        "e2e")
            test_e2e || exit 1
            ;;
        "coverage")
            run_coverage || exit 1
            test_summary
            ;;
        "lint")
            lint_code || exit 1
            ;;
        "type-check")
            type_check || exit 1
            ;;
        "ci")
            run_ci_tests || exit 1
            test_summary
            ;;
        "watch")
            watch_tests
            ;;
        "help"|"-h"|"--help")
            echo "WaveSwap Test Script"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  all         Run all unit tests (default)"
            echo "  packages    Test all packages"
            echo "  apps        Test all applications"
            echo "  integration Run integration tests"
            echo "  e2e         Run end-to-end tests"
            echo "  coverage    Run tests with coverage"
            echo "  lint        Run linting"
            echo "  type-check  Run type checking"
            echo "  ci          Run comprehensive CI test suite"
            echo "  watch       Run tests in watch mode"
            echo "  help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0              # Run all tests"
            echo "  $0 packages     # Test packages only"
            echo "  $0 ci           # Run CI test suite"
            echo "  $0 coverage     # Generate coverage reports"
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