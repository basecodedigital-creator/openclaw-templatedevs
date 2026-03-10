#!/bin/bash
# Instala o Supabase Task Runner
# Agora ele roda a cada minuto via cron

echo "🔧 Instalando Supabase Task Runner..."

# Criar diretório de logs
mkdir -p /root/.openclaw/workspace/logs

# Adicionar ao crontab
CRON_LINE="* * * * * cd /root/.openclaw/workspace && /usr/bin/node supabase-task-runner.js >> /root/.openclaw/workspace/logs/task-runner-cron.log 2>&1"

# Verificar se já existe
if crontab -l 2>/dev/null | grep -q "supabase-task-runner"; then
  echo "⚠️  Task runner já está no crontab"
else
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "✅ Adicionado ao crontab (roda a cada minuto)"
fi

# Dar permissão de execução
chmod +x /root/.openclaw/workspace/supabase-task-runner.js

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Status:"
crontab -l | grep "supabase-task-runner" || echo "❌ Não encontrado no crontab"
echo ""
echo "🧪 Testando execução..."
cd /root/.openclaw/workspace && node supabase-task-runner.js
echo ""
echo "📁 Logs em: /root/.openclaw/workspace/logs/"
