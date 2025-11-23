#!/bin/bash

# WaveSwap Development Environment Setup Script
# This script sets up the development environment for WaveSwap

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

# Check if running on macOS or Linux
check_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_status "Running on macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_status "Running on Linux"
    else
        print_error "Unsupported OS: $OSTYPE"
        exit 1
    fi
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 20+"
        exit 1
    fi

    # Check Bun
    if command -v bun &> /dev/null; then
        BUN_VERSION=$(bun --version)
        print_success "Bun found: $BUN_VERSION"
    else
        print_error "Bun is not installed. Please install Bun"
        exit 1
    fi

    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker found: $DOCKER_VERSION"
    else
        print_warning "Docker is not installed. It's recommended for local development"
    fi

    # Check Solana CLI
    if command -v solana &> /dev/null; then
        SOLANA_VERSION=$(solana --version)
        print_success "Solana CLI found: $SOLANA_VERSION"
    else
        print_warning "Solana CLI is not installed. Install it for program development"
    fi

    # Check Anchor CLI
    if command -v anchor &> /dev/null; then
        ANCHOR_VERSION=$(anchor --version)
        print_success "Anchor CLI found: $ANCHOR_VERSION"
    else
        print_warning "Anchor CLI is not installed. Install it for program development"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    bun install
    print_success "Dependencies installed"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."

    if [ ! -f .env.local ]; then
        cp .env.example .env.local
        print_success "Created .env.local from .env.example"
        print_warning "Please update .env.local with your configuration"
    else
        print_warning ".env.local already exists"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."

    # Check if PostgreSQL is running
    if ! pg_isready -q; then
        print_warning "PostgreSQL is not running. Please start PostgreSQL service"
        print_status "You can start it with: brew services start postgresql (macOS)"
    else
        print_success "PostgreSQL is running"
    fi

    # Generate Prisma client
    cd apps/backend
    bun run db:generate
    cd ../..
    print_success "Prisma client generated"
}

# Build packages
build_packages() {
    print_status "Building packages..."

    # Build UI package
    cd packages/ui
    bun run build
    cd ../..

    # Build SDK package
    cd packages/sdk
    bun run build
    cd ../..

    # Build programs
    cd packages/programs
    bun run anchor:build
    cd ../..

    print_success "All packages built successfully"
}

# Setup Git hooks
setup_git_hooks() {
    print_status "Setting up Git hooks..."

    # Install husky
    bun add husky -D
    bun run prepare

    # Add pre-commit hook
    cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linting
bun run lint

# Run type checking
bun run type-check

# Run tests for changed packages
bun run test:changed
EOF

    chmod +x .husky/pre-commit
    print_success "Git hooks setup completed"
}

# Start development environment
start_dev() {
    print_status "Starting development environment..."

    # Start Docker services
    if command -v docker-compose &> /dev/null; then
        print_status "Starting Docker services..."
        docker-compose up -d
        print_success "Docker services started"
    fi

    print_status "To start the development servers, run:"
    echo "  bun run dev           # Start all services"
    echo "  bun run dev:web       # Start web app only"
    echo "  bun run dev:backend   # Start backend only"
    echo "  bun run dev:docs      # Start docs only"
}

# Main setup function
main() {
    print_status "🚀 Setting up WaveSwap development environment..."

    check_os
    check_prerequisites
    install_dependencies
    setup_environment
    setup_database
    build_packages
    setup_git_hooks

    print_success "✅ WaveSwap development environment setup completed!"
    print_status "Next steps:"
    echo "1. Update .env.local with your configuration"
    echo "2. Run 'bun run dev' to start development servers"
    echo "3. Visit http://localhost:3000 for the web app"
    echo "4. Visit http://localhost:3001 for the API"
    echo "5. Visit http://localhost:3002 for documentation"
}

# Handle script arguments
case "${1:-}" in
    "check")
        check_prerequisites
        ;;
    "build")
        build_packages
        ;;
    "clean")
        print_status "Cleaning up..."
        rm -rf node_modules
        rm -rf packages/*/node_modules
        rm -rf apps/*/node_modules
        rm -rf packages/*/dist
        rm -rf apps/*/.next
        rm -rf apps/backend/dist
        rm -rf apps/docs/build
        print_success "Cleanup completed"
        ;;
    "reset")
        print_status "Resetting development environment..."
        ./scripts/setup.sh clean
        ./scripts/setup.sh
        ;;
    *)
        main
        ;;
esac