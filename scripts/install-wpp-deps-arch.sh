#!/usr/bin/env bash
# Dependências do Chrome/Puppeteer no Arch Linux (WSL ou nativo).
set -euo pipefail

sudo pacman -Sy --needed --noconfirm \
    atk at-spi2-core nss nspr alsa-lib cairo pango \
    libxkbcommon libxcomposite libxdamage libxfixes libxrandr \
    libdrm mesa cups libxi libxtst libxshmfence gtk3

# Opcional: usa o Chromium do sistema (recomendado no Arch)
if ! command -v chromium >/dev/null 2>&1; then
    echo "Instalando chromium (opcional, mas recomendado)..."
    sudo pacman -S --needed --noconfirm chromium || true
fi

echo "Pronto. Rode: npm run wpp"
