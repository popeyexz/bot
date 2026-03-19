#!/usr/bin/env bash
set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}"
echo "  ███████╗████████╗██████╗ ██╗██╗  ██╗"
echo "  ██╔════╝╚══██╔══╝██╔══██╗██║╚██╗██╔╝"
echo "  ███████╗   ██║   ██████╔╝██║ ╚███╔╝ "
echo "  ╚════██║   ██║   ██╔══██╗██║ ██╔██╗ "
echo "  ███████║   ██║   ██║  ██║██║██╔╝ ██╗"
echo "  ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝"
echo -e "  AI Tools Dashboard Installer${RESET}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Firewall setup (UFW — Linux only, skipped silently on macOS/Windows) ──────
echo -e "${BOLD}[0/5] Configuring firewall...${RESET}"
if command -v ufw &>/dev/null; then
  # Only configure UFW if it is not already active to avoid disrupting existing rules.
  UFW_STATUS=$(ufw status | head -1)
  if echo "$UFW_STATUS" | grep -q "inactive"; then
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    # Strix ports are bound to 127.0.0.1, so no external rules are needed.
    # Uncomment the lines below ONLY if you expose the server behind a reverse proxy.
    # ufw allow 80/tcp   # HTTP  (reverse proxy)
    # ufw allow 443/tcp  # HTTPS (reverse proxy)
    ufw --force enable
    echo -e "${GREEN}✓ UFW firewall configured (default deny, SSH allowed)${RESET}"
  else
    echo -e "${GREEN}✓ UFW already active — skipping firewall reset (current rules preserved)${RESET}"
  fi
  echo -e "${YELLOW}  → Strix ports 3000/3001 are localhost-only and not exposed externally.${RESET}"
else
  echo -e "${YELLOW}  → UFW not found — skipping firewall config. Install with: sudo apt install ufw${RESET}"
fi

# ── Check Node.js ────────────────────────────────────────────────────────────
echo -e "${BOLD}[1/5] Checking Node.js...${RESET}"
if ! command -v node &>/dev/null; then
  echo -e "${YELLOW}Node.js not found. Installing via nvm...${RESET}"
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
fi

NODE_VERSION=$(node -e "process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)" 2>&1 && echo "ok" || echo "old")
if [ "$NODE_VERSION" = "old" ]; then
  echo -e "${RED}Node.js >= 18 is required. Current: $(node --version)${RESET}"
  echo "Please upgrade: https://nodejs.org"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${RESET}"

# ── .env setup ───────────────────────────────────────────────────────────────
echo -e "${BOLD}[2/5] Setting up environment...${RESET}"
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "${GREEN}✓ Created .env from .env.example${RESET}"
  echo -e "${YELLOW}  → Edit .env to add your API keys before starting.${RESET}"
else
  echo -e "${GREEN}✓ .env already exists${RESET}"
fi

# ── Install frontend deps ─────────────────────────────────────────────────────
echo -e "${BOLD}[3/5] Installing dashboard dependencies...${RESET}"
cd "$SCRIPT_DIR/dashboard"
npm install --silent
echo -e "${GREEN}✓ Dashboard deps installed${RESET}"

echo -e "${BOLD}[4/5] Building dashboard...${RESET}"
npm run build
echo -e "${GREEN}✓ Dashboard built${RESET}"

# ── Install server deps ───────────────────────────────────────────────────────
echo -e "${BOLD}[5/5] Installing server dependencies...${RESET}"
cd "$SCRIPT_DIR/server"
npm install --silent
echo -e "${GREEN}✓ Server deps installed${RESET}"

cd "$SCRIPT_DIR"

echo ""
echo -e "${BOLD}${GREEN}✅  Installation complete!${RESET}"
echo ""
echo -e "${BOLD}To start the dashboard:${RESET}"
echo ""
echo -e "  ${CYAN}# Start backend server (terminal 1)${RESET}"
echo -e "  cd server && npm start"
echo ""
echo -e "  ${CYAN}# Start frontend dev server (terminal 2)${RESET}"
echo -e "  cd dashboard && npm run dev"
echo ""
echo -e "  ${CYAN}# Or use Docker Compose${RESET}"
echo -e "  docker compose up --build"
echo ""
echo -e "  ${CYAN}# Dashboard URL${RESET}"
echo -e "  http://localhost:3000"
echo ""
echo -e "${YELLOW}Don't forget to add your API keys to .env!${RESET}"
