FROM mcr.microsoft.com/devcontainers/base:2-trixie

# Install dependencies required for Bun, uv, and firewall
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    iptables \
    ipset \
    jq \
    dnsutils \
    aggregate \
    && rm -rf /var/lib/apt/lists/*

# Install Codex CLI
RUN set -euo pipefail \
    && ARCH="$(uname -m)" \
    && case "${ARCH}" in \
        x86_64|amd64) CODEX_TARGET="x86_64-unknown-linux-musl" ;; \
        aarch64|arm64) CODEX_TARGET="aarch64-unknown-linux-musl" ;; \
        *) echo "Unsupported architecture: ${ARCH}" >&2; exit 1 ;; \
    esac \
    && curl -L -o /tmp/codex.tar.gz "https://github.com/openai/codex/releases/latest/download/codex-${CODEX_TARGET}.tar.gz" \
    && tar -xzf /tmp/codex.tar.gz -C /tmp \
    && chmod +x "/tmp/codex-${CODEX_TARGET}" \
    && mv "/tmp/codex-${CODEX_TARGET}" /usr/local/bin/codex \
    && rm /tmp/codex.tar.gz

# Install Bun as vscode user
USER vscode
ENV BUN_INSTALL="/home/vscode/.bun"
ENV PATH="${BUN_INSTALL}/bin:${PATH}"

# Install Bun version 1.3.5
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.5"

# Install claude code 
RUN curl -fsSL https://claude.ai/install.sh | bash

WORKDIR /workspace/main