# MEMORY.md - Memória de Longo Prazo

> Este arquivo é carregado automaticamente pelo OpenClaw em sessões main privadas.
> Contém decisões duráveis, preferências e fatos essenciais.

---

## 🧠 LEITURA OBRIGATÓRIA NO BOOT

**Ao iniciar qualquer sessão com o usuário, ler IMEDIATAMENTE:**

1. `BRAIN.md` — processos críticos prontos (imagens, lembretes, Playwright, emergências)
2. `MEMORY.md` — este arquivo (já carregado automaticamente)

> **Por que BRAIN.md é crítico:** Após compactação (safeguard), a IA perde contexto dos processos.
> O BRAIN.md contém os comandos exatos prontos para executar — sem precisar procurar em outros arquivos.
> **Nunca execute um processo de imagem, lembrete ou acesso a site sem checar BRAIN.md primeiro.**

---

## 📦 PROTOCOLO OBRIGATÓRIO — NOVA INSTALAÇÃO/SKILL/PROCESSO

**TODA VEZ que instalar algo novo, criar uma skill ou descobrir um processo:**

1. ✅ Adicionar receita (comando exato) na seção correta do `BRAIN.md`
2. ✅ Registrar em `MEMORY.md` (seção Skills ou Componentes)
3. ✅ Criar `GUIA-NOME.md` se o processo for complexo (>10 linhas)
4. ✅ Referenciar o guia no `BRAIN.md`

**Sem este protocolo, a informação se perde após compactação.**

---

## 👤 Identidade

**Assistente:**
- Nome: Luana Devs
- Emoji: ⚡
- Natureza: Assistente digital focada, capaz, direta
- Vibe: Sem filler words, objetiva, pragmática
- Modelo: Claude Sonnet 4.6 (openrouter/anthropic/claude-sonnet-4.6)

**Usuário:**
- Nome: o usuário
- Localização: São Paulo, Brasil
- Timezone: America/Sao_Paulo (UTC-3)
- Projeto: Marketing digital, automações, sistemas pessoais
- Preferência de resposta: Objetiva, rápida, concisa

---

## ⏰ Regra de Timezone (CRÍTICO) - CONFIRMADO

**Fuso horário do usuário: America/Sao_Paulo (UTC-3)**

### ⚠️ IMPORTANTE - Sempre lembrar:
- O sistema mostra horário UTC em logs/comandos
- São Paulo está **3 horas ATRÁS** do UTC
- Quando o usuário diz um horário, é SEMPRE horário de São Paulo

### 📊 Tabela de Conversão:
| Você diz (SP) | Horário UTC (sistema) | Para Cron |
|---------------|----------------------|-----------|
| "00:00" (meia-noite) | 03:00 UTC | `00 03` |
| "09:00" (manhã) | 12:00 UTC | `00 12` |
| "12:00" (meio-dia) | 15:00 UTC | `00 15` |
| "15:00" (tarde) | 18:00 UTC | `00 18` |
| "18:00" (noite) | 21:00 UTC | `00 21` |
| "21:00" (noite) | 00:00 UTC (dia seguinte) | `00 00` |

**Fórmula: Horário SP + 3 horas = Horário UTC (para cron)**

### ✅ Aplica-se a TUDO:
- Lembretes
- Cronjobs  
- Monitoramentos
- Campanhas agendadas
- Tarefas automáticas
- Relatórios programados
- Agendamentos de qualquer tipo

### ❌ NUNCA fazer:
- Usar horário UTC diretamente quando o usuário disser um horário
- Assumir que horário do sistema = horário do usuário
- Criar lembrete para "agora" sem verificar se já passou em SP

**SEMPRE confirmar: "São Paulo está UTC-3, então [X] horas SP = [Y] horas UTC"**

---

## 🛡️ Regras de Segurança (Crítico)

### PROIBIDO sem autorização explícita:
1. ❌ Editar `openclaw.json` manualmente
2. ❌ Adicionar chaves desconhecidas em arquivos de configuração
3. ❌ Criar agentes persistentes em `agents.list`
4. ❌ Reiniciar gateway automaticamente
5. ❌ Executar scripts de recovery sem pedir permissão
6. ❌ Modificar configs do sistema sem validar schema

### PERMITIDO livremente:
1. ✅ Ler arquivos e analisar
2. ✅ Responder perguntas
3. ✅ Executar comandos solicitados explicitamente
4. ✅ Criar lembretes via cron do sistema
5. ✅ Monitorar status

### Protocolo antes de modificar:
1. Mostrar exatamente o que será alterado
2. Pedir autorização explícita: "Posso fazer X?"
3. Criar backup automático (.bak)
4. Validar com `openclaw doctor --check` se aplicável
5. Aplicar mudança
6. Validar funcionamento

---

## ⚙️ Configurações do Sistema

### Modo de Operação
- **Compactação:** `safeguard` (automática em ~240k tokens)
- **Memory flush:** Ativado (pré-compactação automática)
- **Vector search:** Ativado (busca semântica em memórias)

### Componentes Instalados
| Componente | Status | Local/Detalhes |
|------------|--------|----------------|
| Gateway | ✅ Estável | systemd, ws://127.0.0.1:18789 |
| Telegram | ✅ Online | @jarbasdevs_bot |
| Whisper | ✅ Funcionando | /root/whisper-env, modelo base |
| Chrome/Playwright | ✅ Instalado | Automação web pronta |
| Multi-agentes | ✅ Configurado | main, copywriter, barato, analista, nexus, jiraiya |

### Configurações de Rede
- **SSH Tunnel:** `ssh -L 18789:localhost:18789 root@[IP_DO_SEU_SERVIDOR]`
- **Dashboard:** http://localhost:18789/
- **Tailscale:** Desativado (estabilidade)

---

## 📁 Estrutura de Arquivos Importantes

### Scripts e Automação
```
/root/.openclaw/workspace/
├── reconectar-telegram.sh      # Reconexão manual Telegram
├── emergency-recover.sh        # Recuperação de emergência
├── smart-context.sh            # Monitor de tokens
├── smart-reset.sh              # Reset de contexto manual
├── voice-service.sh            # Serviço de transcrição
└── transcricao                 # Symlink de controle voice-service
```

### Documentação e Memória
```
/root/.openclaw/workspace/
├── MEMORY.md                   # Este arquivo (memória longo prazo)
├── CHECKPOINT-CONTEXT.md       # Resumo de sessão + regras bootstrap
├── GUIA_SOLUCOES.md            # Soluções de problemas passados
├── PADRAO_LEMBRETES.md         # Padrão de lembretes
├── DIAGNOSTICO_DESCONECTADO.md # Guia de diagnóstico
├── INCIDENTE-2026-02-08.md     # Post-mortem incidente grave
└── memory/                     # Logs diários (automáticos)
    └── 2026-02-09.md
    └── 2026-02-10.md
```

---

## 🔧 Soluções Documentadas

### Incidente: Configuração Inválida (2026-02-08)
**Problema:** Adicionado campos `delivery` e `bestEffort` em `openclaw.json`
**Resultado:** Sistema quebrou, gateway não iniciava
**Solução:** Remoção manual das chaves, restauração via backup
**Lição:** Nunca adicionar campos sem validar schema oficial

### Incidente: Telegram Desconectado
**Causa:** Modo de compactação `compact` causou instabilidade
**Solução:** Reverter para `safeguard` (padrão)
**Prevenção:** Monitoramento via cron do sistema (não OpenClaw cron)

---

## 📝 Decisões Arquiteturais

### Gestão de Memória
1. **Compactação:** Manter `safeguard` automático (não reset manual)
2. **Flush automático:** Deixar OpenClaw gerenciar (já ativo)
3. **Arquivos .md:** Usar padrão nativo do OpenClaw
   - `memory/YYYY-MM-DD.md` para logs diários
   - `MEMORY.md` para memórias longo prazo
4. **Busca:** Usar `memory_search` para consultas semânticas

### Protocolo de Modificação
1. Nunca editar JSONs manualmente
2. Usar comandos CLI (`openclaw config set`)
3. Validar com `openclaw doctor --check`
4. Backup obrigatório antes de alterações

### Comunicação
1. Respostas objetivas e rápidas
2. Sem filler words ("como posso ajudar", "ótima pergunta")
3. Direto ao ponto

---

## 🧠 Aprendizado Técnico: Configuração de Sub-Agentes com Modelos Específicos

**Data:** 2026-02-10

### Problema Encontrado
Ao tentar usar sub-agente com modelo GPT-4o Mini, apareceu erro:
```
"warning": "model not allowed: openrouter/openai/gpt-4o-mini"
```

### Causa Raiz
O modelo precisa estar na lista `agents.defaults.models` do `openclaw.json`, mesmo que já esteja configurado em `agents.defaults.subagents.model`.

### Solução Correta
1. Adicionar modelo à lista de models permitidos:
```json
"models": {
  "openrouter/moonshotai/kimi-k2.5": {},
  "openrouter/openai/gpt-4o-mini": {},  ← ADICIONAR AQUI
  "openrouter/mistralai/mistral-nemo": {}  ← Exemplo Mistral
}
```

2. Configurar sub-agente para usar o modelo:
```json
"subagents": {
  "model": "openrouter/openai/gpt-4o-mini",
  "maxConcurrent": 8
}
```

3. Validar com `openclaw doctor`

### ⚠️ IMPORTANTE: Parâmetro model no sessions_spawn
O campo `model` no `agent.json` do sub-agente é **IGNORADO** pelo `sessions_spawn`. É obrigatório passar o modelo explicitamente no parâmetro `model` da chamada:

```javascript
// ❌ Não funciona - usa fallback do subagents.model
sessions_spawn({task: "#freellm ..."})

// ✅ Funciona - modelo correto aplicado
sessions_spawn({
  task: "#freellm ...",
  model: "openrouter/mistralai/mistral-nemo"  ← OBRIGATÓRIO
})
```

### Formato Correto do Model ID
Sempre usar prefixo completo `openrouter/`:
```
✅ "openrouter/mistralai/mistral-nemo"     → Funciona
❌ "mistralai/mistral-nemo"                → Não reconhece

✅ "openrouter/pony-alpha"                 → Existe mas requer auth especial
❌ "openrouter/pony-alpha"                 → Erro: cookie auth required

✅ "openrouter/meta-llama/llama-3.1-8b-instruct"  → Funciona
```

### Verificação de Sucesso
Resposta do spawn deve mostrar:
```json
"modelApplied": true
```

(Não deve ter warning "model not allowed")

---

## 🏷️ Hashtags de Sub-Agentes (Atalhos Automáticos)

Quando você iniciar mensagem com #hashtag, automaticamente farei spawn do sub-agente correspondente:

| Hashtag | Sub-Agente | Função | Modelo |
|---------|-----------|--------|--------|
| `#copywriter` | Copywriter | Criar copy, headlines, textos persuasivos | GPT-4o Mini |
| `#freellm` | Estrategista | Planejamento, estratégia, execução tarefas | Mistral Nemo |
| `#jiraiya` | Jiraiya Dev 🐸 | Desenvolvimento de código, criação de sites | Claude Sonnet 4.6 |

**Regra:** Texto após a hashtag = instrução completa para o sub-agente.

**Exemplos:**
- `#copywriter criar 5 headlines provocativas para produto de emagrecimento`
- `#copywriter gerar copy para anúncio de Black Friday, estilo urgência`
- `#copywriter variações de texto para Instagram sobre marketing digital`
- `#freellm estratégia de tráfego pago para WhatsApp`
- `#freellm analise MEMORY.md e crie resumo de projetos pendentes`
- `#freellm pesquise concorrência no nicho de convites digitais`

**Nota:** Sub-agentes retornam resultado aqui no chat sem interromper nossa conversa.

**Diferenças entre sub-agentes:**
- **#copywriter:** GPT-4o Mini, ferramentas limitadas (apenas texto), foco em copywriting
- **#freellm:** Mistral Nemo, ferramentas completas (read/write/exec/web), foco em estratégia e execução
- **Contexto:** Ambos são temporários (sessão isolada), sem acesso ao histórico do chat

---

## 💾 Sistemas Supabase Conectados

## 🏷️ Padrão de Comandos para Sistemas

**Regra:** Sistemas integrados ao Supabase usam prefixo `@` seguido do nome curto do sistema.

| Sistema | Comando | Status |
|---------|---------|--------|
| Finanças (antigo) | `@finan` | 🗄️ Arquivado (exemplo) |
| Convites Digitais | `@convite` | 📝 Futuro |
| [Próximo sistema] | `@[nome]` | 📝 A definir |

---

### @finan 🗄️ Arquivado (Exemplo de Implementação)
> **Status:** Desativado - Sistema anterior arquivado em 2026-02-10
> **Scripts:** Backups disponíveis em `financas-nlp.sh.bak.2026-02-10`

**Estrutura que era usada (exemplo para futuros sistemas):**
- `transactions` - tabela principal (despesas/receitas)
- `profiles` - usuários
- `custom_categories` - categorias personalizadas

**Comandos disponíveis:**

| Comando | O que faz | Exemplo |
|---------|-----------|---------|
| `@finan gastei X em Y` | Adiciona despesa PAGA | `@finan gastei 100 no mercado` |
| `@finan vou gastar X em Y` | Adiciona despesa PENDENTE | `@finan vou pagar 200 de luz dia 15` |
| `@finan recebi X de Y` | Adiciona receita | `@finan recebi 5000 de salário` |
| `@finan saldo` | Mostra saldo do mês | `@finan saldo` |
| `@finan resumo` | Relatório detalhado | `@finan resumo fevereiro` |
| `@finan categorias` | Lista categorias | `@finan categorias` |

**Nota:** O prefixo antigo `*financas` também funciona (legado).

**Lógica inteligente:**
- **"Gastei"** = Já foi pago (is_paid: true)
- **"Vou gastar/pagar"** = Pendente (is_paid: false)
- **Categoria** = Detecta automaticamente (mercado→Alimentação, uber→Transporte)
- **Data** = Hoje (se não especificar) ou dia informado
- **Recorrência** = Detecta se falar "todo mês"

---

## 🔧 Bug Fix — Botão "Salvar Alterações" Dyad (2026-03-10)

**Problema:** Botão no Dyad para trocar modelo chamava `openclaw gateway restart` via api-bridge, que internamente usa `systemctl --user`. Como api-bridge roda como serviço systemd sem sessão D-Bus ativa, retornava `Failed to connect to bus: No medium found`. Pior: o frontend mostrava **sucesso mesmo com erro**.

**Solução:** Script desacoplado `/usr/local/bin/restart-gateway.sh` que usa `pkill + nohup` sem dependência de D-Bus. Chamado no `server.js` com `child_process.spawn(..., { detached: true, stdio: 'ignore' }).unref()` (sem await).

**Arquivos alterados:**
- `/usr/local/bin/restart-gateway.sh` — criado
- `/root/.openclaw/workspace/api-bridge/server.js` — 3 ocorrências substituídas (linhas ~954, ~1000, ~1030)

---

## 🔧 Auditoria Técnica — 2026-03-08

**Documento completo:** `AUDITORIA-2026-03-08.md`

### Bugs corrigidos:
1. **Lembrete não sincronizava com Dyad** → `server.js` agora faz insert no Supabase após criar crontab
2. **Lembrete via bash bypassava Dyad** → regra: SEMPRE usar `curl localhost:3001/api/reminders/create`
3. **`echo | crontab -` frágil** → substituído por arquivo temp `/tmp/crontab-tmp-*`
4. **auto-executor-silent travava** → adicionado `AbortSignal.timeout(90000)` no fetch OpenRouter
5. **task-runner-daemon sem proteção** → virou serviço systemd com `Restart=always`

### Serviços após auditoria:
- `api-bridge` → systemd ✅
- `task-runner-daemon` → systemd ✅ (novo)
- `openclaw-gateway` → systemd ✅

### Backups:
- `api-bridge/server.js.bak.20260308-014725`
- `auto-executor-silent.js.bak.20260308-015613`
- `task-runner-daemon.js.bak.20260308-015613`

---

## 🔄 Tarefas Pendentes

### Prioridade Alta
- [x] Configurar sistema financeiro (Supabase) ✅ CONECTADO
- [x] Criar scripts de integração *financas ✅ FUNCIONANDO
  - Status: Ativa
- [ ] Implementar automação de campanhas

### Prioridade Média
- [ ] Testar automação web (Playwright)
- [ ] Criar workflows entre agentes
- [ ] **Sistema de Análise de Vídeos YouTube** (aguardando vídeo real para implementar)
  - Pasta: `/workspace/transcricoes/`
  - Fluxo: Vídeo → Whisper (grátis) → Resumo no chat → #freellm (se complexo) → Arquivo salvo
  - Vídeos: 10-15 minutos (max 30 min)
  - Custo estimado: ~$0.0013 por vídeo
  - Arquivos NÃO carregam automaticamente (só sob demanda)
- [ ] **Sistema Multi-Agente "Dream Team"** (Planejamento em 17/02/2026)
  - Arquitetura: Luana como orquestradora central
  - Agentes especializados: Designer AI (imagens), Copywriter, Estrategista, Analista
  - Dashboard Lovable com backend unificado
  - Fluxo: Comando → Luana analisa → Spawn agentes → Consolida resultado
- [ ] Configurar integrações adicionais

### Concluídas
- [x] Sistema de reconexão Telegram
- [x] Whisper local para transcrição
- [x] Chrome + Playwright instalado
- [x] Multi-agentes configurados
- [x] Lembretes via cron do sistema
- [x] Estrutura de memória organizada

---

## 🚨 Comandos de Emergência

```bash
# Ver status do sistema
openclaw status

# Ver tokens da sessão
/usr/local/bin/check-context status

# Recuperação manual Telegram
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook"
echo '{"version":1,"lastUpdateId":0}' > /root/.openclaw/telegram/update-offset-default.json
openclaw gateway restart

# Reset de contexto (quando necessário)
/root/.openclaw/workspace/smart-reset.sh

# Controlar transcrição de áudio
transcricao status|start|stop|restart
```

---

## 💡 Notas e Observações

- **Voice padrão:** Texto (ElevenLabs só quando solicitado explicitamente)
- **Custo tokens:** API calls (Meta, Google, etc.) = ZERO tokens
- **Contexto cheio:** Acima de 205k tokens = respostas mais lentas
- **Lembretes:** Usar cron do sistema (não OpenClaw cron) para economizar tokens
- **Segurança:** Private things stay private (nunca compartilhar dados sensíveis)

---

## 🚨 EMERGÊNCIAS - CONSULTAR IMEDIATAMENTE:

**Travamento de mensagens:** Mensagens travam, só chegam com follow-up
→ Ver: `SOLUCAO-TRAVAMENTO-TELEGRAM.md`

---

## 🎯 REGRAS RÁPIDAS - CONSULTAR QUANDO DETECTAR:

**COPY:** Perguntar sobre #copywriter  
**IMAGEM:** Path relativo `./deliverables/`  
**ANÁLISE:** Perguntar sobre #analista  
**SITE JS:** Trigger automático (fetch → Playwright)  
**ORGANIZAÇÃO:** Ver LOGISTICA-SISTEMA.md para estrutura completa  

*(Detalhes completos em AGENTS.md, TRIGGER-RULES.md, LOGISTICA-SISTEMA.md)*

---

## 🎨 GERAÇÃO DE IMAGENS - REGRA CRÍTICA (2026-03-05)

**Sempre que usuário pedir imagem, seguir EXATAMENTE este processo:**

### ✅ Processo Funcional:

1. **Gerar via nano-banana skill:**
```bash
cd /root/.openclaw/workspace/deliverables
GEMINI_API_KEY="${GEMINI_API_KEY}" \
timeout 120 /root/.local/bin/uv run \
/root/.openclaw/skills/nano-banana-pro-2/scripts/generate_image.py \
--prompt "DESCRIÇÃO EM INGLÊS DETALHADA" \
--filename "nome-unico.png" \
--resolution 2K
```

2. **Enviar pelo message tool com PATH RELATIVO:**
```json
{
  "action": "send",
  "filePath": "./deliverables/nome-unico.png",
  "message": "🏷️ Legenda da imagem"
}
```

### ⚠️ REGRAS CRÍTICAS:
- ✅ Use **path relativo**: `./deliverables/imagem.png`
- ❌ NUNCA use path absoluto `/root/...`
- ❌ NUNCA use `~` (tilde)
- ✅ Nome de arquivo único com timestamp ou descrição curta
- ✅ Prompt sempre em INGLÊS para melhor resultado
- ✅ Aguardar confirmação do message tool

### Por que funciona?
- Message tool bloqueia paths absolutos por segurança
- Paths relativos ao workspace são permitidos
- Aprendido após muita tentativa e erro em 2026-03-05

---

## 📄 REGRA CRÍTICA — RELATÓRIOS E HTML

**Sempre que o usuário pedir relatório, manual, documento ou HTML:**
1. Criar arquivo `.html` em `/root/.openclaw/workspace/`
2. Enviar com `message tool` usando `filePath` relativo (`./arquivo.html`)
3. NUNCA enviar HTML longo como texto no chat — causa "Network connection lost"
4. Sempre incluir CSS responsivo para mobile (`@media max-width: 600px`)

**Ver processo completo em:** `BRAIN.md` — seção "RELATÓRIOS E DOCUMENTOS HTML"

---

## 🔑 SISTEMA DE PALAVRAS-CHAVE (Guia de Ação)

> **Como usar:** Detectar palavras na mensagem do usuário → Consultar guia correspondente → Executar processo

### 🎯 QUANDO CONSULTAR:
- Se CONFiante no processo → Executar direto
- Se INSEGURO/esquecido → Consultar guia PRIMEIRO
- Se PRIMEIRA VEZ após otimização → Consultar para relembrar

### 📋 MAPA DE PALAVRAS-CHAVE

| Palavras-Chave | Guia a Consultar | O que fazer |
|----------------|------------------|-------------|
| **imagem, foto, gerar imagem, criar imagem** | `GUIA-IMAGENS.md` | Path relativo `./deliverables/`, nano-banana skill |
| **site, acesse, www, .com, .br, http, navegue** | `DOCUMENTACAO-PLAYWRIGHT.md` | web_fetch → Se falhar, usar Playwright |
| **copy, headline, texto persuasivo, anúncio, campanha** | `AGENTS.md` (seção copywriting) | Perguntar: "Quer usar #copywriter premium?" |
| **trigger, automação, gatilho, regra automática** | `LOGISTICA-SISTEMA.md` | Ver triggers configurados, criar novo se necessário |
| **skill, habilidade, instalar skill** | `LOGISTICA-SISTEMA.md` | Decidir: Doc/Trigger/Skill/Subagente |
| **backup, restore, recuperar, desastre** | `BACKUP-E-RECUPERACAO-SISTEMA-COMPLETO.md` | Seguir processo de restauração |
| **playwright, browser, chrome, selenium** | `DOCUMENTACAO-PLAYWRIGHT.md` | Automação de browser para sites JS |
| **subagente, agente, criar agente** | `LOGISTICA-SISTEMA.md` | Ver seção Subagentes |
| **documentação, guia, como fazer, processo** | `LOGISTICA-SISTEMA.md` ou `GUIA-DE-ORGANIZACAO.md` | Ver MAPA DE DOCUMENTOS |
| **organização, onde colocar, estrutura** | `GUIA-DE-ORGANIZACAO.md` | Ver onde cada tipo de coisa vai |
| **erro, problema, travamento, falha** | `SOLUCAO-TRAVAMENTO-TELEGRAM.md` ou diagnóstico específico | Identificar e resolver |

### 📁 MAPA DE DOCUMENTOS (Onde encontrar cada coisa)

| Tópico | Arquivo | Local |
|--------|---------|-------|
| **Geração de imagens** | `GUIA-IMAGENS.md` | `/workspace/` |
| **Acesso a sites SPA** | `DOCUMENTACAO-PLAYWRIGHT.md` | `/workspace/` |
| **Triggers automáticos** | `AGENTS.md` (seção triggers) | `/workspace/` |
| **Estrutura do sistema** | `LOGISTICA-SISTEMA.md` | `/workspace/` |
| **Recuperação de desastres** | `BACKUP-E-RECUPERACAO-SISTEMA-COMPLETO.md` | `/workspace/` |
| **Copywriting** | `AGENTS.md` (seção copywriting) | `/workspace/` |
| **Regras de identificação** | `TRIGGER-RULES.md` | `/workspace/` |
| **Solução de travamentos** | `SOLUCAO-TRAVAMENTO-TELEGRAM.md` | `/workspace/` |
| **Organização do sistema** | `LOGISTICA-SISTEMA.md` | `/workspace/` |
| **Onde colocar cada coisa** | `GUIA-DE-ORGANIZACAO.md` | `/workspace/` |
| **Aprendizado contínuo** | `PROCESSO-APRENDIZADO.md` | `/workspace/` |

---

*Última atualização: 2026-03-06 14:00 UTC*
*Próxima revisão: Quando adicionar novos processos*
