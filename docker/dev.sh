#!/bin/bash

# Development Docker Environment Management Script
# Provides convenient commands for managing the local development environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.dev.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Show usage information
show_help() {
    cat << EOF
Development Environment Management Script

Usage: $0 [COMMAND]

Commands:
    up          Start all development services
    down        Stop all development services
    restart     Restart all development services
    build       Build/rebuild all services
    logs        Show logs from all services
    logs <svc>  Show logs from specific service
    status      Show status of all services
    clean       Remove all containers and volumes (DESTRUCTIVE)
    reset       Reset the entire environment (DESTRUCTIVE)
    shell       Open bash shell in webapp container
    mysql       Open MySQL shell
    test        Run health checks on all services
    init        Initialize development environment
    help        Show this help message

Service Management:
    start <service>     Start specific service
    stop <service>      Stop specific service
    restart <service>   Restart specific service

Available Services:
    webapp, radiodb, radio_minio, radio_phpmyadmin, redis

Examples:
    $0 up                    # Start all services
    $0 logs webapp           # Show webapp logs
    $0 restart radiodb       # Restart database
    $0 shell                 # Open shell in webapp
    $0 test                  # Run health checks

EOF
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Start all services
start_all() {
    log_info "Starting development environment..."
    check_docker

    cd "$SCRIPT_DIR"
    docker-compose -f docker-compose.dev.yml up -d

    log_success "Development environment started!"
    log_info "Services available at:"
    echo "  - Web App:    http://localhost:3000"
    echo "  - PHPMyAdmin: http://localhost:8080"
    echo "  - MinIO:      http://localhost:9001"
    echo "  - Redis:      localhost:6379"
    echo ""
    log_info "Use '$0 logs' to view service logs"
    log_info "Use '$0 test' to check service health"
}

# Stop all services
stop_all() {
    log_info "Stopping development environment..."
    cd "$SCRIPT_DIR"
    docker-compose -f docker-compose.dev.yml down
    log_success "Development environment stopped!"
}

# Restart all services
restart_all() {
    log_info "Restarting development environment..."
    stop_all
    start_all
}

# Build/rebuild services
build_all() {
    log_info "Building development environment..."
    check_docker
    cd "$SCRIPT_DIR"
    docker-compose -f docker-compose.dev.yml build --no-cache
    log_success "Build completed!"
}

# Show logs
show_logs() {
    cd "$SCRIPT_DIR"
    if [ -z "$1" ]; then
        docker-compose -f docker-compose.dev.yml logs -f
    else
        docker-compose -f docker-compose.dev.yml logs -f "$1"
    fi
}

# Show service status
show_status() {
    log_info "Development environment status:"
    cd "$SCRIPT_DIR"
    docker-compose -f docker-compose.dev.yml ps
}

# Clean up everything (DESTRUCTIVE)
clean_all() {
    log_warning "This will remove all containers, volumes, and data. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        log_info "Cleaning up development environment..."
        cd "$SCRIPT_DIR"
        docker-compose -f docker-compose.dev.yml down -v --remove-orphans
        docker volume prune -f
        log_success "Environment cleaned!"
    else
        log_info "Clean cancelled."
    fi
}

# Reset environment (DESTRUCTIVE)
reset_all() {
    log_warning "This will completely reset the development environment. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        clean_all
        build_all
        start_all
        log_success "Environment reset completed!"
    else
        log_info "Reset cancelled."
    fi
}

# Open shell in webapp container
open_shell() {
    log_info "Opening shell in webapp container..."
    cd "$SCRIPT_DIR"
    docker-compose -f docker-compose.dev.yml exec webapp /bin/bash
}

# Open MySQL shell
open_mysql() {
    log_info "Opening MySQL shell..."
    cd "$SCRIPT_DIR"
    docker-compose -f docker-compose.dev.yml exec radiodb mysql -u root -pradiopass123 radio_db
}

# Start specific service
start_service() {
    local service="$1"
    log_info "Starting service: $service"
    cd "$SCRIPT_DIR"
    docker-compose -f docker-compose.dev.yml up -d "$service"
    log_success "Service $service started!"
}

# Stop specific service
stop_service() {
    local service="$1"
    log_info "Stopping service: $service"
    cd "$SCRIPT_DIR"
    docker-compose -f docker-compose.dev.yml stop "$service"
    log_success "Service $service stopped!"
}

# Restart specific service
restart_service() {
    local service="$1"
    log_info "Restarting service: $service"
    cd "$SCRIPT_DIR"
    docker-compose -f docker-compose.dev.yml restart "$service"
    log_success "Service $service restarted!"
}

# Test service health
test_services() {
    log_info "Running health checks..."
    cd "$SCRIPT_DIR"

    # Check if services are running
    if ! docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        log_error "No services are running. Start with '$0 up' first."
        exit 1
    fi

    echo ""
    log_info "Testing database connection..."
    if curl -f -s http://localhost:3000/api/test/db >/dev/null 2>&1; then
        log_success "Database: OK"
    else
        log_error "Database: FAILED"
    fi

    log_info "Testing storage connection..."
    if curl -f -s http://localhost:3000/api/test/storage >/dev/null 2>&1; then
        log_success "Storage: OK"
    else
        log_error "Storage: FAILED"
    fi

    log_info "Testing web application..."
    if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
        log_success "Web App: OK"
    else
        log_error "Web App: FAILED"
    fi

    echo ""
    log_info "Health check completed!"
}

# Initialize development environment
init_environment() {
    log_info "Initializing development environment..."

    # Check if .env.local exists
    if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
        log_warning ".env.local not found. Creating from template..."
        # Create basic .env.local
        cat > "$PROJECT_ROOT/.env.local" << EOF
# Development Environment Variables
NODE_ENV=development
DATABASE_URL=mysql://root:radiopass123@localhost:3306/radio_db
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=media
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production
RADIO_STREAM_URL=https://radyo.yayin.com.tr:5132/stream
RADIO_METADATA_URL=https://radyo.yayin.com.tr:5132/
RADIO_CORS_PROXY=https://cros9.yayin.com.tr
EOF
        log_success ".env.local created!"
    fi

    # Start services
    start_all

    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 30

    # Run health checks
    test_services

    log_success "Development environment initialized!"
}

# Main command handler
case "${1:-help}" in
    up|start)
        start_all
        ;;
    down|stop)
        stop_all
        ;;
    restart)
        restart_all
        ;;
    build)
        build_all
        ;;
    logs)
        show_logs "$2"
        ;;
    status|ps)
        show_status
        ;;
    clean)
        clean_all
        ;;
    reset)
        reset_all
        ;;
    shell|bash)
        open_shell
        ;;
    mysql|db)
        open_mysql
        ;;
    test|health)
        test_services
        ;;
    init)
        init_environment
        ;;
    start)
        if [ -z "$2" ]; then
            log_error "Please specify a service name"
            exit 1
        fi
        start_service "$2"
        ;;
    stop)
        if [ -z "$2" ]; then
            log_error "Please specify a service name"
            exit 1
        fi
        stop_service "$2"
        ;;
    restart)
        if [ -z "$2" ]; then
            restart_all
        else
            restart_service "$2"
        fi
        ;;
    help|-h|--help)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac