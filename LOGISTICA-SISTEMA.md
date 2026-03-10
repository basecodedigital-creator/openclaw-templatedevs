# 🏗️ ESTRUTURA CONSOLIDADA - SISTEMA LUANA

> **Data:** 2026-03-06  
> **Propósito:** Organização de skills, triggers, documentação e subagentes

---

## 📋 FILOSOFIA: Quando Usar Cada Tipo

```
┌─────────────────────────────────────────────────────────────┐
│  REGRA SIMPLES?  →  DOCUMENTAÇÃO (AGENTS.md/MEMORY.md)     │
│  AUTOMAÇÃO?      →  TRIGGER/ALIAS (AGENTS.md)              │
│  FERRAMENTA?     →  SKILL (disco, complexa)                │
│  ESPECIALISTA?   →  SUBAGENTE (personalidade, modelo)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ DOCUMENTAÇÃO (Base de Conhecimento)

**O que é:** Arquivos de texto com regras, processos, memórias  
**Quando usar:** Conhecimento que precisa persistir  
**Onde fica:** `/root/.openclaw/workspace/*.md`

### Arquivos Principais:

| Arquivo | Função | Consultar Quando |
|---------|--------|------------------|
| **AGENTS.md** | Regras operacionais, triggers | Sempre (carrega automático) |
| **MEMORY.md** | Memória longo prazo, preferências | Início de sessão privada |
| **TOOLS.md** | Notas de ferramentas específicas | Quando usar tool complexa |
| **CHECKPOINT-CONTEXT.md** | Resumo de sessão | Após compactação |

### Exemplos de Conteúdo:
- Path relativo para imagens (`./deliverables/`)
- Trigger: site → Playwright
- Regra: copywriting → perguntar #copywriter
- Timezone do usuário (UTC-3)

---

## 2️⃣ TRIGGERS/AUTOMAÇÃO (Decisões Automáticas)

**O que é:** Regras que tomam decisão automática baseada em padrões  
**Quando usar:** Escolha entre métodos, automação de fluxo  
**Onde fica:** Seção "TRIGGERS AUTOMÁTICOS" no AGENTS.md

### Trigger Ativos:

#### TRIGGER 1: Acesso a Sites
```
Input: "Acesse www.site.com"
↓
Tenta: web_fetch
↓
Se falhar (HTML vazio/título apenas)
↓
Automático: Playwright
↓
Entrega: Conteúdo completo
```

#### TRIGGER 2: Detecção de Copywriting
```
Input: "Crie headline...", "Faça copy...", "Texto persuasivo..."
↓
Pergunta: "Quer usar #copywriter premium?"
↓
Sim: Subagente especializado
Não: Faço eu mesma (Luana)
```

#### TRIGGER 3: Geração de Imagens
```
Input: "Gere imagem...", "Crie foto..."
↓
Automático: nano-banana skill
↓
Path relativo: ./deliverables/
↓
Envio: message tool
```

### Futuros Triggers (ideias):
- "Analise dados..." → Perguntar #analista
- "Pesquise concorrência..." → Playwright + análise
- "Crie landing..." → #landing-builder (quando pronto)

---

## 3️⃣ SKILLS (Ferramentas Complexas)

**O que é:** Pacotes de código com dependências, APIs, scripts  
**Quando usar:** Ferramenta complexa que precisa de instalação  
**Onde fica:** `/root/.openclaw/skills/` ou `/usr/lib/node_modules/openclaw/skills/`

### Skills Instaladas:

| Skill | Função | Quando Usar | Status |
|-------|--------|-------------|--------|
| **nano-banana-pro-2** | Gerar imagens com Gemini | Gerar qualquer imagem | ✅ Ativa |
| **nano-pdf** | Manipular PDFs | Criar/editar PDFs | ✅ Instalada |

### Skills Futuras:

| Skill | Função | Quando Criar | Prioridade |
|-------|--------|--------------|------------|
| **#landing-builder** | GitHub + Vercel automático | Quando tiver tokens GitHub/Vercel | 🟡 Média |
| **web-scraper** | Extração avançada de dados | Se precisar extrair dados complexos de sites | 🟢 Baixa |
| **pdf-generator** | Criar PDFs profissionais | Se precisar de relatórios em PDF | 🟢 Baixa |

### NÃO Criar Skill Para:
- ❌ Regras simples (use documentação)
- ❌ Automação de decisão (use trigger)
- ❌ Tarefas que eu já faço bem (use subagente ou eu mesma)

---

## 4️⃣ SUBAGENTES (Especialistas)

**O que é:** Agentes isolados com personalidade, modelo específico, foco único  
**Quando usar:** Especialista que precisa de "personalidade" ou modelo diferente  
**Onde fica:** `/root/.openclaw/agents/{nome}/agent.json`

### Subagentes Configurados:

| Subagente | Modelo | Função | Como Chamar |
|-----------|--------|--------|-------------|
| **#copywriter** | GPT-4o | Copy profissional, headlines | `#copywriter [tarefa]` |
| **#designer** | Gemini (nano-banana) | Geração de imagens | Sistema DyAD |
| **main (Luana)** | Kimi K2.5 | Tudo, orquestração | Chat direto |

### Subagentes Futuros:

| Subagente | Modelo | Função | Prioridade |
|-----------|--------|--------|------------|
| **#analista** | Claude 3.5 Sonnet | Análise de dados, relatórios | 🟡 Média |
| **#freellm** | Mistral Nemo | Tarefas gerais, execução | 🟢 Baixa (já tenho) |
| **#landing-builder** | GPT-4o/Claude | Criar sites + deploy automático | 🟡 Média |

---

## 🔄 FLUXO DE DECISÃO (Resumo Visual)

```
Você faz pedido
      ↓
┌─────────────────────────────────────┐
│  É copy/headline/texto?             │
│  → Perguntar: #copywriter?          │
└─────────────────────────────────────┘
      ↓ Não
┌─────────────────────────────────────┐
│  É imagem?                          │
│  → nano-banana + path relativo      │
└─────────────────────────────────────┘
      ↓ Não
┌─────────────────────────────────────┐
│  É acesso a site?                   │
│  → web_fetch → Se falhar: Playwright│
└─────────────────────────────────────┘
      ↓ Não
┌─────────────────────────────────────┐
│  É análise/dados?                   │
│  → Perguntar: #analista?            │
└─────────────────────────────────────┘
      ↓ Não
┌─────────────────────────────────────┐
│  Faço eu mesma (Luana - Kimi K2.5)  │
└─────────────────────────────────────┘
```

---

## 📝 PADRÃO DE CRIAÇÃO

### Quando surgir nova necessidade:

**PERGUNTE:**
1. **É só uma regra?** → Documentação (AGENTS.md)
2. **É automação de escolha?** → Trigger (AGENTS.md)
3. **Precisa de código/ferramenta complexa?** → Skill
4. **Precisa de personalidade especializada?** → Subagente

**NÃO faça:**
- ❌ Criar skill para cada pequena coisa
- ❌ Criar subagente para tarefa simples
- ❌ Documentar o óbvio (ex: como usar ls)

**FAÇA:**
- ✅ Manter AGENTS.md atualizado com triggers
- ✅ Documentar processos complexos
- ✅ Criar skill SÓ quando necessário
- ✅ Usar subagente para especialização real

---

## 🎯 CHECKLIST DE MANUTENÇÃO

### Mensal (Heartbeat):
- [ ] Revisar AGENTS.md (triggers atualizados?)
- [ ] Verificar skills instaladas (ainda usadas?)
- [ ] Revisar MEMORY.md (remover obsoleto)

### Após Update/Safeguard:
- [ ] Verificar se Playwright está ok
- [ ] Verificar se nano-banana funciona
- [ ] Testar trigger de sites
- [ ] Confirmar que documentação carregou

### Quando Criar Nova Coisa:
- [ ] Decidir: Doc, Trigger, Skill ou Subagente?
- [ ] Documentar no arquivo correto
- [ ] Atualizar este LOGISTICA.md se necessário

---

## 🚀 PRÓXIMOS PASSOS (Roadmap)

### Prioridade Alta (Agora):
- ✅ Trigger automático para sites (fetch → Playwright)
- ✅ Documentação Playwright restaurada

### Prioridade Média (Próximas semanas):
- 📝 Configurar GitHub + Vercel tokens
- 📝 Criar skill #landing-builder
- 📝 Criar subagente #analista (se necessário)

### Prioridade Baixa (Futuro):
- 📝 Outros triggers conforme identificar padrões
- 📝 Skills adicionais conforme demanda

---

## 📚 DOCUMENTOS DO SISTEMA (Referência Completa)

| Documento | Propósito | Quando Consultar |
|-----------|-----------|------------------|
| `MEMORY.md` | Memória longo prazo, palavras-chave | Início de toda sessão |
| `AGENTS.md` | Regras operacionais, triggers | Quando detectar ação específica |
| `LOGISTICA-SISTEMA.md` | Organização geral, estrutura | Dúvidas sobre como organizar |
| `GUIA-DE-ORGANIZACAO.md` | Onde colocar cada tipo de coisa | Quando adicionar novo documento/skill |
| `PROCESSO-APRENDIZADO.md` | Como adicionar novos processos | Quando criar documentação nova |
| `GUIA-IMAGENS.md` | Geração de imagens | Quando palavra-chave "imagem" detectada |
| `DOCUMENTACAO-PLAYWRIGHT.md` | Acesso a sites SPA | Quando palavra-chave "site" detectada |
| `TRIGGER-RULES.md` | Regras de palavras-chave detalhadas | Referência técnica de triggers |
| `BACKUP-E-RECUPERACAO-SISTEMA-COMPLETO.md` | Recuperação de desastres | Em emergências |

---

*Criado: 2026-03-06*  
*Última atualização: 2026-03-06*  
*Responsável: LuanaDevs*
