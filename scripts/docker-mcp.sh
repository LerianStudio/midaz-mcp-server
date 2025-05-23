#!/bin/bash

# Docker helper script for Midaz MCP Server
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="midaz/mcp-server"
CONTAINER_NAME="midaz-mcp-server"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_usage() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  build       Build the Docker image"
    echo "  run         Run the MCP server in Docker"
    echo "  exec        Execute MCP server for Claude Desktop"
    echo "  logs        Show container logs"
    echo "  stop        Stop the container"
    echo "  clean       Remove container and image"
    echo "  bridge      Start socat bridge for Claude Desktop"
    echo ""
    echo "Options:"
    echo "  --stub      Use stub mode (default)"
    echo "  --live      Connect to live services"
    echo "  --help      Show this help message"
}

build_image() {
    echo -e "${GREEN}Building Docker image...${NC}"
    cd "$PROJECT_ROOT"
    
    # Build TypeScript first
    if [ -d "src" ]; then
        echo -e "${YELLOW}Building TypeScript...${NC}"
        npm run build
    fi
    
    # Build Docker image
    docker build -t "$IMAGE_NAME:latest" .
    echo -e "${GREEN}Image built successfully!${NC}"
}

run_container() {
    local use_stubs="true"
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --live)
                use_stubs="false"
                shift
                ;;
            --stub)
                use_stubs="true"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    echo -e "${GREEN}Starting MCP server in Docker...${NC}"
    
    # Stop existing container if running
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    
    # Run new container
    docker run -d \
        --name "$CONTAINER_NAME" \
        -e MIDAZ_USE_STUBS="$use_stubs" \
        -e MIDAZ_ONBOARDING_URL="${MIDAZ_ONBOARDING_URL:-http://host.docker.internal:3000}" \
        -e MIDAZ_TRANSACTION_URL="${MIDAZ_TRANSACTION_URL:-http://host.docker.internal:3001}" \
        -e MIDAZ_API_KEY="${MIDAZ_API_KEY:-}" \
        -v "$PROJECT_ROOT/logs:/app/logs" \
        -v "$PROJECT_ROOT/midaz-mcp-config.json:/app/midaz-mcp-config.json:ro" \
        "$IMAGE_NAME:latest" \
        tail -f /dev/null
    
    echo -e "${GREEN}Container started: $CONTAINER_NAME${NC}"
    echo -e "${YELLOW}Use 'docker logs -f $CONTAINER_NAME' to view logs${NC}"
}

exec_mcp() {
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${RED}Container not running. Start it first with: $0 run${NC}"
        exit 1
    fi
    
    # Execute MCP server
    docker exec -i "$CONTAINER_NAME" node dist/index.js
}

show_logs() {
    docker logs -f "$CONTAINER_NAME"
}

stop_container() {
    echo -e "${YELLOW}Stopping container...${NC}"
    docker stop "$CONTAINER_NAME" || true
    docker rm "$CONTAINER_NAME" || true
    echo -e "${GREEN}Container stopped${NC}"
}

clean_all() {
    echo -e "${YELLOW}Cleaning up Docker resources...${NC}"
    stop_container
    docker rmi "$IMAGE_NAME:latest" || true
    echo -e "${GREEN}Cleanup complete${NC}"
}

start_bridge() {
    echo -e "${GREEN}Starting socat bridge on port 3330...${NC}"
    echo -e "${YELLOW}Configure Claude Desktop to use: socat STDIO TCP:localhost:3330${NC}"
    
    # Check if socat is installed
    if ! command -v socat &> /dev/null; then
        echo -e "${RED}socat is not installed. Install it first:${NC}"
        echo "  macOS: brew install socat"
        echo "  Linux: sudo apt-get install socat"
        exit 1
    fi
    
    # Start bridge
    socat TCP-LISTEN:3330,fork,reuseaddr EXEC:"docker exec -i $CONTAINER_NAME node dist/index.js"
}

# Main script logic
case "$1" in
    build)
        build_image
        ;;
    run)
        shift
        run_container "$@"
        ;;
    exec)
        exec_mcp
        ;;
    logs)
        show_logs
        ;;
    stop)
        stop_container
        ;;
    clean)
        clean_all
        ;;
    bridge)
        start_bridge
        ;;
    --help|help|"")
        print_usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        print_usage
        exit 1
        ;;
esac