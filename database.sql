-- ============================================================
-- OpenClaw Setup — Database Schema Completo
-- Versão: 1.0 | 2026-03-06
--
-- INSTRUÇÕES:
-- 1. Acesse seu projeto no Supabase
-- 2. Vá em SQL Editor
-- 3. Cole todo este conteúdo e clique em RUN
-- 4. Pronto — banco configurado!
-- ============================================================

-- ============================================================
-- TABELAS
-- ============================================================

-- Tarefas agendadas (one-time)
CREATE TABLE IF NOT EXISTS public.scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  agent_id TEXT,
  execute_at TIMESTAMPTZ,
  cron TEXT,
  status TEXT DEFAULT 'scheduled',
  type TEXT DEFAULT 'scheduled',
  source TEXT DEFAULT 'dyad',
  result TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tarefas recorrentes
CREATE TABLE IF NOT EXISTS public.recurring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  agent_id TEXT,
  frequency TEXT,
  time TEXT,
  day_of_week TEXT,
  day_of_month TEXT,
  cron TEXT,
  status TEXT DEFAULT 'active',
  type TEXT DEFAULT 'recurring',
  source TEXT DEFAULT 'dyad',
  result TEXT,
  last_executed TIMESTAMPTZ,
  next_execution TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tarefas gerais
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  agent_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Arquivos gerados (imagens, docs)
CREATE TABLE IF NOT EXISTS public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id),
  scheduled_task_id UUID REFERENCES public.scheduled_tasks(id),
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_name TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lembretes
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  schedule TEXT NOT NULL,
  recurring TEXT NOT NULL DEFAULT 'once',
  source TEXT DEFAULT 'dyad',
  status TEXT DEFAULT 'pending',
  user_id UUID,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instâncias de lembretes (para o calendário)
CREATE TABLE IF NOT EXISTS public.reminder_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID REFERENCES public.reminders(id) ON DELETE CASCADE,
  user_id UUID,
  instance_date DATE NOT NULL,
  instance_time TIME NOT NULL,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reminder_id, instance_date)
);

-- Agentes configurados
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  model TEXT,
  status TEXT DEFAULT 'active',
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de atividades
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID,
  message TEXT NOT NULL,
  type TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS DE PROTEÇÃO
-- ============================================================

-- Proteção: impede que tarefas concluídas voltem para running/scheduled
CREATE OR REPLACE FUNCTION public.prevent_task_status_reversion()
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

DROP TRIGGER IF EXISTS trg_prevent_task_status_reversion ON public.scheduled_tasks;
CREATE TRIGGER trg_prevent_task_status_reversion
  BEFORE UPDATE ON public.scheduled_tasks
  FOR EACH ROW EXECUTE FUNCTION public.prevent_task_status_reversion();

-- ============================================================
-- FUNÇÃO: Gerar instâncias de lembretes no calendário
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_reminder_instances()
RETURNS TRIGGER AS $$
DECLARE
  start_ts TIMESTAMPTZ;
  r_parts TEXT[];
  r_min INT;
  r_hour INT;
  r_dom INT;
  r_mon INT;
  r_time TIME;
  inst_date DATE;
BEGIN
  IF NEW.schedule IS NULL THEN
    RETURN NEW;
  END IF;

  -- Se for UPDATE e mudou schedule/recurring, limpa instâncias futuras pendentes
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.schedule IS DISTINCT FROM NEW.schedule) OR
       (OLD.recurring IS DISTINCT FROM NEW.recurring) THEN
      DELETE FROM public.reminder_instances
      WHERE reminder_id = NEW.id
        AND instance_date >= CURRENT_DATE
        AND status = 'pending';
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Tenta parsear como timestamp ISO
  BEGIN
    start_ts := (NEW.schedule)::TIMESTAMPTZ;
  EXCEPTION WHEN OTHERS THEN
    start_ts := NULL;
  END;

  -- Divide cron: min hour dom mon dow
  r_parts := regexp_split_to_array(NEW.schedule, '\s+');

  -- Lembrete once com formato cron (ex: "25 12 06 03 *")
  IF NEW.recurring = 'once' AND array_length(r_parts, 1) >= 4 THEN
    r_min  := (r_parts[1])::INT;
    r_hour := (r_parts[2])::INT;
    r_dom  := (r_parts[3])::INT;
    r_mon  := (r_parts[4])::INT;
    r_time := make_time(r_hour, r_min, 0);
    inst_date := make_date(EXTRACT(YEAR FROM now())::INT, r_mon, r_dom);

    INSERT INTO public.reminder_instances (reminder_id, instance_date, instance_time, status)
    VALUES (NEW.id, inst_date, r_time, 'pending')
    ON CONFLICT (reminder_id, instance_date) DO NOTHING;

    RETURN NEW;
  END IF;

  -- Lembrete once com ISO timestamp
  IF NEW.recurring = 'once' AND start_ts IS NOT NULL THEN
    INSERT INTO public.reminder_instances (reminder_id, instance_date, instance_time, status)
    VALUES (NEW.id, start_ts::DATE, (start_ts::TIME), 'pending')
    ON CONFLICT (reminder_id, instance_date) DO NOTHING;
    RETURN NEW;
  END IF;

  -- Lembretes recorrentes: gerar próximos 30 dias
  IF NEW.recurring = 'daily' AND array_length(r_parts, 1) >= 2 THEN
    r_min  := (r_parts[1])::INT;
    r_hour := (r_parts[2])::INT;
    r_time := make_time(r_hour, r_min, 0);
    FOR i IN 0..29 LOOP
      inst_date := CURRENT_DATE + i;
      INSERT INTO public.reminder_instances (reminder_id, instance_date, instance_time, status)
      VALUES (NEW.id, inst_date, r_time, 'pending')
      ON CONFLICT (reminder_id, instance_date) DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_reminder_created_v2 ON public.reminders;
CREATE TRIGGER on_reminder_created_v2
  AFTER INSERT OR UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.generate_reminder_instances();

-- ============================================================
-- DADOS INICIAIS — Agentes padrão
-- ============================================================

INSERT INTO public.agents (name, emoji, description, model, status) VALUES
  ('Luana Devs', '⚡', 'Assistente principal — orquestra tudo', 'claude-sonnet-4.6', 'active'),
  ('Copywriter', '✍️', 'Copy, headlines, textos persuasivos', 'gpt-4o', 'active'),
  ('Analista', '📊', 'Análise de dados e métricas', 'claude-sonnet-4.6', 'active'),
  ('Designer', '🎨', 'Geração de imagens via Gemini', 'gemini', 'active'),
  ('Freellm', '🔧', 'Estratégia e execução de tarefas', 'mistral-nemo', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- RLS (Row Level Security) — Desabilitado para uso pessoal
-- Habilite se for multi-usuário
-- ============================================================

ALTER TABLE public.scheduled_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_instances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

SELECT
  table_name,
  COUNT(*) as colunas
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('scheduled_tasks','recurring_tasks','reminders','reminder_instances','tasks','deliverables','agents','activities')
GROUP BY table_name
ORDER BY table_name;
