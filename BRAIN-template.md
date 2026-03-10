# 🧠 BRAIN.md — Memória Muscular da Luana

> **LEIA ESTE ARQUIVO PRIMEIRO em toda sessão.**
> Aqui estão os processos críticos prontos para executar. Sem precisar procurar em outros arquivos.
> Se algo mudou, atualize AQUI primeiro.

---

## 🔴 REGRA DE OURO — INSTALAÇÃO NÃO ESTÁ CONCLUÍDA SEM DOCUMENTAR

```
Toda vez que instalar skill, configurar processo, criar automação ou descobrir
um novo fluxo de execução → OBRIGATÓRIO antes de dizer "pronto":

  1. ✅ Adicionar receita (comando exato) na seção PROCESSOS CRÍTICOS abaixo
  2. ✅ Adicionar na tabela SKILLS REGISTRY (seção logo abaixo)
  3. ✅ Atualizar MEMORY.md (seção Componentes ou Skills)
  4. ✅ Criar GUIA-NOME.md se processo tiver mais de 10 linhas
  5. ✅ Confirmar para Pedro: "Instalado e documentado no BRAIN.md ✅"

SEM ESSES 5 PASSOS = TAREFA INCOMPLETA.
```

---

## 📦 SKILLS REGISTRY — Tudo Instalado (Visão Rápida)

| # | Nome | Tipo | Função | Como Usar | Status | Data |
|---|------|------|--------|-----------|--------|------|
| 1 | nano-banana-pro-2 | Skill | Gerar imagens via Gemini | Ver processo #1 abaixo | ✅ Ativo | 2026-02 |
| 2 | Playwright | Lib Node | Acesso a sites com JavaScript | Ver processo #3 abaixo | ✅ Ativo | 2026-02 |
| 3 | Whisper | Serviço | Transcrição de áudio | `transcricao status/start/stop` | ✅ Ativo | 2026-02 |
| 4 | Task Runner | Daemon | Executa tarefas do Dyad/Supabase | Automático via daemon | ✅ Ativo | 2026-03 |
| 5 | API Bridge | Serviço systemd | Integração Dyad ↔ VPS + sync modelo | `systemctl status api-bridge` | ✅ Ativo | 2026-03 |
| 6 | #copywriter | Sub-agente | Copy e headlines profissionais | `#copywriter [tarefa]` | ✅ Ativo | 2026-02 |
| 7 | #freellm | Sub-agente | Estratégia, pesquisa, execução | `#freellm [tarefa]` | ✅ Ativo | 2026-02 |
| 8 | GitHub repo | Versionamento | Backup de documentação e código | `./salvar-github.sh "msg"` | ✅ Ativo | 2026-03-06 |
| 9 | sync-model | API Bridge route | Sincroniza modelo Dyad → VPS | `POST /api/agents/sync-model` | ✅ Ativo | 2026-03-07 |
| 10 | trocar-modelo.sh | Script | Troca modelo do agente principal | `./trocar-modelo.sh openrouter/MODELO` | ✅ Ativo | 2026-03-07 |
| 11 | #jiraiya | Sub-agente | Desenvolvimento código e sites | `#jiraiya [tarefa]` | ✅ Ativo | 2026-03-08 |
| 12 | api-bridge/lembretes | API | Criar lembretes sincronizados Dyad | Ver processo #2 abaixo | ✅ Ativo | 2026-03-08 |

> **Quando instalar algo novo:** adicionar linha nessa tabela antes de finalizar.

---

## 🔖 CHECKPOINT — Comando de Resumo de Sessão

### Como funciona:
- Pedro digita `#checkpoint` no chat
- Eu gero um resumo estratégico da conversa atual
- Salvo em `memory/session-atual.md` (sobrescreve sempre — arquivo único)
- Pedro pode trocar modelo ou resetar sessão
- **No início de qualquer sessão nova: ler `memory/session-atual.md` automaticamente se existir**

### Regra de boot (OBRIGATÓRIO):
```
Se memory/session-atual.md existir → ler silenciosamente antes de responder
Não perguntar, não comentar — apenas absorver o contexto e continuar
```

### Comando #reset (limpeza manual via Telegram):
Quando Pedro digitar `#reset` no chat:
1. Confirmar que `memory/session-atual.md` existe (se não existir, avisar para fazer #checkpoint antes)
2. Chamar o endpoint de reset:
```bash
curl -s -X POST http://localhost:3001/api/agents/reset-session
```
3. Avisar Pedro: "Sessão resetada — pode levar alguns segundos. Mande uma mensagem para confirmar que voltei."
4. ⚠️ A confirmação pode não aparecer imediatamente pois o gateway reinicia — isso é NORMAL

### Fluxo completo recomendado:
```
#checkpoint → confirmo salvamento
#reset      → sessão limpa, gateway reinicia
[aguardar 5-10s]
[nova mensagem] → já leio session-atual.md e continuo do ponto certo
```

### Estrutura padrão do resumo (sempre seguir esse template):
```markdown
# Session Checkpoint — YYYY-MM-DD HH:MM

## O que estava sendo feito
[1-3 linhas do contexto principal da conversa]

## Decisões tomadas
[lista das decisões relevantes — arquivos alterados, configs mudadas]

## Pendências
[o que ficou para fazer]

## Contexto técnico relevante
[detalhes técnicos que precisam sobreviver ao reset]
```

### O que INCLUIR no resumo:
- Bugs encontrados e status (resolvido/pendente)
- Arquivos modificados e o que mudou
- Decisões arquiteturais tomadas
- O que estava no meio quando rodou #checkpoint

### O que EXCLUIR do resumo:
- Explicações longas já documentadas em outros arquivos
- Conteúdo que já está no BRAIN.md ou MEMORY.md
- Perguntas e respostas de diagnóstico já resolvidas
- Qualquer coisa que possa ser recuperada de outro arquivo

> **Objetivo:** resumo deve ter no máximo 40-60 linhas. Suficiente para continuar, não para reler tudo.

---

## ⚡ PROCESSOS CRÍTICOS (Receitas Prontas)

### 1. 🎨 GERAR IMAGEM (via chat Telegram)

```bash
cd /root/.openclaw/workspace/deliverables && \
GEMINI_API_KEY="${GEMINI_API_KEY}" \
timeout 120 /root/.local/bin/uv run \
/root/.openclaw/skills/nano-banana-pro-2/scripts/generate_image.py \
--prompt "DESCRIÇÃO EM INGLÊS DETALHADA" \
--filename "nome-$(date +%H%M).png" \
--resolution 2K
```

**Enviar no Telegram após gerar:**
```json
{ "action": "send", "filePath": "./deliverables/nome-HHMM.png", "message": "legenda" }
```

⚠️ **Regras críticas:**
- Path SEMPRE relativo (`./deliverables/`) — nunca absoluto `/root/...`
- Prompt SEMPRE em inglês
- Nome de arquivo único (usar timestamp)
- Guia detalhado: `GUIA-IMAGENS.md`

---

### 2. ⏰ CRIAR LEMBRETE (via api-bridge — SINCRONIZA COM DYAD)

> ⚠️ **REGRA CRÍTICA (2026-03-08):** Endpoint `/api/reminders/create` espera `schedule` em formato **crontab**, não `datetime`.

#### Passo 1: Converter SP → UTC → Crontab
**SP está UTC-3, então adicionar 3 horas:**

| Horário SP | Horário UTC | Crontab |
|------------|-------------|---------|
| 06:00 | 09:00 | `00 09 DD MM *` |
| 14:00 | 17:00 | `00 17 DD MM *` |
| 22:00 | 01:00 (dia+1) | `00 01 DD+1 MM *` |

**Fórmula:** `"MM HH DD MM *"` (minuto hora-dia mês dia-semana)

#### Passo 2: Chamar API Bridge
```bash
curl -s -X POST http://localhost:3001/api/reminders/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "TÍTULO DO LEMBRETE",
    "schedule": "MM HH DD MM *",
    "recurring": "once"
  }'
```

#### Passo 3: Verificar resposta
✅ **Sucesso:**
```json
{
  "success": true,
  "message": "Lembrete criado!",
  "schedule": "00 09 09 03 *",
  "supabaseId": "6f866d8b-92b5-449e-a870-6a500908e6cf"
}
```

**Campo `supabaseId` confirma que salvou no Dyad/Supabase!**

⚠️ **Se não vier `supabaseId`:**
- Lembrete criado no crontab ✅
- Mas NÃO aparece no Dyad ❌
- Verificar conexão API Bridge → Supabase

#### ❌ NUNCA USAR (método antigo, não sincroniza):
```bash
# Criar script bash + crontab manual
# Isso bypassa o Dyad — não documentado aqui por ser obsoleto
```

**Documentação detalhada:** `LEMBRETES-PROCESSO-CORRETO.md`

> ⚠️ **REGRA CRÍTICA (2026-03-08):** NUNCA criar lembrete via bash/exec direto.
> Sempre usar a api-bridge. Isso garante sincronização com Supabase e Dyad.

```bash
# Converter horário SP → UTC (SP + 3h)
# Exemplo: 9h SP = 12h UTC → cron: "0 12 DD MM *"

curl -s -X POST http://localhost:3001/api/reminders/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "TÍTULO DO LEMBRETE",
    "schedule": "MM HH DD MM *",
    "recurring": "once"
  }'
```

**Resposta esperada:** `{ "success": true, "supabaseId": "uuid..." }`
Se vier `supabaseId` → gravado no Supabase e visível no Dyad ✅
Se vier `supabaseId: null` → crontab criado mas Supabase falhou ⚠️

**[LEGADO - NÃO USAR] Método antigo (bash direto):**
```bash
# ❌ PROIBIDO - não sincroniza com Dyad
# 1. Criar script
cat > /root/.openclaw/workspace/lembrete-NOME.sh << 'EOF'
#!/bin/bash
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "text=🔔 MENSAGEM AQUI"
EOF
chmod +x /root/.openclaw/workspace/lembrete-NOME.sh

# 2. Agendar no cron (HORÁRIO SP + 3h = UTC)
(crontab -l; echo "MM HH DD MM * /root/.openclaw/workspace/lembrete-NOME.sh") | crontab -
```

⚠️ **Pedro fala em horário SP (UTC-3). Sempre somar 3h para o cron.**
Exemplo: Pedro diz 15h → cron usa 18h UTC → `00 18 * * *`

---

### 3. 🌐 ACESSAR SITE COM JAVASCRIPT (Playwright)

```bash
cd /root/.openclaw/workspace && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://SITE.COM', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text);
  await browser.close();
})();
"
```

**Quando usar:** Tentar web_fetch primeiro. Se retornar HTML vazio ou só título → usar Playwright automaticamente, sem perguntar.
Guia detalhado: `DOCUMENTACAO-PLAYWRIGHT.md`

---

### 4. 🤖 USAR SUB-AGENTES

| Atalho | Agente | Para que serve |
|--------|--------|----------------|
| `#copywriter` | Copywriter Premium | Copy, headlines, textos persuasivos, anúncios |
| `#freellm` | Freellm | Estratégia, pesquisa web, execução de tarefas |

**Regra de detecção automática:**
- Palavras copy/headline/anúncio/texto persuasivo → perguntar: "Quer usar #copywriter?"
- Tarefa complexa de execução/pesquisa → pode sugerir #freellm

### ⚠️ REGRAS CRÍTICAS — Spawnar subagente corretamente:

**1. Sempre ler o modelo do `agent.json` antes de spawnar:**
```python
# Ler modelo atual do agente
import json
model = json.load(open('/root/.openclaw/agents/copywriter/agent.json'))['model']
# → passar no sessions_spawn: model=model
```

**2. O `sessions_spawn` NÃO lê `agent.json` automaticamente** — modelo vem de:
`spawn.model` (explícito) > `subagents.model` (global) > modelo do chamador

**3. Sempre passar idioma no prompt:**
- ✅ "Crie em **PORTUGUÊS BRASILEIRO**..."
- ❌ Sem idioma → modelo pode responder em inglês

**4. Sempre passar exatamente a quantidade pedida pelo usuário:**
- Se Pedro pede 1 → passar "Crie APENAS 1..."
- Se Pedro pede 5 → passar "Crie EXATAMENTE 5..."

**Exemplo de spawn correto:**
```python
# 1. Ler modelo atual
import json
model = json.load(open('/root/.openclaw/agents/copywriter/agent.json'))['model']
# model = "openrouter/mistralai/mistral-nemo" (exemplo)

# 2. Spawnar com modelo correto + idioma + quantidade exata
sessions_spawn(
    task="Você é copywriter sênior. Crie APENAS 1 headline em PORTUGUÊS BRASILEIRO para [TEMA]. Entregue só a headline.",
    model=model,
    mode="run"
)
```

---

### 5. 🎙️ TRANSCRIÇÃO DE ÁUDIO (Whisper)

```bash
# Ver status
transcricao status

# Iniciar serviço
transcricao start

# Parar serviço
transcricao stop
```

**Funcionamento:** Automático. Pedro envia áudio no Telegram → Whisper transcreve → texto chega para mim.

---

### 6. 🔧 EMERGÊNCIAS

**Telegram travado/sem resposta:**
```bash
openclaw gateway restart
# Se persistir:
rm -f /root/.openclaw/telegram/update-offset-default.json
openclaw gateway restart
```

**Task runner travado (lock orphan):**
```bash
rm -f /tmp/supabase-task-runner.lock
```

**API Bridge caído (sync modelo Dyad → VPS para de funcionar):**
```bash
# Verificar status
systemctl status api-bridge

# Reiniciar
systemctl restart api-bridge

# Ver logs
tail -20 /tmp/api-bridge.log
```
> ✅ api-bridge agora é serviço systemd — reinicia automaticamente se cair.

**Botão "Salvar Alterações" no Dyad não reinicia o gateway:**
> ⚠️ BUG DOCUMENTADO (2026-03-10): `openclaw gateway restart` via `systemctl --user` falha quando chamado pelo api-bridge (sem sessão D-Bus ativa → `Failed to connect to bus: No medium found`). O botão mostrava sucesso mas não reiniciava.

**Solução implementada:** Script desacoplado `/usr/local/bin/restart-gateway.sh`:
```bash
#!/bin/bash
# Restart gateway desacoplado — chamado pelo api-bridge sem await
sleep 1
pkill -f openclaw-gateway || true
sleep 3
nohup openclaw-gateway > /tmp/gateway.log 2>&1 &
echo "[$(date)] Gateway reiniciado via script" >> /tmp/gateway-restart.log
```

**Como é chamado no `server.js` (3 ocorrências, linhas ~954, ~1000, ~1030):**
```javascript
require('child_process').spawn('/usr/local/bin/restart-gateway.sh', [], { detached: true, stdio: 'ignore' }).unref();
```
> ✅ `detached: true` + `.unref()` = processo totalmente independente, sem travar o api-bridge.
> ✅ Reiniciar manual via terminal ainda funciona: `openclaw gateway restart`

**Ver status geral:**
```bash
openclaw status
```

**Script de reconexão completo:**
```bash
/root/.openclaw/workspace/reconectar-telegram.sh
```

---

## 📋 ARQUITETURA DO SISTEMA (Visão Rápida)

```
Pedro (Telegram) ←→ OpenClaw/Luana ←→ Supabase
                                    ↕
                         Dyad/Lovable (frontend web)
                                    ↕
                    Task Runner daemon (VPS, automático)
                         ↙                  ↘
              nano-banana (imagens)    Playwright (web)
```

**Fluxo Dyad → Telegram:** Pedro cria tarefa no Dyad → Supabase → Task Runner executa → resultado no Telegram
**Fluxo Telegram → Dyad:** Pedro cria lembrete/tarefa no Telegram → Supabase atualiza → aparece no Dyad

---

## 🗺️ ONDE FICA CADA COISA

| Preciso de... | Arquivo |
|---------------|---------|
| Processo detalhado de imagens | `GUIA-IMAGENS.md` |
| Playwright detalhado | `DOCUMENTACAO-PLAYWRIGHT.md` |
| Arquitetura Dyad/Supabase/Task Runner | `GUIA-SISTEMA-DYAD-COMPLETO.md` |
| Histórico de incidentes e o que não fazer | `PREVENCAO-FALHAS.md` |
| Recuperação de desastres completa | `BACKUP-E-RECUPERACAO-SISTEMA-COMPLETO.md` |
| Estrutura skills/subagentes/triggers | `LOGISTICA-SISTEMA.md` |

---

### 7. 🤖 CRIAR NOVO SUBAGENTE (Protocolo Completo)

## ⚠️ REGRA OBRIGATÓRIA — SEMPRE PERGUNTAR ANTES DE CRIAR

Quando Pedro pedir para criar um novo subagente, **NUNCA executar direto**.
Seguir este protocolo:

### PASSO 0 — Planejar e Apresentar para Aprovação

Montar um resumo e perguntar:

```
📋 PLANEJAMENTO — Novo Subagente: [NOME]

O que será feito:
- 🐸 Emoji: [emoji]
- 🤖 Nome: [nome]
- 🧠 Modelo: [modelo]
- 🎯 Especialidade: [descrição]

Pergunta: Você quer criar com qual opção?

  [A] Subagente completo (OpenClaw + Sistema Dyad)
      → Cria agent.json + registra no Supabase + atualiza frontend

  [B] Apenas subagente no OpenClaw
      → Só cria agent.json local (sem aparecer no Dyad)
```

**Só executar após Pedro responder A ou B.**

---

### OPÇÃO A — Subagente Completo (OpenClaw + Dyad)

```bash
# ── 1. CRIAR PASTA E agent.json LOCAL ──────────────────────────
mkdir -p /root/.openclaw/agents/[id]/sessions
cat > /root/.openclaw/agents/[id]/agent.json << 'EOF'
{
  "id": "[id]",
  "name": "[Nome]",
  "emoji": "[emoji]",
  "model": "openrouter/anthropic/claude-sonnet-4.6",
  "systemPrompt": "[prompt completo]",
  "maxTokens": 8000,
  "temperature": 0.5,
  "workspace": "/root/.openclaw/workspace",
  "channel": "telegram"
}
EOF

# ── 2. REGISTRAR NO SUPABASE (status DEVE ser "idle") ──────────
curl -s -X POST "https://nyoevvuwxtatdmdiorjr.supabase.co/rest/v1/agents" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "[Nome]",
    "emoji": "[emoji]",
    "model": "openrouter/anthropic/claude-sonnet-4.6",
    "description": "[descrição curta]",
    "status": "idle"
  }'
# ⚠️ CRÍTICO: status="idle" → aparece como "Disponível" no Dyad
# ❌ status="standby" → aparece como "Offline" (ERRADO!)

# ── 3. ATUALIZAR FRONTEND (Dyad/GitHub) ───────────────────────
# Sincronizar com remoto primeiro
DYAD_TOKEN=$(grep GITHUB_DYAD_TOKEN /root/.openclaw/workspace/.env | cut -d= -f2)
cd /root/.openclaw/mission-control
git fetch origin && git reset --hard origin/main
git config user.email "pedrocamp021@gmail.com"
git config user.name "pedrocamp021"
git remote set-url origin "https://${DYAD_TOKEN}@github.com/pedrocamp021/peaceful-iguana-hug.git"

# Editar src/lib/agents.ts → adicionar novo agente no AGENTS{}
# Editar src/components/kanban/UnifiedCard.tsx → adicionar cor border-l

git add src/lib/agents.ts src/components/kanban/UnifiedCard.tsx
git commit -m "feat: novo agente [Nome] [emoji]"
git push origin main
# Vercel faz deploy automático em ~2 minutos ✅
```

### OPÇÃO B — Apenas OpenClaw (sem Dyad)

```bash
# Só o passo 1 acima (agent.json local)
# Hashtag #[id] já funciona no Telegram
```

---

### Cores padrão por agente (UnifiedCard.tsx)

| Agente | Cor Tailwind |
|--------|-------------|
| designer | `border-l-purple-500` |
| copywriter | `border-l-blue-500` |
| analista | `border-l-green-500` |
| freellm | `border-l-orange-500` |
| jiraiya | `border-l-emerald-500` |
| barato | `border-l-yellow-500` |
| [novo] | Escolher cor não usada |

### Ícones disponíveis (agents.ts — lucide-react)
`Code2`, `Palette`, `PenTool`, `BarChart3`, `Globe`, `Zap`, `Brain`, `Rocket`, `Star`, `Wrench`

---

### 8. 🖥️ ALTERAR PROJETO FRONTEND (GitHub + Vercel)

## ⚠️ ATENÇÃO — DOIS REPOS DIFERENTES. NÃO CONFUNDIR!

| Repo | Dono | Token | Pasta local | O que é |
|------|------|-------|-------------|---------|
| `pedrocamp021/peaceful-iguana-hug` | pedrocamp021 | `GITHUB_DYAD_TOKEN` no `.env` | `/root/.openclaw/mission-control` ← pasta local com nome diferente, mas É O MESMO REPO | **Sistema Dyad/OmniClaw (frontend React/Vite)** |
| `basecodedigital-creator/openclaw-setup` | basecodedigital-creator | `GITHUB_TOKEN` no `.env` | `/root/.openclaw/workspace` | **Workspace/scripts/memórias** |

**Regra simples:**
- Pedro pediu alterar o **sistema Dyad/OmniClaw** → usar `mission-control` + `GITHUB_DYAD_TOKEN`
- Pedro pediu **backup/deploy do workspace** → usar `workspace` + `GITHUB_TOKEN`

**Processo para alterar o sistema Dyad (frontend):**

```bash
# Carregar token do .env
DYAD_TOKEN=$(grep GITHUB_DYAD_TOKEN /root/.openclaw/workspace/.env | cut -d= -f2)

# Entrar na pasta correta (já tem o repo clonado!)
cd /root/.openclaw/mission-control

# Sincronizar com remoto ANTES de editar (evita conflito)
git fetch origin
git reset --hard origin/main

# Configurar autor CORRETO (obrigatório para Vercel aceitar)
git config user.email "pedrocamp021@gmail.com"
git config user.name "pedrocamp021"
git remote set-url origin "https://${DYAD_TOKEN}@github.com/pedrocamp021/peaceful-iguana-hug.git"

# --- FAZER ALTERAÇÕES NOS ARQUIVOS AQUI ---
# Estrutura do projeto:
# src/components/layout/sidebar.tsx  → sidebar principal
# src/components/agents/            → telas de agentes
# src/pages/                        → páginas principais

# Commit e push
git add .
git commit -m "feat: descrição da alteração"
git push origin main

# Vercel faz deploy automático em ~2 minutos
```

**⚠️ REGRAS CRÍTICAS:**
- ✅ Sempre `git reset --hard origin/main` ANTES de editar (Lovable pode ter mudado o remoto)
- ✅ `user.email` deve ser `pedrocamp021@gmail.com`
- ✅ `user.name` deve ser `pedrocamp021`
- ❌ Se usar email errado → Vercel bloqueia o deploy ("implantação bloqueada")
- ✅ Se bloqueou: `git commit --amend --reset-author --no-edit` + `git push --force`
- ❌ NUNCA usar o token `GITHUB_TOKEN` (basecodedigital) no repo do Dyad — dá 403!

---

### 8. 🤖 TROCAR MODELO DE IA (sem quebrar o sistema)

**⚠️ REGRA CRÍTICA:** O OpenClaw tem whitelist de modelos. Trocar só o `primary` sem adicionar na lista `models` **quebra o sistema.**

---

### 🚨 INCIDENTE DOCUMENTADO — 2026-03-07

**O que aconteceu:**
Pedro pediu para trocar de `kimi-k2.5` para `claude-sonnet-4.6` via chat.
A IA principal tentou fazer a troca pelo chat mas entrou em loop — ficava dizendo "estou implementando" e parava de responder sem concluir. Sistema ficou inutilizável via Telegram.

**Causa raiz:**
Tentar editar `openclaw.json` via ferramentas do chat enquanto o próprio gateway está ativo pode causar race condition ou timeout no contexto — o modelo trava tentando modificar a configuração do sistema que o sustenta.

**Como foi resolvido:**
Pedro usou uma IA externa (fora do OpenClaw) para executar os comandos direto no terminal via SSH — a IA editou o JSON e reiniciou o gateway manualmente.

**Lição aprendida:**
> ❌ NUNCA tentar trocar o modelo principal via ferramentas do chat em sessão ativa.
> ✅ SEMPRE executar via terminal/SSH direto ou via sub-agente isolado.

---

### 🚨 BUG DOCUMENTADO — Sistema Dyad (Vercel): Card de subagente não atualiza modelo sem F5 (2026-03-07)

**⚠️ ATENÇÃO:** Este bug era no **sistema Dyad/Vercel** (pedrocamp021/peaceful-iguana-hug), NÃO no painel do OpenClaw.

**Sintoma:**
Pedro acessa o sistema Dyad → edita um subagente → troca o modelo → salva → o card continua mostrando o modelo antigo. Só atualiza ao trocar de menu ou recarregar a página.

**Causa raiz:**
O `EditAgentDialog` salvava no Supabase mas não chamava refresh local da lista. Dependia só do realtime do Supabase para atualizar, que às vezes atrasava.

**Solução aplicada (2026-03-07):**
- Exposto `refresh` no hook `useAgents()`
- Após salvar no dialog, chama `onSaved?.()` → dispara `refresh()` → busca dados frescos imediatamente
- Arquivos alterados: `hooks/openclaw.ts`, `edit-agent-dialog.tsx`, `agent-card.tsx`, `agent-list.tsx`, `pages/Agents.tsx`
- Commit: `fa3943d` — deploy automático via Vercel ✅

---

**Processo correto — SEMPRE via terminal ou sub-agente:**

```bash
# PASSO 1: Backup obrigatório
cp /root/.openclaw/openclaw.json /root/.openclaw/openclaw.json.bak-modelo-$(date +%Y%m%d)

# PASSO 2: Adicionar modelo na whitelist E trocar o primary
python3 -c "
import json
with open('/root/.openclaw/openclaw.json') as f:
    d = json.load(f)

# Adicionar na lista de modelos permitidos (se ainda não estiver)
d['agents']['defaults']['models']['openrouter/NOVO-MODELO'] = {}

# Trocar o modelo principal
d['agents']['defaults']['model']['primary'] = 'openrouter/NOVO-MODELO'

with open('/root/.openclaw/openclaw.json', 'w') as f:
    json.dump(d, f, indent=2)
print('Modelo trocado com sucesso')
"

# PASSO 3: Validar
openclaw doctor

# PASSO 4: Reiniciar gateway
openclaw gateway restart
```

**⚠️ SE EU TRAVAR durante a troca (entrar em loop ou parar de responder):**
```bash
# Pedro deve acessar o servidor via SSH e executar manualmente:
ssh root@IP-DO-SERVIDOR

# Verificar o arquivo atual
cat /root/.openclaw/openclaw.json | grep primary

# Editar com nano (mais seguro)
nano /root/.openclaw/openclaw.json
# Localizar "primary" e alterar o valor
# Ctrl+X → Y → Enter para salvar

# Reiniciar
openclaw gateway restart

# Verificar se voltou
openclaw status
```

**Modelos disponíveis via OpenRouter (exemplos):**
- `openrouter/anthropic/claude-sonnet-4.6` — melhor para análise (atual)
- `openrouter/openai/gpt-4o` — bom para copy e criatividade
- `openrouter/openai/gpt-4o-mini` — mais barato, tarefas simples
- `openrouter/mistralai/mistral-nemo` — gratuito, tarefas gerais
- `openrouter/moonshotai/kimi-k2.5` — contexto gigante (1M tokens)

**Para trocar pelo chat:** Pedro pede "troca o modelo para X" → eu executo o script abaixo via `exec`. NÃO editar JSON manualmente em sessão ativa.

### ⚡ COMANDO ÚNICO — Trocar modelo (qualquer IA consegue executar):

```bash
/root/.openclaw/workspace/trocar-modelo.sh openrouter/MODELO-AQUI
```

**Exemplos prontos:**
```bash
# Voltar para Kimi K2.5
/root/.openclaw/workspace/trocar-modelo.sh openrouter/moonshotai/kimi-k2.5

# Usar Claude Sonnet 4.6
/root/.openclaw/workspace/trocar-modelo.sh openrouter/anthropic/claude-sonnet-4.6

# Usar GPT-4o Mini (barato)
/root/.openclaw/workspace/trocar-modelo.sh openrouter/openai/gpt-4o-mini

# Ver modelos disponíveis (sem argumento)
/root/.openclaw/workspace/trocar-modelo.sh
```

**O script faz tudo automaticamente:** backup → adiciona na whitelist → troca o primary → valida → reinicia gateway → confirma.
Se eu travar → Pedro acessa SSH e roda o script diretamente.

### 📋 REGRA RÁPIDA — Onde trocar modelo de cada agente:

**OpenClaw (painel em localhost:18789):**
| Agente | Dropdown do painel OpenClaw | Via chat (Luana) |
|--------|----------------------------|-----------------|
| **main (Luana)** | ⚠️ Pode funcionar (main agora está no agents.list) — preferir via chat | ✅ Método mais confiável |
| **copywriter, analista, freellm, etc.** | ✅ Funciona — salva no `agent.json` | ✅ Também funciona |

**Sistema Dyad (Vercel):**
| Onde | Como trocar | Status |
|------|------------|--------|
| Aba Subagentes → Editar → Salvar | Atualiza na hora (fix aplicado 2026-03-07) | ✅ Funcionando |

### ⚠️ COMPORTAMENTO ESPERADO — Troca de modelo do agente principal:

**Subagentes** (copywriter, freellm, etc.) → troca **imediata** — são spawned do zero a cada tarefa, sem sessão persistente.

**Agente principal (Luana)** → troca só na **próxima sessão**:
- A troca salva no `openclaw.json` corretamente
- Mas a sessão ativa com Pedro continua no modelo antigo até encerrar
- Quando entra em vigor: botão "Aplicar sessão" no Dyad, `/reset` manual, reset diário automático (04:00), ou compactação

**Isso é comportamento normal e esperado — não é bug.**

### 🔄 BOTÃO "APLICAR SESSÃO" — Sistema Dyad

**Localização:** Card do agente principal → bloco amarelo fixo
**O que faz:** Chama `bridge-proxy → /api/agents/reset-session → envia /reset via Telegram Bot API → OpenClaw reinicia sessão`
**Quando usar:** Após trocar modelo no Dyad e querer que entre em vigor imediatamente

**Rota no api-bridge:**
```bash
POST http://localhost:3001/api/agents/reset-session
# Resposta esperada:
# {"success": true, "message": "Sessão reiniciada..."}
```

**Testar manualmente:**
```bash
curl -s -X POST http://localhost:3001/api/agents/reset-session
```

**Observação:** O `supabase.functions.invoke` às vezes lança exceção mesmo quando a resposta chega com sucesso — o código trata isso mostrando sucesso de qualquer forma (2026-03-07).

---

### 9. 🔧 TRAVAMENTOS NO TELEGRAM — Mensagem começa, para, precisa de "oi" para destravar

**Sintoma:**
- Pedro manda mensagem → IA começa a digitar → para no meio
- Só destravar mandando "oi" ou outra mensagem
- Acontece especialmente após troca de modelo ou operações longas

**Causa raiz:**
- `streamMode: "off"` configurado atualmente — sem streaming, a resposta só aparece quando completa
- Se a IA iniciar um tool call longo e algo falhar silenciosamente, o Telegram fica "aguardando" sem receber nada
- O gateway pode ter um run "orphan" pendente que bloqueia a próxima mensagem

**Configuração atual:**
```bash
# Ver streaming atual
cat /root/.openclaw/openclaw.json | python3 -m json.tool | grep -A5 '"telegram"'
# Atual: "streamMode": "off"  → resposta só aparece quando completa (sem feedback visual)
```

**Ativar streaming para reduzir travamentos (RECOMENDADO):**
```bash
cp /root/.openclaw/openclaw.json /root/.openclaw/openclaw.json.bak-stream-$(date +%Y%m%d)

python3 -c "
import json
with open('/root/.openclaw/openclaw.json') as f:
    d = json.load(f)
d['channels']['telegram']['streamMode'] = 'partial'
with open('/root/.openclaw/openclaw.json', 'w') as f:
    json.dump(d, f, indent=2)
print('streaming partial ativado')
"
openclaw gateway restart
```

Com `partial`: mensagem aparece sendo digitada em tempo real (Bot API 9.5, Março 2026 — compatível).

**Se travar mesmo com streaming:**
```bash
openclaw gateway restart

# Último recurso:
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook"
openclaw gateway restart
```

---

### 8. 📄 RELATÓRIOS E DOCUMENTOS HTML

**SEMPRE que Pedro pedir relatório, documento, manual ou HTML:**

```python
# PASSO 1: Criar o arquivo HTML
with open('/root/.openclaw/workspace/NOME-RELATORIO.html', 'w') as f:
    f.write(html_content)

# PASSO 2: Enviar como anexo no Telegram
message(action="send", filePath="./NOME-RELATORIO.html", message="legenda")
```

**Tema padrão dos relatórios HTML (usar sempre):**
```css
/* Paleta escura profissional */
--primary: #6C63FF;   /* roxo vibrante — cor principal */
--dark: #1a1a2e;      /* fundo principal */
--card: #0f3460;      /* fundo dos cards */
--text: #e0e0e0;      /* texto geral */
--green: #00d4aa;     /* sucesso */
--yellow: #ffd700;    /* aviso */
--red: #ff4757;       /* erro */

/* Elementos obrigatórios */
- Hero com gradiente e título grande
- Cards com hover (transform: translateY(-4px))
- Tabelas com thead colorido
- Code blocks com fundo #0d1117 e texto verde
- Alert boxes coloridos por tipo (info/warning/success/danger)
- Steps numerados com círculo colorido
- Footer escuro com créditos
- CSS responsivo @media (max-width: 600px)
- Meta viewport para mobile
```
**Arquivo de referência:** `manual-openclaw.html` ou `guia-supabase.html` (copiar o bloco `<style>` completo)

**Regras obrigatórias:**
- ✅ Salvar em `/root/.openclaw/workspace/` 
- ✅ Enviar com `message tool` usando `filePath` relativo
- ✅ Incluir viewport meta tag para mobile: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- ✅ CSS responsivo com `@media (max-width: 600px)`
- ❌ NUNCA criar servidor web ou link temporário
- ❌ NUNCA tentar enviar HTML longo como texto no chat (trava a conexão)

**Por que salvar em arquivo e enviar como anexo?**
Respostas muito longas no chat causam "Network connection lost" no Telegram.
Arquivo anexo não tem esse limitação — funciona sempre.

---

### 10. 🔄 SINCRONIZAÇÃO MODELO — Dyad → VPS (2026-03-07)

**O que faz:** Quando o modelo é trocado no sistema Dyad (frontend), atualiza o `agent.json` real na VPS automaticamente.

**Fluxo:**
```
Dyad (Vercel) → supabase.functions.invoke('bridge-proxy') → API Bridge VPS:3001 → agent.json
```

**Rota nova no api-bridge:**
```bash
POST http://localhost:3001/api/agents/sync-model
Body: {"agent_id": "UUID-SUPABASE", "model": "openrouter/openai/gpt-4o"}
```

**Testar se está funcionando:**
```bash
# Direto na VPS
curl -s -X POST http://localhost:3001/api/agents/sync-model \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"48916317-d996-4822-9e01-7ba50ae0e170","model":"openrouter/openai/gpt-4o"}'

# Via bridge-proxy (como o Dyad faz)
SUPABASE_KEY=$(cat /root/.openclaw/workspace/.env | grep SUPABASE_KEY | cut -d= -f2)
curl -s -X POST "https://nyoevvuwxtatdmdiorjr.supabase.co/functions/v1/bridge-proxy" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"path":"/api/agents/sync-model","method":"POST","payload":{"agent_id":"UUID","model":"openrouter/openai/gpt-4o"}}'
```

**UUID dos agentes neste servidor:**
```
78698cd5-acad-4c09-97f4-2ce37b9c0d90 → analista
eaa71569-7a1b-4c34-861f-752e9927eef0 → barato
48916317-d996-4822-9e01-7ba50ae0e170 → copywriter
90149113-3e6a-4b40-b9da-cc997071fb68 → designer
8fa377f6-effd-401b-b0a5-0d622a3a601e → freellm
7bc464ca-2f44-43bc-a217-7f035e7f5236 → main (Luana)
```

**Se precisar replicar para outro cliente:** Ver `GUIA-SISTEMA-DYAD-COMPLETO.md`

---

### 8. 🚀 INSTALAR EM VPS NOVA (Clientes)

```bash
# Um comando instala tudo do zero
curl -s https://raw.githubusercontent.com/basecodedigital-creator/openclaw-setup/main/setup.sh | bash
# Ou baixar e rodar:
wget https://raw.githubusercontent.com/basecodedigital-creator/openclaw-setup/main/setup.sh
bash setup.sh
```

**O script pergunta as credenciais do cliente e configura tudo automaticamente:**
- Node.js, OpenClaw, sub-agentes, nano-banana, Playwright
- Swap 2GB, serviço systemd, crons
- Toda a documentação (BRAIN.md, guias, etc.)

**Camada 1 (obrigatório):** Telegram token + Chat ID + OpenRouter key + Gemini key
**Camada 2 (opcional):** Supabase URL + Key (para sistema visual Dyad/Lovable)

**Repo:** https://github.com/basecodedigital-creator/openclaw-setup

---

### 8. 💾 SALVAR NO GITHUB

```bash
# Salvar com descrição do que mudou
/root/.openclaw/workspace/salvar-github.sh "descrição do que mudou"

# Exemplo:
/root/.openclaw/workspace/salvar-github.sh "Adicionei skill X e atualizei BRAIN.md"
```

**O script faz automaticamente:**
- Adiciona só arquivos seguros (sem credenciais)
- Bloqueia push se detectar credencial exposta
- Commit + push com a mensagem que você passou

**Repo:** https://github.com/basecodedigital-creator/openclaw-setup
**⚠️ Token GitHub:** Criar novo em github.com → Settings → Developer settings → Tokens (classic)
Após criar token novo: `git remote set-url origin https://TOKEN@github.com/basecodedigital-creator/openclaw-setup.git`

---

## ✅ CHECKLIST PÓS-COMPACTAÇÃO (Safeguard)

Quando acordar após compactação, verificar antes de qualquer tarefa:
- [ ] Telegram OK? → `openclaw status | grep Telegram`
- [ ] Task runner rodando? → `ps aux | grep task-runner-daemon | grep -v grep`
- [ ] API Bridge rodando? → `systemctl status api-bridge | grep Active`
- [ ] Lock file travado? → `ls /tmp/supabase-task-runner.lock`
- [ ] Processos críticos disponíveis? → Confirmar que BRAIN.md foi lido

---

## 📝 TEMPLATE — COMO DOCUMENTAR NOVA INSTALAÇÃO

Copiar e preencher ao concluir qualquer nova instalação:

```markdown
### N. 🔧 NOME DO PROCESSO/SKILL

\`\`\`bash
# COMANDO EXATO PRONTO PARA EXECUTAR
# (sem placeholders — comando real funcional)
\`\`\`

**Quando usar:** [descrever situação que aciona este processo]
**Localização:** [caminho no servidor]
**Guia detalhado:** [GUIA-NOME.md — se existir]
**Instalado em:** [data]
```

---

---

### 12. 🔍 BUSCA DE INFORMAÇÃO — Protocolo Anti-Travamento (2026-03-09)

**PROBLEMA:** `memory_search` em arquivos grandes ou buscas genéricas travam a sessão, impedindo respostas.

**SOLUÇÃO:** Busca por etapas, consultando o usuário quando necessário.

#### Hierarquia de Busca (sempre seguir):

| Prioridade | Onde buscar | Quando usar |
|------------|-------------|-------------|
| **1 - Instantâneo** | Dados já carregados no boot (BRAIN.md, MEMORY.md, SOUL.md) | Sei de cabeça, respondo imediatamente |
| **2 - Rápido** | Arquivos pequenos específicos (memórias recentes: últimos 3-7 dias) | Se não lembro, busco em contexto limitado (rápido, não trava) |
| **3 - Consultar** | Perguntar ao usuário | Se não acho em busca rápida (2-3s), pergunto: "Não encontrei nas memórias recentes. Quer que eu busque em arquivos mais antigos ou prefere me passar de novo?" |
| **4 - Busca profunda** | `memory_search` completo | SÓ executo se usuário autorizar explicitamente |

#### Regras de Ouro:

1. **NUNCA** fazer busca genérica `memory_search` sem limites primeiro
2. **SEMPRE** tentar responder com o que está em memória (BRAIN/MEMORY)
3. **SE** precisar buscar em arquivo antigo/grande → avisar que pode demorar
4. **NUNCA** deixar o usuário esperando sem feedback durante busca

#### Exemplo prático:

**Usuário:** "Onde está o login do site X?"

**❌ ANTES (travava):**
```
[Busca memory_search genérico] → [demora 10s] → [trava] → [silêncio]
```

**✅ AGORA (não trava):**
```
[Verifico BRAIN.md - não está] → 
[Busco últimos 3 dias - não está] → 
"Não encontrei nas memórias recentes. Pode estar em arquivo antigo ou nunca me passou. Quer que eu busque em tudo ou prefere me passar agora?"
```

**Se usuário disser "busca"** → executo busca completa
**Se usuário disser "não" ou passar dados** → salvo no BRAIN.md para próxima vez

---

*Última atualização: 2026-03-09*
*Responsável por manter: Luana Devs — atualizar a cada nova instalação*

---

## 🔐 SISTEMA DE TEMPLATES — GitHub Seguro

### Regra fundamental:
- Arquivos com credenciais reais → ficam **locais** e no `.gitignore`
- No GitHub → só sobem as versões `*-template` com placeholders

### Arquivos protegidos (NUNCA vão pro GitHub):
```
BRAIN.md          → credenciais em exemplos
MEMORY.md         → dados pessoais
api-bridge/server.js → tokens hardcoded
.env              → todas as chaves
```

### Templates no GitHub (versões limpas):
```
BRAIN-template.md           → placeholder [SUA-API-KEY]
MEMORY-template.md          → placeholder
api-bridge/server-template.js → placeholder
.env.example                → placeholder
```

### Placeholders usados:
| Placeholder | Representa |
|-------------|-----------|
| `[SUA-SUPABASE-SERVICE-KEY]` | SUPABASE_SERVICE_KEY do .env |
| `[SEU-TELEGRAM-BOT-TOKEN]` | TELEGRAM_BOT_TOKEN do .env |
| `[SEU-TELEGRAM-CHAT-ID]` | Chat ID do Pedro no Telegram |
| `[SEU-PROJETO].supabase.co` | URL do projeto Supabase |
| `[SEU-GITHUB-TOKEN]` | GITHUB_TOKEN do .env |
| `[SEU-GITHUB-DYAD-TOKEN]` | GITHUB_DYAD_TOKEN do .env |

### Quando atualizar os templates (após mudar uma chave):
```bash
# Recriar template do server.js
sed 's|CHAVE_REAL|[PLACEHOLDER]|g' api-bridge/server.js > api-bridge/server-template.js

# Recriar template do BRAIN.md  
sed 's|CHAVE_REAL|[PLACEHOLDER]|g' BRAIN.md > BRAIN-template.md
```
**Depois pedir autorização para Pedro antes de fazer push.**
