# 🔗 GUIA DE INTEGRAÇÃO — OpenClaw + Dyad

> **Quando usar:** Após instalação base do OpenClaw, quando quiser adicionar o painel visual (Dyad).
> **Tempo estimado:** 30-60 minutos
> **Pré-requisito:** OpenClaw instalado e funcionando via Telegram

---

## O QUE É O DYAD?

O Dyad é um painel visual (frontend) que roda no navegador e permite:
- 📋 Ver e criar tarefas/lembretes visualmente
- 🔄 Trocar o modelo do agente com um clique
- 📊 Kanban de tarefas
- 📅 Calendário de lembretes

Ele se comunica com o OpenClaw via **api-bridge** (já instalado na VPS pelo setup.sh).

---

## PASSO 1 — Criar conta no Supabase

1. Acesse https://supabase.com e crie uma conta gratuita
2. Clique em **New Project**
3. Escolha um nome (ex: `meu-openclaw`)
4. Guarde a **senha do banco** em local seguro
5. Aguarde ~2 minutos para o projeto inicializar

---

## PASSO 2 — Criar as tabelas no Supabase

No painel do Supabase, vá em **SQL Editor** e cole e execute o conteúdo do arquivo `database.sql` que está no repositório.

Isso cria as tabelas:
- `reminders` — lembretes simples
- `scheduled_tasks` — tarefas executáveis pelo agente
- `reminder_instances` — instâncias para o calendário

---

## PASSO 3 — Pegar as credenciais do Supabase

No painel do Supabase, vá em **Settings → API**:

- **Project URL** → ex: `https://xxxxx.supabase.co`
- **service_role key** → começa com `sb_secret_...` (NÃO use a anon key)

---

## PASSO 4 — Configurar o frontend Dyad

### Opção A — Usar o Lovable (mais fácil)
1. Acesse https://lovable.dev
2. Crie um novo projeto
3. Configure a conexão com seu Supabase
4. Personalize a interface

### Opção B — Usar template pronto (recomendado)
1. Peça ao seu instalador o acesso ao template do Dyad
2. Faça fork do repositório
3. Suba em **Vercel** ou **Netlify** (gratuito):
   ```
   vercel deploy
   ```
4. Configure as variáveis de ambiente:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key
   ```

---

## PASSO 5 — Conectar Supabase na VPS

Na sua VPS, edite o arquivo `.env`:

```bash
nano /root/.openclaw/workspace/.env
```

Adicione/atualize:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=sb_secret_sua-service-key
SUPABASE_SERVICE_KEY=sb_secret_sua-service-key
```

---

## PASSO 6 — Configurar o api-bridge

```bash
# Editar .env do api-bridge
nano /root/.openclaw/workspace/api-bridge/.env
```

Preencher:
```env
PORT=3001
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=[TOKEN_DO_SEU_GATEWAY]
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_sua-service-key
TELEGRAM_BOT_TOKEN=seu-token-telegram
TELEGRAM_CHAT_ID=seu-chat-id
```

> Para pegar o OPENCLAW_GATEWAY_TOKEN:
> ```bash
> cat /root/.openclaw/openclaw.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['gateway']['auth']['token'])"
> ```

---

## PASSO 7 — Iniciar o api-bridge

```bash
systemctl restart api-bridge
systemctl status api-bridge
```

✅ Deve aparecer: `Active: active (running)`

---

## PASSO 8 — Testar a integração

**Teste 1 — Lembrete via Telegram:**
```
Crie um lembrete para daqui 2 minutos: "Teste de integração"
```
→ Deve aparecer no painel Dyad

**Teste 2 — Trocar modelo pelo Dyad:**
- Abra o Dyad no navegador
- Vá em Configurações → Modelo
- Selecione outro modelo e clique em Salvar
→ OpenClaw deve responder com o novo modelo

---

## DIAGNÓSTICO RÁPIDO

```bash
# Ver logs do api-bridge
tail -20 /tmp/api-bridge.log

# Verificar se está rodando
systemctl status api-bridge

# Reiniciar manualmente se necessário
systemctl restart api-bridge
```

---

## ESTRUTURA COMPLETA APÓS INTEGRAÇÃO

```
[Telegram] ←→ [OpenClaw/VPS] ←→ [api-bridge] ←→ [Supabase] ←→ [Dyad/Navegador]
```

---

*Guia criado em 2026-03-10*
