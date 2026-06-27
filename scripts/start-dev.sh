#!/usr/bin/env bash
#
# Start local dev environment on macOS: API server + Vite frontend.
#
# Usage:
#   ./scripts/start-dev.sh              # 当前终端启动（默认，不弹窗）
#   ./scripts/start-dev.sh --windows    # 新开 Terminal 窗口
#   ./scripts/start-dev.sh --no-browser
#   ./scripts/start-dev.sh --skip-port-cleanup
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

API_PORT=3001
WEB_PORT=5173
SKIP_PORT_CLEANUP=false
NO_BROWSER=false
USE_TERMINAL_WINDOWS=false

usage() {
  cat <<'EOF'
Usage: ./scripts/start-dev.sh [options]

Options:
  --windows              Open separate Terminal windows (default: run in current terminal)
  --no-browser           Do not open the browser automatically
  --skip-port-cleanup    Keep existing processes on dev ports
  --api-port <port>      API port (default: 3001)
  --web-port <port>      Frontend port (default: 5173)
  --here                 Alias for default behavior (current terminal)
  -h, --help             Show this help
EOF
}

write_step() {
  printf '>> %s\n' "$1"
}

stop_port() {
  local port="$1"
  local pids

  pids="$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    printf '  Port %s is free\n' "$port"
    return 0
  fi

  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue
    local name
    name="$(ps -p "$pid" -o comm= 2>/dev/null || echo unknown)"
    printf '  Stop process on port %s: PID %s (%s)\n' "$port" "$pid" "$name"
    kill -9 "$pid" 2>/dev/null || true
  done <<< "$pids"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --windows)
      USE_TERMINAL_WINDOWS=true
      ;;
    --no-browser)
      NO_BROWSER=true
      ;;
    --skip-port-cleanup)
      SKIP_PORT_CLEANUP=true
      ;;
    --api-port)
      API_PORT="${2:?missing value for --api-port}"
      shift
      ;;
    --web-port)
      WEB_PORT="${2:?missing value for --web-port}"
      shift
      ;;
    --here)
      USE_TERMINAL_WINDOWS=false
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Please install Node.js first." >&2
  exit 1
fi

cd "$PROJECT_ROOT"

if [[ ! -d node_modules ]]; then
  write_step 'First run: npm install'
  npm install
fi

if [[ "$SKIP_PORT_CLEANUP" == false ]]; then
  write_step "Check API port ${API_PORT}"
  stop_port "$API_PORT"
  write_step "Check frontend port ${WEB_PORT}"
  stop_port "$WEB_PORT"
fi

FRONTEND_URL="http://localhost:${WEB_PORT}"
API_URL="http://localhost:${API_PORT}"

run_in_current_terminal() {
  write_step 'Start backend and frontend in current terminal'
  export PORT="$API_PORT"

  npm run dev:server &
  local backend_pid=$!

  cleanup() {
    printf '\nStopping dev services...\n'
    kill "$backend_pid" 2>/dev/null || true
    wait "$backend_pid" 2>/dev/null || true
    stop_port "$API_PORT" >/dev/null 2>&1 || true
    stop_port "$WEB_PORT" >/dev/null 2>&1 || true
  }
  trap cleanup EXIT INT TERM

  sleep 2

  if [[ "$NO_BROWSER" == false ]] && command -v open >/dev/null 2>&1; then
    open "$FRONTEND_URL" >/dev/null 2>&1 || true
  fi

  printf '\nDev environment started.\n'
  printf '  Frontend: %s\n' "$FRONTEND_URL"
  printf '  API:      %s\n\n' "$API_URL"
  printf 'Press Ctrl+C to stop both services.\n\n'

  npm run dev -- --port "$WEB_PORT"
}

escape_for_shell() {
  printf '%s' "$1" | sed "s/'/'\\\\''/g"
}

run_in_terminal_windows() {
  local root_escaped
  root_escaped="$(escape_for_shell "$PROJECT_ROOT")"

  write_step 'Start backend: npm run dev:server'
  osascript <<EOF >/dev/null
tell application "Terminal"
  activate
  do script "cd '${root_escaped}' && export PORT=${API_PORT} && echo '[backend] npm run dev:server' && npm run dev:server"
end tell
EOF

  sleep 2

  write_step 'Start frontend: npm run dev'
  osascript <<EOF >/dev/null
tell application "Terminal"
  do script "cd '${root_escaped}' && echo '[frontend] npm run dev' && npm run dev -- --port ${WEB_PORT}"
end tell
EOF

  printf '\nDev environment started.\n'
  printf '  Frontend: %s\n' "$FRONTEND_URL"
  printf '  API:      %s\n\n' "$API_URL"
  printf 'Close the two Terminal windows to stop services.\n'
  printf 'Tip: omit --windows to run in the current terminal without popups.\n'

  if [[ "$NO_BROWSER" == false ]] && command -v open >/dev/null 2>&1; then
    sleep 2
    open "$FRONTEND_URL" >/dev/null 2>&1 || true
  fi
}

if [[ "$USE_TERMINAL_WINDOWS" == true ]] && [[ "$(uname -s)" == Darwin ]] && command -v osascript >/dev/null 2>&1; then
  run_in_terminal_windows
else
  run_in_current_terminal
fi
