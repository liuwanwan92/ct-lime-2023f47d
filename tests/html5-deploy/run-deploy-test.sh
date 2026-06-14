#!/bin/bash
# HTML5 Deployment Self-Test Runner
# ==================================
# Usage: ./run-deploy-test.sh [build_output_dir] [port]
#
# Copies self-test.html into the build output directory and starts
# an HTTP server so you can validate the deployment in a browser.
#
# Examples:
#   ./run-deploy-test.sh                       # uses bin/html5/bin, port 3000
#   ./run-deploy-test.sh bin/html5/bin 8080     # custom dir and port

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="${1:-bin/html5/bin}"
PORT="${2:-3000}"

if [ ! -d "$BUILD_DIR" ]; then
    echo "ERROR: Build output directory not found: $BUILD_DIR"
    echo "Run 'lime build html5' first."
    exit 1
fi

if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo "WARNING: index.html not found in $BUILD_DIR"
    echo "This may not be a valid Lime HTML5 build output."
fi

# Copy self-test page
cp "$SCRIPT_DIR/self-test.html" "$BUILD_DIR/self-test.html"
echo "Copied self-test.html to $BUILD_DIR/"

# Try to start a local server
echo ""
echo "Starting local server on port $PORT..."
echo "Open: http://localhost:$PORT/self-test.html"
echo ""

if command -v npx &> /dev/null; then
    npx http-server "$BUILD_DIR" -p "$PORT" -c-1 --cors -o /self-test.html
elif command -v python3 &> /dev/null; then
    echo "(Using Python's built-in server — no CORS headers)"
    cd "$BUILD_DIR" && python3 -m http.server "$PORT"
elif command -v python &> /dev/null; then
    echo "(Using Python's built-in server — no CORS headers)"
    cd "$BUILD_DIR" && python -m http.server "$PORT"
else
    echo "No HTTP server found. Install Node.js or Python 3, then re-run."
    echo "Or manually serve $BUILD_DIR with your preferred server."
    exit 1
fi
