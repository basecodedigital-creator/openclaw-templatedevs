#!/bin/bash
# ============================================================
# setup.sh — Instalação Completa OpenClaw
# Versão: 2.0 | 2026-03-10
#
# Uso: curl -s https://raw.githubusercontent.com/basecodedigital-creator/openclaw-templatedevs/main/setup.sh | bash
# Ou:  bash setup.sh
#
# O que instala:
#   - Node.js 22
#   - OpenClaw (última versão)
#   - Dependências do workspace (Supabase, Playwright, etc.)
#   - uv (Python para nano-banana)
#   - Skill nano-banana-pro-2 (geração de imagens)
#   - Sub-agentes (copywriter, freellm, jiraiya, analista, etc.)
#   - API Bridge (sync modelo Dyad ↔ VPS, lembretes, restart-gateway)
#   - Task Runner Daemon
#   - Swap de 2GB
#   - Estrutura de pastas e documentação
#
# Pré-requisito: Ubuntu 22.04 LTS, acesso root
# ============================================================

set -e  # Para se houver erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()    { echo -e "${GREEN}✅ $1${NC}"; }
warn()   { echo -e "${YELLOW}⚠️  $1${NC}"; }
error()  { echo -e "${RED}❌ $1${NC}"; exit 1; }
info()   { echo -e "${BLUE}ℹ️  $1${NC}"; }
header() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# ============================================================
header "🚀 SETUP OPENCLAW — Início"
# ============================================================
echo ""
echo "Este script irá configurar o OpenClaw completo na sua VPS."
echo "Tempo estimado: 10-15 minutos."
echo ""

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
  error "Execute como root: sudo bash setup.sh"
fi

# Verificar Ubuntu
if ! grep -q "Ubuntu" /etc/os-release 2>/dev/null; then
  warn "Sistema não é Ubuntu. Continuando mesmo assim..."
fi

# ============================================================
header "📋 COLETA DE CREDENCIAIS"
# ============================================================
echo "Vamos configurar as credenciais do sistema."
echo "Pressione ENTER para pular itens opcionais."
echo ""

# Telegram (obrigatório)
echo -e "${YELLOW}1. TOKEN DO TELEGRAM BOT${NC}"
echo "   → Crie um bot em @BotFather no Telegram"
read -p "   Token (começa com números:AAH...): " TELEGRAM_BOT_TOKEN
[ -z "$TELEGRAM_BOT_TOKEN" ] && error "Token do Telegram é obrigatório"

echo ""
echo -e "${YELLOW}2. SEU CHAT ID DO TELEGRAM${NC}"
echo "   → Envie /start para @userinfobot no Telegram para descobrir"
read -p "   Chat ID (ex: 1436158393): " TELEGRAM_CHAT_ID
[ -z "$TELEGRAM_CHAT_ID" ] && error "Chat ID é obrigatório"

echo ""
echo -e "${YELLOW}3. OPENROUTER API KEY${NC}"
echo "   → Crie em: https://openrouter.ai/keys"
read -p "   Key (começa com sk-or-...): " OPENROUTER_API_KEY
[ -z "$OPENROUTER_API_KEY" ] && error "OpenRouter API Key é obrigatória"

echo ""
echo -e "${YELLOW}4. GEMINI API KEY (para geração de imagens)${NC}"
echo "   → Crie em: https://aistudio.google.com/apikey"
read -p "   Key (começa com AIzaSy...): " GEMINI_API_KEY
[ -z "$GEMINI_API_KEY" ] && warn "Gemini não configurado — geração de imagens não funcionará"

echo ""
echo -e "${YELLOW}5. SUPABASE (opcional — para sistema visual Dyad/Lovable)${NC}"
read -p "   Supabase URL (ex: https://xxx.supabase.co) ou ENTER para pular: " SUPABASE_URL
if [ -n "$SUPABASE_URL" ]; then
  read -p "   Supabase Service Key (começa com sb_secret...): " SUPABASE_KEY
fi

echo ""
echo -e "${YELLOW}6. GITHUB TOKEN (opcional — para backup automático no GitHub)${NC}"
echo "   → Crie em: https://github.com/settings/tokens (escopo: repo)"
read -p "   Token (começa com ghp_...) ou ENTER para pular: " GITHUB_TOKEN
if [ -n "$GITHUB_TOKEN" ]; then
  read -p "   Repositório GitHub (ex: usuario/repo-name): " GITHUB_REPO
fi

echo ""
echo -e "${YELLOW}7. OPENCLAW GATEWAY TOKEN (deixe em branco para gerar automaticamente)${NC}"
read -p "   Token do gateway ou ENTER para gerar: " CUSTOM_GATEWAY_TOKEN

echo ""
log "Credenciais coletadas!"

# ============================================================
header "🔧 INSTALAÇÃO — Sistema Base"
# ============================================================

info "Atualizando pacotes..."
apt-get update -qq
apt-get install -y -qq curl wget git python3 python3-pip build-essential

# ============================================================
header "📦 INSTALAÇÃO — Node.js 22"
# ============================================================

if node --version 2>/dev/null | grep -q "v22"; then
  log "Node.js 22 já instalado: $(node --version)"
else
  info "Instalando Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
  log "Node.js instalado: $(node --version)"
fi

# ============================================================
header "🦞 INSTALAÇÃO — OpenClaw"
# ============================================================

if openclaw --version 2>/dev/null; then
  log "OpenClaw já instalado: $(openclaw --version)"
else
  info "Instalando OpenClaw (sem wizard — configuramos depois)..."
  # --no-onboard pula o wizard interativo completamente
  curl -fsSL --proto "=https" --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
  log "OpenClaw instalado: $(openclaw --version)"
fi

# ============================================================
header "📁 CONFIGURAÇÃO — Workspace"
# ============================================================

WORKSPACE="/root/.openclaw/workspace"
mkdir -p "$WORKSPACE"
mkdir -p "$WORKSPACE/deliverables"
mkdir -p "$WORKSPACE/logs"
mkdir -p "$WORKSPACE/memory"
mkdir -p "$WORKSPACE/reminders"
cd "$WORKSPACE"

info "Clonando repositório com templates e documentação..."
if [ -d "$WORKSPACE/.git" ]; then
  git pull origin main 2>/dev/null || warn "Não foi possível atualizar o repo"
else
  git clone https://github.com/basecodedigital-creator/openclaw-templatedevs.git /tmp/openclaw-setup
  cp -r /tmp/openclaw-setup/. "$WORKSPACE/"
  rm -rf /tmp/openclaw-setup
fi
log "Repositório clonado"

# ============================================================
header "🔑 CONFIGURAÇÃO — Credenciais (.env)"
# ============================================================

cat > "$WORKSPACE/.env" << ENVEOF
# ====================================
# .env — Credenciais do Sistema
# NUNCA commitar este arquivo
# ====================================

TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
GEMINI_API_KEY=${GEMINI_API_KEY}
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_KEY=${SUPABASE_KEY}
SUPABASE_SERVICE_KEY=${SUPABASE_KEY}
GITHUB_TOKEN=${GITHUB_TOKEN}
GITHUB_REPO=${GITHUB_REPO}
ENVEOF

chmod 600 "$WORKSPACE/.env"
log ".env criado com suas credenciais"

# ============================================================
header "⚙️  CONFIGURAÇÃO — OpenClaw"
# ============================================================

mkdir -p /root/.openclaw

# Gerar token aleatório para o gateway (ou usar o informado)
if [ -n "$CUSTOM_GATEWAY_TOKEN" ]; then
  GATEWAY_TOKEN="$CUSTOM_GATEWAY_TOKEN"
else
  GATEWAY_TOKEN=$(openssl rand -hex 24)
fi

cat > /root/.openclaw/openclaw.json << CONFEOF
{
  "meta": { "lastTouchedVersion": "2026.3.2" },
  "wizard": {
    "lastRunAt": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
    "lastRunVersion": "2026.3.2",
    "lastRunCommand": "setup",
    "lastRunMode": "local"
  },
  "auth": {
    "profiles": {
      "openrouter:default": {
        "provider": "openrouter",
        "mode": "api_key",
        "apiKey": "${OPENROUTER_API_KEY}"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "openrouter/anthropic/claude-sonnet-4.6" },
      "models": {
        "openrouter/auto": { "alias": "OpenRouter" },
        "openrouter/anthropic/claude-sonnet-4.6": {},
        "openrouter/anthropic/claude-3.5-haiku": {},
        "openrouter/openai/gpt-4o-mini": {},
        "openrouter/openai/gpt-4o": {},
        "openrouter/mistralai/mistral-nemo": {},
        "openrouter/moonshotai/kimi-k2.5": {}
      },
      "workspace": "${WORKSPACE}",
      "compaction": { "mode": "safeguard" },
      "maxConcurrent": 4,
      "subagents": { "maxConcurrent": 8, "model": "openrouter/openai/gpt-4o-mini" }
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "dmPolicy": "pairing",
      "botToken": "${TELEGRAM_BOT_TOKEN}",
      "groupPolicy": "allowlist",
      "streamMode": "off"
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback",
    "auth": { "mode": "token", "token": "${GATEWAY_TOKEN}" }
  }
}
CONFEOF

chmod 600 /root/.openclaw/openclaw.json
log "openclaw.json configurado"

# ============================================================
header "🤖 CONFIGURAÇÃO — Sub-agentes"
# ============================================================

mkdir -p /root/.openclaw/agents/{main,copywriter,freellm,jiraiya,analista,designer,barato,nexus,operacional}

# Agente main (Luana)
cat > /root/.openclaw/agents/main/agent.json << 'EOF'
{
  "id": "main",
  "name": "Luana Devs",
  "emoji": "⚡"
}
EOF

# Copywriter
cat > /root/.openclaw/agents/copywriter/agent.json << 'EOF'
{
  "id": "copywriter",
  "name": "Copywriter Premium",
  "emoji": "✍️",
  "model": "openrouter/openai/gpt-4o",
  "systemPrompt": "Você é um Copywriter Sênior Especialista em Conversão. Use frameworks AIDA, PAS e 4U's. Entregue copy persuasiva, direta e com gatilhos éticos. Headlines impactantes, CTAs irresistíveis.",
  "maxTokens": 4000,
  "temperature": 0.75,
  "channel": "telegram"
}
EOF

# Freellm
cat > /root/.openclaw/agents/freellm/agent.json << 'EOF'
{
  "id": "freellm",
  "name": "freellm",
  "emoji": "🔧",
  "model": "openrouter/mistralai/mistral-nemo",
  "description": "Estrategista, Planejador e Executor de tarefas auxiliares",
  "channel": "telegram"
}
EOF

# Analista
cat > /root/.openclaw/agents/analista/agent.json << 'EOF'
{
  "id": "analista",
  "name": "Analista de Dados",
  "emoji": "📊",
  "model": "openrouter/anthropic/claude-sonnet-4.6",
  "systemPrompt": "Você é um analista de dados e estrategista de marketing. Baseie análises em dados, forneça insights acionáveis, use frameworks reconhecidos. Especialidades: métricas de marketing, funil de vendas, campanhas pagas.",
  "maxTokens": 8000,
  "temperature": 0.3,
  "channel": "telegram"
}
EOF

# Designer
cat > /root/.openclaw/agents/designer/agent.json << 'EOF'
{
  "id": "designer",
  "name": "Designer de Imagens",
  "emoji": "🎨",
  "model": "openrouter/openai/gpt-4o-mini",
  "channel": "telegram"
}
EOF

# Barato
cat > /root/.openclaw/agents/barato/agent.json << 'EOF'
{
  "id": "barato",
  "name": "Assistente Rápido",
  "emoji": "⚡",
  "model": "openrouter/openai/gpt-4o-mini",
  "channel": "telegram"
}
EOF

# Jiraiya Dev
cat > /root/.openclaw/agents/jiraiya/agent.json << 'EOF'
{
  "id": "jiraiya",
  "name": "Jiraiya Dev",
  "emoji": "🐸",
  "model": "openrouter/mistralai/mistral-nemo",
  "systemPrompt": "Você é Jiraiya Dev — um desenvolvedor sênior lendário, mestre em código limpo, arquitetura de sistemas e criação de produtos digitais.\n\n🐸 IDENTIDADE:\n- Desenvolvedor full-stack com 15+ anos de experiência\n- Especialista em React, Next.js, Node.js, Python, bancos de dados SQL e NoSQL\n- Arquiteto de sistemas escaláveis e APIs robustas\n- Apaixonado por código limpo, boas práticas e soluções elegantes\n- Tom direto, técnico quando preciso, mas acessível — como um mentor sênior\n\n💻 ESPECIALIDADES:\n- Frontend: React, Next.js, Vue, Tailwind CSS, TypeScript\n- Backend: Node.js, Python, FastAPI, Express, REST APIs, GraphQL\n- Banco de Dados: PostgreSQL, MySQL, MongoDB, Supabase, Redis\n- DevOps: Docker, CI/CD, GitHub Actions, Vercel, VPS, Linux\n- Automação: Scripts bash, cron jobs, web scraping, Playwright\n\n🎯 COMO TRABALHA:\n1. Entende o problema antes de propor solução\n2. Explica o raciocínio — nunca só joga código\n3. Código comentado e organizado por padrão\n4. Alerta sobre riscos e edge cases\n5. Entrega pronto para produção\n\n⚡ REGRA: Um código bem escrito hoje evita três noites de debug amanhã.",
  "maxTokens": 8000,
  "temperature": 0.4,
  "workspace": "/root/.openclaw/workspace",
  "channel": "telegram"
}
EOF

# Nexus
cat > /root/.openclaw/agents/nexus/agent.json << 'EOF'
{
  "id": "nexus",
  "name": "Nexus Copy",
  "emoji": "✍️",
  "model": "openrouter/openai/gpt-4o-mini",
  "systemPrompt": "Você é o Nexus, especialista em copywriting.\n\nREGRAS:\n1. Crie copy persuasiva e direta\n2. Use gatilhos mentais éticos\n3. Foque em conversão\n4. Entregue 3 opções quando solicitado\n5. Seja completo e detalhado conforme necessidade\n\nÁREAS:\n- Headlines e títulos\n- Textos para redes sociais\n- Scripts de anúncios\n- Email marketing\n- Páginas de vendas",
  "maxTokens": 2000,
  "temperature": 0.8,
  "workspace": "/root/.openclaw/workspace",
  "channel": "telegram"
}
EOF

# Operacional
cat > /root/.openclaw/agents/operacional/agent.json << 'EOF'
{
  "id": "operacional",
  "name": "Operacional",
  "emoji": "⚙️",
  "model": "openrouter/openai/gpt-4o-mini",
  "systemPrompt": "Você é o agente Operacional, especialista em execução de tarefas operacionais.\n\nREGRAS:\n1. Execute tarefas de forma eficiente e direta\n2. Gere relatórios e documentação\n3. Seja objetivo - sem textos longos desnecessários\n4. Sempre confirme quando a tarefa for concluída",
  "maxTokens": 2000,
  "temperature": 0.7,
  "workspace": "/root/.openclaw/workspace",
  "channel": "telegram"
}
EOF

log "Sub-agentes configurados"

# ============================================================
header "🐍 INSTALAÇÃO — uv (Python)"
# ============================================================

if /root/.local/bin/uv --version 2>/dev/null; then
  log "uv já instalado: $(/root/.local/bin/uv --version)"
else
  info "Instalando uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  log "uv instalado"
fi

# ============================================================
header "🍌 INSTALAÇÃO — Skill nano-banana (Imagens)"
# ============================================================

mkdir -p /root/.openclaw/skills
if [ -d "/root/.openclaw/skills/nano-banana-pro-2" ]; then
  log "nano-banana já instalado"
else
  info "Instalando nano-banana (cópia direta — sem wizard)..."
  if [ -d "$WORKSPACE/skills/nano-banana-pro-2" ]; then
    cp -r "$WORKSPACE/skills/nano-banana-pro-2" /root/.openclaw/skills/
    pip3 install -q google-generativeai pillow requests 2>/dev/null
    log "nano-banana instalado via cópia direta"
  else
    warn "Skill nano-banana não encontrada no workspace — geração de imagens não disponível"
  fi
fi

# ============================================================
header "🌐 INSTALAÇÃO — Dependências Node.js"
# ============================================================

cd "$WORKSPACE"
info "Instalando dependências..."
npm install --save \
  @supabase/supabase-js \
  express \
  node-fetch \
  playwright 2>/dev/null
log "Dependências instaladas"

info "Instalando browsers Playwright..."
npx playwright install chromium 2>/dev/null || warn "Playwright browsers: instalar manualmente se necessário"

# ============================================================
header "🔄 CONFIGURAÇÃO — Swap 2GB"
# ============================================================

if [ -f /swapfile ]; then
  log "Swap já configurado"
else
  info "Criando swap de 2GB..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  /sbin/mkswap /swapfile
  /sbin/swapon /swapfile
  grep -q "/swapfile" /etc/fstab || echo "/swapfile none swap sw 0 0" >> /etc/fstab
  log "Swap 2GB criado e permanente"
fi

# ============================================================
header "⚙️  CONFIGURAÇÃO — Serviço systemd"
# ============================================================

info "Configurando OpenClaw como serviço..."
openclaw gateway install 2>/dev/null || systemctl enable openclaw-gateway 2>/dev/null || warn "Configurar serviço manualmente"

# Criar auth-profiles.json para todos os agentes (evita erro "No API key found")
info "Configurando autenticação dos agentes..."
for AGENT_ID in main copywriter freellm jiraiya analista designer barato nexus operacional; do
  AGENT_AUTH_DIR="/root/.openclaw/agents/${AGENT_ID}/agent"
  mkdir -p "$AGENT_AUTH_DIR"
  cat > "$AGENT_AUTH_DIR/auth-profiles.json" << AUTHEOF
{
  "version": 1,
  "profiles": {
    "openrouter:default": {
      "type": "api_key",
      "provider": "openrouter",
      "key": "${OPENROUTER_API_KEY}"
    }
  },
  "lastGood": {
    "openrouter": "openrouter:default"
  }
}
AUTHEOF
done
log "Auth configurado para todos os agentes"

# Iniciar gateway
openclaw gateway start 2>/dev/null || systemctl start openclaw-gateway 2>/dev/null
sleep 5

if openclaw status 2>/dev/null | grep -q "running"; then
  log "Gateway OpenClaw rodando"
else
  warn "Gateway não iniciou automaticamente. Rode manualmente: openclaw gateway start"
fi

# ============================================================
header "🔌 CONFIGURAÇÃO — API Bridge"
# ============================================================

API_BRIDGE_DIR="$WORKSPACE/api-bridge"

if [ -d "$API_BRIDGE_DIR" ] && [ -f "$API_BRIDGE_DIR/server.js" ]; then
  log "API Bridge já instalado"
else
  info "Criando API Bridge..."
  mkdir -p "$API_BRIDGE_DIR"

  # package.json
  cat > "$API_BRIDGE_DIR/package.json" << 'EOF'
{
  "name": "api-bridge",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "@supabase/supabase-js": "^2.98.0",
    "cors": "^2.8.6",
    "dotenv": "^17.3.1",
    "express": "^5.2.1",
    "node-cron": "^4.2.1",
    "uuid": "^13.0.0",
    "ws": "^8.19.0"
  }
}
EOF

  cd "$API_BRIDGE_DIR" && npm install --quiet
  warn "API Bridge: instale o server.js manualmente ou restaure do backup. Consulte BACKUP-E-RECUPERACAO-SISTEMA-COMPLETO.md"
fi

# Criar .env para api-bridge
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ]; then
  # Capturar GATEWAY_TOKEN do openclaw.json
  GW_TOKEN=$(python3 -c "import json; d=json.load(open('/root/.openclaw/openclaw.json')); print(d['gateway']['auth']['token'])" 2>/dev/null || echo "$GATEWAY_TOKEN")

  cat > "$API_BRIDGE_DIR/.env" << ABENV
PORT=3001
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=${GW_TOKEN}
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_KEY=${SUPABASE_KEY}
API_SECRET=dev-secret
ABENV
  chmod 600 "$API_BRIDGE_DIR/.env"
  log "API Bridge .env configurado"
fi

# Criar serviço systemd para api-bridge
cat > /etc/systemd/system/api-bridge.service << EOF
[Unit]
Description=OpenClaw API Bridge
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${API_BRIDGE_DIR}
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
StandardOutput=append:/tmp/api-bridge.log
StandardError=append:/tmp/api-bridge.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable api-bridge 2>/dev/null
[ -f "$API_BRIDGE_DIR/server.js" ] && systemctl start api-bridge && log "API Bridge serviço systemd criado e iniciado" || warn "API Bridge serviço criado mas não iniciado (server.js ausente)"

# ============================================================
header "🔧 CONFIGURAÇÃO — Script restart-gateway"
# ============================================================

cat > /usr/local/bin/restart-gateway.sh << 'EOF'
#!/bin/bash
# Restart gateway desacoplado — chamado pelo api-bridge sem await
# Necessário pois systemctl --user falha sem sessão D-Bus ativa
sleep 1
pkill -f openclaw-gateway || true
sleep 3
nohup openclaw-gateway > /tmp/gateway.log 2>&1 &
echo "[$(date)] Gateway reiniciado via script" >> /tmp/gateway-restart.log
EOF

chmod +x /usr/local/bin/restart-gateway.sh
log "restart-gateway.sh criado em /usr/local/bin/"

# ============================================================
header "🔄 CONFIGURAÇÃO — Task Runner Daemon"
# ============================================================

if [ -f "$WORKSPACE/task-runner-daemon.js" ] && [ -n "$SUPABASE_URL" ]; then
  info "Iniciando Task Runner Daemon..."
  nohup node "$WORKSPACE/task-runner-daemon.js" >> "$WORKSPACE/logs/task-runner-daemon.log" 2>&1 &
  log "Task Runner iniciado (PID: $!)"
else
  warn "Task Runner não iniciado — Supabase não configurado ou arquivo não encontrado"
fi

# ============================================================
header "🧹 CONFIGURAÇÃO — Cron de manutenção"
# ============================================================

# Limpar processos whisper travados a cada 15min
(crontab -l 2>/dev/null | grep -v "limpar-whisper"; echo "*/15 * * * * $WORKSPACE/limpar-whisper-travados.sh >> /var/log/whisper-cleanup.log 2>&1") | crontab - 2>/dev/null
log "Cron de manutenção configurado"

# ============================================================
header "📄 CONFIGURAÇÃO — Arquivos de identidade"
# ============================================================

# Renomear templates para arquivos reais (mantendo os templates no git)
[ -f "$WORKSPACE/BRAIN-template.md" ] && [ ! -f "$WORKSPACE/BRAIN.md" ] && cp "$WORKSPACE/BRAIN-template.md" "$WORKSPACE/BRAIN.md"
[ -f "$WORKSPACE/MEMORY-template.md" ] && [ ! -f "$WORKSPACE/MEMORY.md" ] && cp "$WORKSPACE/MEMORY-template.md" "$WORKSPACE/MEMORY.md"
[ -f "$WORKSPACE/GUIA-IMAGENS-template.md" ] && [ ! -f "$WORKSPACE/GUIA-IMAGENS.md" ] && cp "$WORKSPACE/GUIA-IMAGENS-template.md" "$WORKSPACE/GUIA-IMAGENS.md"

# Atualizar GEMINI_API_KEY no BRAIN.md e GUIA-IMAGENS.md com a key real
if [ -n "$GEMINI_API_KEY" ]; then
  sed -i "s|\${GEMINI_API_KEY}|${GEMINI_API_KEY}|g" "$WORKSPACE/BRAIN.md" 2>/dev/null
  sed -i "s|\${GEMINI_API_KEY}|${GEMINI_API_KEY}|g" "$WORKSPACE/GUIA-IMAGENS.md" 2>/dev/null
fi
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
  sed -i "s|\${TELEGRAM_BOT_TOKEN}|${TELEGRAM_BOT_TOKEN}|g" "$WORKSPACE/BRAIN.md" 2>/dev/null
fi
if [ -n "$TELEGRAM_CHAT_ID" ]; then
  sed -i "s|\${TELEGRAM_CHAT_ID}|${TELEGRAM_CHAT_ID}|g" "$WORKSPACE/BRAIN.md" 2>/dev/null
fi

log "Arquivos de documentação configurados"

# Exportar GEMINI_API_KEY no .bashrc para skills funcionarem
if [ -n "$GEMINI_API_KEY" ]; then
  grep -q "GEMINI_API_KEY" /root/.bashrc 2>/dev/null || \
    echo "export GEMINI_API_KEY=\"${GEMINI_API_KEY}\"" >> /root/.bashrc
  export GEMINI_API_KEY="${GEMINI_API_KEY}"
  log "GEMINI_API_KEY exportada no ambiente"
fi

# Criar trocar-modelo.sh
cat > "$WORKSPACE/trocar-modelo.sh" << 'TMEOF'
#!/bin/bash
# trocar-modelo.sh — Troca o modelo do agente principal
# Uso: ./trocar-modelo.sh <modelo>
NOVO_MODELO="$1"
CONFIG="/root/.openclaw/openclaw.json"

if [ -z "$NOVO_MODELO" ]; then
  echo "❌ Uso: $0 <modelo>"
  echo ""
  echo "Modelos disponíveis:"
  echo "  openrouter/anthropic/claude-sonnet-4.6"
  echo "  openrouter/moonshotai/kimi-k2.5"
  echo "  openrouter/openai/gpt-4o-mini"
  echo "  openrouter/mistralai/mistral-nemo"
  echo "  openrouter/openai/gpt-4o"
  echo "  openrouter/anthropic/claude-3.5-haiku"
  exit 1
fi

BACKUP="$CONFIG.bak-modelo-$(date +%Y%m%d-%H%M%S)"
cp "$CONFIG" "$BACKUP"
python3 -c "
import json, sys
with open('$CONFIG') as f: d = json.load(f)
d['agents']['defaults']['model']['primary'] = '$NOVO_MODELO'
for a in d.get('agents', {}).get('list', []):
    if a['id'] == 'main': a['model'] = '$NOVO_MODELO'
with open('$CONFIG', 'w') as f: json.dump(d, f, indent=2)
print('✅ Modelo atualizado para: $NOVO_MODELO')
"
echo "🔄 Reiniciando gateway..."
/usr/local/bin/restart-gateway.sh
echo "✅ Pronto! Aguarde 5 segundos e teste."
TMEOF
chmod +x "$WORKSPACE/trocar-modelo.sh"
log "trocar-modelo.sh criado"

# Criar salvar-github.sh (só se GITHUB_TOKEN foi informado)
if [ -n "$GITHUB_TOKEN" ]; then
  cat > "$WORKSPACE/salvar-github.sh" << SGEOF
#!/bin/bash
# salvar-github.sh — Push rápido para o GitHub
MSG="\${1:-Atualização automática \$(date '+%Y-%m-%d %H:%M')}"
WORKSPACE="/root/.openclaw/workspace"
cd "\$WORKSPACE"
set -a; source "\$WORKSPACE/.env" 2>/dev/null; set +a
if [ -z "\$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN não encontrado no .env"; exit 1
fi
git remote set-url origin "https://\${GITHUB_TOKEN}@github.com/${GITHUB_REPO:-SEU-USUARIO/SEU-REPO}.git"
echo "📦 Salvando no GitHub..."
git add -A && git commit -m "📝 \$MSG" && git push origin main
echo "✅ Salvo no GitHub!"
SGEOF
  chmod +x "$WORKSPACE/salvar-github.sh"
  log "salvar-github.sh criado"
else
  warn "GITHUB_TOKEN não informado — salvar-github.sh não criado"
fi

# ============================================================
header "✅ INSTALAÇÃO CONCLUÍDA"
# ============================================================

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🎉 OpenClaw instalado com sucesso!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📱 PRÓXIMOS PASSOS:"
echo ""
echo "  1. Se o gateway não iniciou: openclaw gateway start"
echo "  2. Abra o Telegram e envie /start para o seu bot"
echo "  3. Na VPS rode: openclaw pairing list"
echo "  4. Aprove o código: openclaw pairing approve CODIGO"
echo ""
echo "🔍 VERIFICAR STATUS:"
echo "  openclaw status"
echo ""
echo "📁 WORKSPACE:"
echo "  $WORKSPACE"
echo ""
echo "🔑 CREDENCIAIS:"
echo "  $WORKSPACE/.env"
echo ""
if [ -n "$SUPABASE_URL" ]; then
  echo "🗄️  SISTEMA EXTERNO (Dyad/Lovable):"
  echo "  Configure seu frontend apontando para: $SUPABASE_URL"
  echo ""
fi
echo -e "${YELLOW}⚠️  IMPORTANTE: Guarde as credenciais em local seguro!${NC}"
echo ""
