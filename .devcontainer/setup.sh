#!/bin/bash
set -e

echo "🚀 Starting Dev Container setup..."

echo "👤 Current user:"
whoami

echo "📦 Installing dependencies..."
bun ci

# init and execute personal setup script
if [ ! -f ".devcontainer/setup.personal.sh" ]; then
  cat << 'EOF' > .devcontainer/setup.personal.sh
#!/bin/bash
set -e

# Your personal setup steps here
EOF
  chmod +x .devcontainer/setup.personal.sh
fi
echo "🔧 Running personal setup..."
bash .devcontainer/setup.personal.sh

# Optional firewall setup (requires ENABLE_FIREWALL=true environment variable)
if [ "${ENABLE_FIREWALL:-false}" = "true" ]; then
  echo "🔥 Setting up firewall..."
  if [ -f ".devcontainer/init-firewall.sh" ]; then
    sudo bash .devcontainer/init-firewall.sh
  else
    echo "⚠️ Firewall script not found, skipping..."
  fi
fi

echo "✨ Dev Container setup completed successfully!"