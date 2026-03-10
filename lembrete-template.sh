#!/bin/bash
# ============================================================
# TEMPLATE DE LEMBRETE — Usar como base para novos lembretes
# Substitua MENSAGEM_AQUI pelo texto do lembrete
# ============================================================

# Carregar variáveis do .env
set -a
source /root/.openclaw/workspace/.env 2>/dev/null
set +a

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "text=🔔 MENSAGEM_AQUI"
