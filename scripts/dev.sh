#!/bin/bash

# WaveSwap Development Server Launcher
# This script starts the development servers for WaveSwap

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

# Check if .env.local exists
check_env() {
    if [ ! -f .env.local ]; then
        print_error ".env.local not found. Please run: ./scripts/setup.sh"
        exit 1
    fi
}

# Start Docker services if needed
start_docker() {
    if command -v docker-compose &> /dev/null; then
        print_status "Starting Docker services..."
        docker-compose up -d postgres redis

        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 5

        print_success "Docker services started"
    else
        print_warning "Docker not found. Please start PostgreSQL and Redis manually"
    fi
}

# Function to kill processes on exit
cleanup() {
    print_status "Shutting down development servers..."

    # Kill background processes
    jobs -p | xargs kill 2>/dev/null || true

    # Stop Docker services if they were started
    if [ "$STARTED_DOCKER" = "true" ]; then
        print_status "Stopping Docker services..."
        docker-compose down
    fi

    print_success "Development servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start development servers
start_servers() {
    local services=("$@")
    local pids=()

    print_status "Starting development services: ${services[*]}"

    # Create logs directory
    mkdir -p logs

    # Start each service in background
    for service in "${services[@]}"; do
        case $service in
            "web")
                print_status "Starting web application..."
                cd apps/web && bun run dev > ../../logs/web.log 2>&1 &
                pids+=($!)
                cd ../..
                print_success "Web app starting at http://localhost:3000"
                ;;
            "backend")
                print_status "Starting backend API..."
                cd apps/backend && bun run dev > ../../logs/backend.log 2>&1 &
                pids+=($!)
                cd ../..
                print_success "Backend API starting at http://localhost:3001"
                ;;
            "docs")
                print_status "Starting documentation..."
                cd apps/docs && bun run start > ../../logs/docs.log 2>&1 &
                pids+=($!)
                cd ../..
                print_success "Documentation starting at http://localhost:3002"
                ;;
            *)
                print_error "Unknown service: $service"
                exit 1
                ;;
        esac
    done

    # Wait for all processes
    print_status "All services started. Press Ctrl+C to stop."
    echo ""
    echo "📊 Development Servers:"
    echo "  Web App:      http://localhost:3000"
    echo "  Backend API:  http://localhost:3001"
    echo "  Documentation: http://localhost:3002"
    echo "  Health Check: http://localhost:3001/health/ping"
    echo ""
    echo "📝 Logs are being written to the 'logs' directory"
    echo ""

    # Monitor processes
    for pid in "${pids[@]}"; do
        wait $pid
        if [ $? -ne 0 ]; then
            print_error "Process $pid exited with error. Check logs for details."
            tail -n 20 logs/*.log
        fi
    done
}

# Show logs
show_logs() {
    local service="$1"

    case $service in
        "web")
            tail -f logs/web.log
            ;;
        "backend")
            tail -f logs/backend.log
            ;;
        "docs")
            tail -f logs/docs.log
            ;;
        *)
            print_error "Unknown service: $service"
            echo "Available services: web, backend, docs"
            exit 1
            ;;
    esac
}

# Main function
main() {
    case "${1:-all}" in
        "all")
            check_env
            start_docker
            STARTED_DOCKER=true
            start_servers "web" "backend" "docs"
            ;;
        "web")
            start_servers "web"
            ;;
        "backend")
            start_servers "backend"
            ;;
        "docs")
            start_servers "docs"
            ;;
        "docker")
            start_docker
            STARTED_DOCKER=true
            print_success "Docker services started. Run './scripts/dev.sh' to start applications."
            ;;
        "logs")
            if [ -z "$2" ]; then
                print_error "Please specify a service: web, backend, or docs"
                exit 1
            fi
            show_logs "$2"
            ;;
        "status")
            print_status "Checking development server status..."

            # Check if processes are running
            if pgrep -f "next dev" > /dev/null; then
                print_success "Web app is running (http://localhost:3000)"
            else
                print_warning "Web app is not running"
            fi

            if pgrep -f "apps/backend" > /dev/null; then
                print_success "Backend API is running (http://localhost:3001)"
            else
                print_warning "Backend API is not running"
            fi

            if pgrep -f "apps/docs" > /dev/null; then
                print_success "Documentation is running (http://localhost:3002)"
            else
                print_warning "Documentation is not running"
            fi

            # Check Docker services
            if command -v docker-compose &> /dev/null; then
                if docker-compose ps | grep -q "Up"; then
                    print_success "Docker services are running"
                    docker-compose ps
                else
                    print_warning "Docker services are not running"
                fi
            fi
            ;;
        "stop")
            cleanup
            ;;
        "help"|"-h"|"--help")
            echo "WaveSwap Development Server Launcher"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  all        Start all development services (web, backend, docs)"
            echo "  web        Start web application only"
            echo "  backend    Start backend API only"
            echo "  docs       Start documentation only"
            echo "  docker     Start Docker services only"
            echo "  logs       Show logs for a service (web|backend|docs)"
            echo "  status     Show status of all development services"
            echo "  stop       Stop all development services"
            echo "  help       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0              # Start all services"
            echo "  $0 web          # Start web app only"
            echo "  $0 logs web     # Show web app logs"
            echo "  $0 status       # Check service status"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Export started docker flag
export STARTED_DOCKER=false

# Run main function
main "$@"