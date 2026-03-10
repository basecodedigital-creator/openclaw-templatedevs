# 🗄️ GUIA SUPABASE — Configuração do Banco de Dados

> **Quando usar:** Ao integrar o Dyad (painel visual) com o OpenClaw.
> **Tempo estimado:** 10-15 minutos
> **Nível:** Iniciante

---

## PASSO 1 — Criar conta e projeto

1. Acesse **https://supabase.com** e crie uma conta gratuita
2. Clique em **New Project**
3. Preencha:
   - **Name:** `meu-openclaw` (ou o nome que preferir)
   - **Database Password:** crie uma senha forte e **guarde em local seguro**
   - **Region:** escolha o mais próximo de você (ex: São Paulo → `sa-east-1`)
4. Clique em **Create new project**
5. ⏳ Aguarde ~2 minutos para inicializar

---

## PASSO 2 — Criar as tabelas

1. No painel do Supabase, clique em **SQL Editor** (menu lateral)
2. Clique em **New query**
3. Abra o arquivo `database.sql` deste repositório
4. Copie todo o conteúdo e cole no editor
5. Clique em **Run** (▶️)
6. Deve aparecer: `Success. No rows returned`

✅ Banco configurado com as tabelas:
- `reminders` — lembretes simples
- `scheduled_tasks` — tarefas agendadas
- `recurring_tasks` — tarefas recorrentes
- `reminder_instances` — instâncias para calendário

---

## PASSO 3 — Pegar as credenciais

1. No painel do Supabase, vá em **Settings** → **API**
2. Anote:
   - **Project URL** → ex: `https://abcdefgh.supabase.co`
   - **service_role** key → começa com `sb_secret_...`

> ⚠️ **IMPORTANTE:** Use sempre a `service_role` key (não a `anon` key).
> A `service_role` tem permissão total para o sistema funcionar corretamente.

---

## PASSO 4 — Configurar na VPS

Edite o `.env` na sua VPS:

```bash
nano /root/.openclaw/workspace/.env
```

Adicione:
```env
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_KEY=sb_secret_sua-chave-aqui
SUPABASE_SERVICE_KEY=sb_secret_sua-chave-aqui
```

Salve e configure também o api-bridge:

```bash
nano /root/.openclaw/workspace/api-bridge/.env
```

```env
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_sua-chave-aqui
```

Depois reinicie o api-bridge:
```bash
systemctl restart api-bridge
```

---

## PASSO 5 — Verificar se funcionou

```bash
# Ver logs do api-bridge
tail -20 /tmp/api-bridge.log

# Deve aparecer algo como:
# ✅ Conectado ao OpenClaw
# ✅ Conectado ao Supabase
```

---

## Estrutura das tabelas (resumo)

### `reminders`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| title | TEXT | Título do lembrete |
| schedule | TEXT | Cron: `"MM HH DD MM *"` |
| recurring | TEXT | `once`, `daily`, `weekly`, `monthly` |
| status | TEXT | `pending`, `executed` |
| source | TEXT | `telegram`, `dyad` |

### `scheduled_tasks`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| title | TEXT | Título da tarefa |
| description | TEXT | Instrução para o agente |
| agent_id | TEXT | Qual agente executa |
| execute_at | TIMESTAMPTZ | Quando executar |
| status | TEXT | `scheduled`, `running`, `completed`, `error` |

---

## Diagnóstico rápido

```bash
# Testar conexão com Supabase
curl -s "${SUPABASE_URL}/rest/v1/reminders?limit=1" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}"

# Se retornar [] ou dados = conexão OK ✅
# Se retornar erro de autenticação = verificar a key ❌
```

---

*Guia criado em 2026-03-10 · OpenClaw Template v2.0*
