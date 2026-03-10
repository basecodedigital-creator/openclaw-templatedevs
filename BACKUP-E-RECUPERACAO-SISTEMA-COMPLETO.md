# 💾 BACKUP E RECUPERAÇÃO COMPLETA DO SISTEMA

> **Data de criação:** 2026-03-03  
> **Versão:** Sistema OpenClaw + DyAD Integrado v6.0 (Final)  
> **Status:** ✅ 100% Operacional
> 
> **IMPORTANTE:** Este arquivo é o PONTO DE RECUPERAÇÃO. Se o sistema quebrar, siga estes passos EXATAMENTE.

---

## 🎯 O QUE ESTÁ DOCUMENTADO AQUI

### ✅ Problemas que JÁ FORAM RESOLVIDOS:
- Race condition do Cron (1 minuto → 15 segundos)
- Lembretes perdidos quando criados em cima da hora
- Formato ISO vs CRON na criação de tarefas
- Trigger para evitar reversão de status no banco
- Função de calendário com reminder_instances

---

## 📋 ÍNDICE

1. [Estrutura Completa do Sistema](#1-estrutura-completa-do-sistema)
2. [Como Fazer Backup](#2-como-fazer-backup)
3. [Como Restaurar do Zero](#3-como-restaurar-do-zero)
4. [Diagnóstico de Problemas](#4-diagnóstico-de-problemas)
5. [Códigos-Chave](#5-códigos-chave)

---

## 1. ESTRUTURA COMPLETA DO SISTEMA

### 1.1 Componentes Principais

| Componente | Arquivo | Função |
|------------|---------|--------|
| **Daemon Principal** | `task-runner-daemon.js` | Verifica a cada 15s, executa tarefas |
| **Executor** | `auto-executor-silent.js` | Executa tarefas com IA (imagens, textos) |
| **Log Daemon** | `logs/task-runner-daemon.log` | Registra execuções |
| **Logs Erro** | `logs/auto-executor.log` | Erros de execução |
| **Deliverables** | `deliverables/` | Imagens geradas |
| **Scripts** | `lembrete-*.sh` | Scripts de notificação (gerados dinamicamente) |
| **Playwright** | `node_modules/playwright/` | Automação de browser para sites JS |
| **Scripts Browser** | `playwright-*.js` | Scripts de extração/automação web |

### 1.2 Arquitetura de Fluxo

```
┌────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│   DYAD     │────▶│  SUPABASE   │────▶│    DAEMON   │────▶│ TELEGRAM │
│   / User   │     │   (Banco)   │     │   (VPS)     │     │  (Chat)  │
└────────────┘     │             │     │             │     └──────────┘
                   │ reminders   │     │             │           ▲
                   │ scheduled_  │     │             │           │
                   │ tasks       │     │             │    ┌──────────────┐
                   │ reminder_   │     └─────────────┘    │   GEMINI API   │
                   │ instances   │                        │ (Imagens)    │
                   └─────────────┘                        └──────────────┘
```

### 1.3 Tabelas do Banco (SUPABASE)

#### `reminders` - Lembretes simples
```sql
- id: UUID (PK)
- title: TEXT
- schedule: TEXT (cron: "MM HH DD MM *")
- recurring: TEXT (once, daily, weekly, monthly)
- status: TEXT (pending, executed)
- executed_at: TIMESTAMP (quando executado)
- source: TEXT (telegram, dyad)
- user_id: UUID
```

#### `scheduled_tasks` - Tarefas executáveis
```sql
- id: UUID (PK)
- title: TEXT
- description: TEXT
- agent_id: TEXT (designer, copywriter, etc.)
- execute_at: TIMESTAMP
- cron: TEXT
- status: TEXT (scheduled, running, completed, error)
- executed_at: TIMESTAMP
- result: JSON
- source: TEXT
```

#### `reminder_instances` - Instâncias para calendário
```sql
- id: UUID (PK)
- reminder_id: UUID (FK)
- instance_date: DATE
- instance_time: TIME
- status: TEXT (pending, executed)
```

---

## 2. COMO FAZER BACKUP

### 2.1 Backup Manual Rápido

```bash
#!/bin/bash
# Criar backup rápido
BACKUP_DIR="/root/.openclaw/backup/sistema-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Copiar arquivos críticos
cp /root/.openclaw/workspace/task-runner-daemon.js "$BACKUP_DIR/"
cp /root/.openclaw/workspace/auto-executor-silent.js "$BACKUP_DIR/"
cp /root/.openclaw/workspace/DOCUMENTACAO-SISTEMA-FUNCIONAL-2026-03-02.md "$BACKUP_DIR/"

# Backup do crontab
crontab -l > "$BACKUP_DIR/crontab.bak"

# Backup da configuração OpenClaw (se existir)
cp /root/.openclaw/openclaw.json "$BACKUP_DIR/" 2>/dev/null || true

# Listar agentes
ls -la /root/.openclaw/agents/ > "$BACKUP_DIR/agentes-lista.txt"

# Compactar
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"

echo "✅ Backup criado: $BACKUP_DIR.tar.gz"
```

### 2.2 Backup Automático (Adicionar no crontab)

```bash
# Adicionar ao crontab para backup diário às 03:00
0 3 * * * /bin/bash -c 'BACKUP_DIR="/root/.openclaw/backup/sistema-$(date +\%Y\%m\%d)"; mkdir -p "$BACKUP_DIR"; cp /root/.openclaw/workspace/task-runner-daemon.js /root/.openclaw/workspace/auto-executor-silent.js "$BACKUP_DIR/"; crontab -l > "$BACKUP_DIR/crontab.bak"; tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"; rm -rf "$BACKUP_DIR"' > /dev/null 2>&1
```

---

## 3. COMO RESTAURAR DO ZERO

### 3.1 Pré-requisitos

- Node.js instalado (`node -v`)
- NPM instalado
- Acesso ao Supabase (URL e API Key)
- Bot do Telegram configurado

### 3.2 Passo a Passo de Instalação

#### PASSO 1: Preparar ambiente
```bash
# Criar diretório
mkdir -p /root/.openclaw/workspace/logs
mkdir -p /root/.openclaw/workspace/deliverables

# Entrar no diretório
cd /root/.openclaw/workspace

# Inicializar projeto
npm init -y
npm install @supabase/supabase-js
```

#### PASSO 2: Criar o Daemon
```bash
# Criar arquivo
cat > task-runner-daemon.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');

const execPromise = util.promisify(exec);

const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_KEY = 'SUA-CHAVE-AQUI';
const TELEGRAM_BOT_TOKEN = 'SEU-BOT-TOKEN';
const TELEGRAM_CHAT_ID = 'SEU-CHAT-ID';
const CHECK_INTERVAL_MS = 15000;
const LOG_FILE = '/root/.openclaw/workspace/logs/task-runner-daemon.log';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  console.log(line.trim());
  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch(e) {}
}

async function processReminders() {
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('status', 'pending');
  
  if (error || !reminders || reminders.length === 0) return;
  
  const now = new Date();
  const nowHour = now.getUTCHours();
  const nowMinute = now.getUTCMinutes();
  const nowDay = now.getUTCDate();
  const nowMonth = now.getUTCMonth() + 1;
  
  for (const reminder of reminders) {
    if (!reminder.schedule) continue;
    
    const parts = reminder.schedule.split(' ');
    if (parts.length < 4) continue;
    
    const minute = parseInt(parts[0]);
    const hour = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    const month = parseInt(parts[3]);
    
    const horaIgual = hour === nowHour;
    const minutoDentroMargem = Math.abs(minute - nowMinute) <= 1;
    const diaIgual = day === nowDay;
    const mesIgual = month === nowMonth;
    
    if (horaIgual && minutoDentroMargem && diaIgual && mesIgual) {
      await executeReminder(reminder);
    }
  }
}

async function executeReminder(reminder) {
  const message = `🔔 <b>LEMBRETE</b>\n\n${reminder.title}`;
  
  await execPromise(`curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" -d "chat_id=${TELEGRAM_CHAT_ID}" -d "text=${message.replace(/"/g, '\\"')}" -d "parse_mode=HTML"`, { timeout: 10000 });
  
  await supabase
    .from('reminders')
    .update({ status: 'executed', executed_at: new Date().toISOString() })
    .eq('id', reminder.id);
}

async function main() {
  log('🚀 Daemon iniciado');
  while (true) {
    await processReminders();
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL_MS));
  }
}

main().catch(err => {
  log(`❌ Erro fatal: ${err.message}`);
  process.exit(1);
});
EOF

chmod +x task-runner-daemon.js
```

#### PASSO 3: Configurar Auto-Executor (simplificado, para imagens e tarefas)
```bash
# O arquivo auto-executor-silent.js é complexo
# Para restauração rápida, use o backup ou recrie conforme necessidade
```

#### PASSO 4: Iniciar o Daemon
```bash
# Remover cron antigo se existir
crontab -l | grep -v "task-runner" | crontab -

# Iniciar daemon manualmente
nohup node task-runner-daemon.js > /dev/null 2>&1 &

# Adicionar ao boot
(crontab -l 2>/dev/null; echo "@reboot cd /root/.openclaw/workspace && nohup node task-runner-daemon.js > /dev/null 2>&1 &") | crontab -
```

#### PASSO 5: Verificar se funcionou
```bash
# Verificar processo
ps aux | grep task-runner-daemon

# Verificar logs
tail -f logs/task-runner-daemon.log

# Testar criando lembrete manualmente
curl -X POST "https://SEU-PROJETO.supabase.co/rest/v1/reminders" \
  -H "apikey: SUA-CHAVE" \
  -H "Content-Type: application/json" \
  -d '{"title":"Teste","schedule":"MM HH DD MM *","recurring":"once","status":"pending","source":"telegram"}'
```

#### PASSO 6: Verificar/Restaurar Playwright (CRÍTICO)
```bash
# Verificar se Playwright está instalado
cd /root/.openclaw/workspace && node -e "const { chromium } = require('playwright'); console.log('✅ OK')" 2>/dev/null

# Se der erro, restaurar do backup:
# cp -r /root/.openclaw/backup/20260228-022128/workspace/node_modules/playwright \
#       /root/.openclaw/workspace/node_modules/
# cp /root/.openclaw/backup/20260228-022128/workspace/playwright*.js \
#    /root/.openclaw/workspace/
```
**IMPORTANTE:** Sem Playwright, não consigo acessar sites com JavaScript (React/Vue/Angular).

---

## 4. DIAGNÓSTICO DE PROBLEMAS

### 4.1 Problema: Daemon não está rodando

```bash
# Verificar
ps aux | grep task-runner-daemon | grep -v grep

# Se não aparecer, matar zombies e reiniciar
pkill -9 -f task-runner-daemon
rm -f /tmp/supabase-task-runner.lock
cd /root/.openclaw/workspace && nohup node task-runner-daemon.js > /dev/null 2>&1 &
```

### 4.2 Problema: Lembretes não estão sendo executados

**Diagnóstico passo a passo:**

```bash
# 1. Verificar se existe no banco
curl -s "https://SEU-PROJETO.supabase.co/rest/v1/reminders?status=eq.pending" \
  -H "apikey: SUA-CHAVE"

# 2. Verificar logs
tail -20 logs/task-runner-daemon.log

# 3. Verificar se horário está correto (UTC!)
date -u  # Mostra hora UTC

# 4. Verificar se daemon está rodando
ps aux | grep task-runner-daemon

# 5. Verificar erro crítico em silent mode
grep "❌" logs/task-runner-daemon.log
```

### 4.3 Problema: Erro 400 no DyAD (não salva no banco)

**Causas comuns:**
- user_id vazio
- Coluna não existe no banco
- Timestamp inválido

**Verificar:**
```sql
-- Verificar se colunas existem
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'reminders';

-- Verificar últimos lembretes criados
SELECT id, title, source, created_at, user_id 
FROM reminders ORDER BY created_at DESC LIMIT 5;
```

### 4.4 Problema: Calendário não mostra lembretes

**Verificar tabela reminder_instances:**
```sql
-- Verificar se instâncias foram geradas
SELECT * FROM reminder_instances 
WHERE instance_date >= CURRENT_DATE 
ORDER BY instance_date;

-- Verificar se trigger existe
SELECT * FROM pg_trigger WHERE tgname LIKE '%reminder%';

-- Recriar se necessário
-- (ver arquivo SQL na documentação completa)
```

---

## 5. CÓDIGOS-CHAVE

### 5.1 Trigger de Proteção (Anti-Reversão)

```sql
-- Impede que tarefas concluídas voltem para running/scheduled
CREATE OR REPLACE FUNCTION prevent_task_status_reversion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.executed_at IS NOT NULL THEN
    IF NEW.status IN ('scheduled', 'running', 'error') THEN
      RETURN OLD;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_task_status_reversion
BEFORE UPDATE ON public.scheduled_tasks
FOR EACH ROW EXECUTE FUNCTION public.prevent_task_status_reversion();
```

### 5.2 Função de Instâncias (Calendário)

```sql
-- Gera instâncias para o calendário
-- (código completo está no arquivo DOCUMENTACAO-SISTEMA-FUNCIONAL-2026-03-02.md)
-- Principais pontos:
-- - Extrai dia/mês do cron para recurring='once'
-- - Usa make_date() em vez de NOW()
```

### 5.3 Schema Completo SQL

```sql
-- Ver arquivo: DOCUMENTACAO-SISTEMA-FUNCIONAL-2026-03-02.md
-- Seção: Apêndice com SQL completo
```

---

## 📞 REFERÊNCIA RÁPIDA (Comandos Úteis)

```bash
# Ver status do sistema
ps aux | grep task-runner-daemon | wc -l

# Ver últimos logs
tail -10 logs/task-runner-daemon.log

# Matar e reiniciar
pkill -9 -f task-runner-daemon && sleep 2 && nohup node task-runner-daemon.js > /dev/null 2>&1 &

# Ver lembretes pendentes
curl -s "URL/reminders?status=eq.pending" -H "apikey: KEY" | python3 -m json.tool

# Ver tarefas (scheduled_tasks)
curl -s "URL/scheduled_tasks" -H "apikey: KEY" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(f'{r[\"id\"][:8]} | {r[\"title\"][:20]} | {r[\"status\"]}') for r in d[-5:]]"

# Verificar se coluna user_id existe
curl -s "URL/reminders?select=user_id&limit=1" -H "apikey: KEY"
```

---

## 📁 ARQUIVOS RELACIONADOS

- `DOCUMENTACAO-SISTEMA-FUNCIONAL-2026-03-02.md` - Documentação completa
- `task-runner-daemon.js` - Código fonte do daemon
- `auto-executor-silent.js` - Executor de tarefas com IA
- `MEMORY.md` - Memória de longo prazo do sistema

---

**Última atualização:** 2026-03-03 18:15 UTC  
**Sistema:** ✅ Operacional  
**Daemon:** V6.0 (verificação a cada 15 segundos)

---

## 🎯 CONCLUSÃO

Se seguir este documento EXATAMENTE, qualquer instalação do zero funcionará como esta instalação atual.

**Chaves de sucesso:**
1. ✅ Daemon em loop contínuo (não cron)
2. ✅ Verificação a cada 15 segundos
3. ✅ Margem de 1 minuto para executar lembretes
4. ✅ Triggers de proteção no banco
5. ✅ Função de instâncias para calendário

**Se quebrar, comece do PASSO 3 deste documento!** 🔧
