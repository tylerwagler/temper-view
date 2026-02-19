#!/bin/bash
# setup.sh — Install claude-local on Linux/Mac
# Usage: curl -fsSL https://ellie.elytrondefense.com/install/setup.sh | bash

set -e

PORTAL_URL="${1:-https://ellie.elytrondefense.com}"
INSTALL_DIR="$HOME/.local/bin"
SCRIPT_NAME="claude-local"

echo "=== Claude Local Installer ==="
echo ""
echo "Portal URL: $PORTAL_URL"
echo "Install to: $INSTALL_DIR/$SCRIPT_NAME"
echo ""

# 1. Check if claude CLI is installed
if ! command -v claude &> /dev/null; then
    echo "Claude Code CLI not found. Installing..."
    curl -fsSL https://claude.ai/install.sh | bash
    echo ""
fi

# 2. Create install directory
mkdir -p "$INSTALL_DIR"

# 3. Download claude-local script
echo "Downloading claude-local..."
curl -fsSL "$PORTAL_URL/install/claude-local" -o "$INSTALL_DIR/$SCRIPT_NAME"
chmod +x "$INSTALL_DIR/$SCRIPT_NAME"

# 4. Write default config with portal URL
CONFIG_DIR="$HOME/.config/claude-local"
CONFIG_FILE="$CONFIG_DIR/env"
if [ ! -f "$CONFIG_FILE" ]; then
    mkdir -p "$CONFIG_DIR"
    echo "CLAUDE_LOCAL_URL=$PORTAL_URL" > "$CONFIG_FILE"
    chmod 600 "$CONFIG_FILE"
    echo "Default config written to $CONFIG_FILE"
fi

# 5. Ensure ~/.local/bin is in PATH
add_to_path() {
    local rc_file="$1"
    if [ -f "$rc_file" ]; then
        if ! grep -q '\.local/bin' "$rc_file" 2>/dev/null; then
            echo '' >> "$rc_file"
            echo '# Added by claude-local installer' >> "$rc_file"
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$rc_file"
            echo "Added ~/.local/bin to PATH in $rc_file"
            return 0
        fi
    fi
    return 1
}

if ! echo "$PATH" | tr ':' '\n' | grep -q "$HOME/.local/bin"; then
    # Try common shell rc files
    added=false
    for rc in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
        if [ -f "$rc" ]; then
            add_to_path "$rc" && added=true
        fi
    done
    if [ "$added" = false ]; then
        # Fallback: add to .profile (created if needed)
        add_to_path "$HOME/.profile"
    fi
    export PATH="$HOME/.local/bin:$PATH"
fi

echo ""
echo "Installation complete!"
echo ""
echo "Get started:"
echo "  claude-local --login    # Authenticate with your AI Stack account"
echo "  claude-local            # Start Claude Code with local inference"
echo ""
echo "If 'claude-local' is not found, restart your shell or run:"
echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
