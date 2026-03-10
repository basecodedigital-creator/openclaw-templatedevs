const express = require('express');
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Logging middleware para debug
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.headers.authorization) {
    console.log('  Auth header present:', req.headers.authorization.substring(0, 20) + '...');
  }
  next();
});

// Auth middleware - aceita qualquer token por enquanto (para debug)
const API_SECRET = process.env.API_SECRET || 'dev-secret';
app.use((req, res, next) => {
  // Health check não precisa de auth
  if (req.path === '/health') return next();
  
  // Permitir requests sem auth temporariamente para debug
  // Em produção, descomentar:
  // const authHeader = req.headers.authorization;
  // if (!authHeader || !authHeader.includes(API_SECRET)) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }
  
  next();
});

const PORT = process.env.PORT || 3001;
const OPENCLAW_URL = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let openclawWS = null;
let isConnected = false;

function connectToOpenClaw() {
  console.log('🔌 Conectando ao OpenClaw...');
  openclawWS = new WebSocket(OPENCLAW_URL, {
    headers: { 'Authorization': `Bearer ${OPENCLAW_TOKEN}` }
  });
  openclawWS.on('open', () => { console.log('✅ Conectado!'); isConnected = true; });
  openclawWS.on('close', () => { isConnected = false; setTimeout(connectToOpenClaw, 5000); });
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', openclaw: isConnected ? 'connected' : 'disconnected' });
});

app.get('/api/agents', async (req, res) => {
  try {
    const { data, error } = await supabase.from('agents').select('*').order('name');
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, agent_id } = req.body;
    const { data: task, error } = await supabase.from('tasks').insert({
      title, description, agent_id, status: 'new'
    }).select().single();
    if (error) throw error;
    if (isConnected) {
      openclawWS.send(JSON.stringify({
        type: 'task.create', taskId: task.id, title, description, agentId: agent_id
      }));
    }
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const { data, error } = await supabase.from('tasks').select('*, agents(name, emoji)').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// ROTAS DE LEMBRETES (CRONTAB)
// ==========================================

// Listar lembretes do crontab
app.get('/api/reminders/list', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    const fs = require('fs');
    
    const { stdout } = await execPromise('crontab -l');
    const reminders = stdout.split('\n')
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.includes('lembrete') && !line.startsWith('#'))
      .map(({ line, index }) => {
        const parts = line.split(' ');
        const schedule = parts.slice(0, 5).join(' ');
        const command = parts.slice(5).join(' ');
        const match = line.match(/lembrete-(.+?)\.sh/);
        const title = match ? match[1].replace(/-/g, ' ') : 'Lembrete';
        
        return {
          index,
          schedule,
          title: title.charAt(0).toUpperCase() + title.slice(1),
          recurring: detectRecurring(parts.slice(0, 5)),
          command
        };
      });
    
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar novo lembrete
app.post('/api/reminders/create', async (req, res) => {
  try {
    const { title, schedule, recurring = 'once' } = req.body;
    const fs = require('fs');
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    // Criar script do lembrete
    const scriptName = `lembrete-${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.sh`;
    const scriptPath = `/root/.openclaw/workspace/${scriptName}`;
    
    // Script criado em 2 etapas: placeholder → depois substituído com supabaseId real
    const scriptContent = `#!/bin/bash
# Lembrete: ${title}
# Criado em: ${new Date().toISOString()}
# Tipo: ${recurring}
SUPABASE_ID="__SUPABASE_ID__"
SUPABASE_URL="${process.env.SUPABASE_URL}"
SUPABASE_KEY="${process.env.SUPABASE_SERVICE_KEY || ''}"

# Enviar notificação no Telegram
curl -s "https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage" \\
  -d "chat_id=${process.env.TELEGRAM_CHAT_ID}" \\
  -d "text=⏰ LEMBRETE: ${title}" \\
  -d "parse_mode=HTML"

# Atualizar status no Supabase
if [ -n "$SUPABASE_ID" ] && [ "$SUPABASE_ID" != "__SUPABASE_ID__" ]; then
  curl -s -X PATCH "$SUPABASE_URL/rest/v1/reminders?id=eq.$SUPABASE_ID" \\
    -H "apikey: $SUPABASE_KEY" \\
    -H "Authorization: Bearer $SUPABASE_KEY" \\
    -H "Content-Type: application/json" \\
    -d '{"status":"executed","executed_at":"'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"}'
fi

echo "[$(date)] Lembrete enviado: ${title}" >> /root/.openclaw/workspace/logs/lembretes.log
`;
    
    fs.writeFileSync(scriptPath, scriptContent);
    fs.chmodSync(scriptPath, '755');
    
    // Adicionar ao crontab
    const { stdout: currentCrontab } = await execPromise('crontab -l 2>/dev/null || echo ""');
    const newCrontab = currentCrontab.trim() + `\n${schedule} ${scriptPath}\n`;
    
    await execPromise(`echo "${newCrontab}" | crontab -`);

    // Converter cron para datetime (execute_at)
    function cronToDatetime(cron) {
      try {
        const parts = cron.trim().split(/\s+/);
        if (parts.length < 5) return null;
        const [minute, hour, day, month, weekday] = parts;
        // Se todos os campos de data são específicos (não wildcard), montar datetime
        if (minute !== '*' && hour !== '*' && day !== '*' && month !== '*') {
          const year = new Date().getFullYear();
          const dt = new Date(`${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}T${hour.padStart(2,'0')}:${minute.padStart(2,'0')}:00.000Z`);
          return isNaN(dt.getTime()) ? null : dt.toISOString();
        }
        return null;
      } catch (e) {
        return null;
      }
    }

    const executeAt = cronToDatetime(schedule);

    // Salvar no Supabase para sincronizar com Dyad (tabela reminders = ponto azul no calendário)
    let supabaseId = null;
    try {
      const { data: task, error: supabaseError } = await supabase
        .from('reminders')
        .insert({
          title,
          schedule,
          recurring,
          source: 'telegram',
          status: 'scheduled'
        })
        .select()
        .single();

      if (!supabaseError && task) {
        supabaseId = task.id;
        // Substituir placeholder no script com o ID real
        const scriptUpdated = fs.readFileSync(scriptPath, 'utf8').replace('__SUPABASE_ID__', supabaseId);
        fs.writeFileSync(scriptPath, scriptUpdated);
      }
    } catch (supabaseErr) {
      console.error('Supabase insert failed (non-fatal):', supabaseErr.message);
    }

    res.json({ 
      success: true, 
      message: 'Lembrete criado!',
      schedule,
      script: scriptName,
      title,
      supabaseId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar lembrete
app.post('/api/reminders/delete', async (req, res) => {
  try {
    const { index } = req.body;
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    const { stdout: currentCrontab } = await execPromise('crontab -l');
    const lines = currentCrontab.split('\n');
    
    // Encontrar linha de lembrete pelo índice
    let reminderIndex = -1;
    let currentIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('lembrete') && !lines[i].startsWith('#')) {
        if (currentIndex === index) {
          reminderIndex = i;
          break;
        }
        currentIndex++;
      }
    }
    
    if (reminderIndex === -1) {
      return res.status(404).json({ error: 'Lembrete não encontrado' });
    }
    
    // Remover linha
    lines.splice(reminderIndex, 1);
    const newCrontab = lines.join('\n');
    
    await execPromise(`echo "${newCrontab}" | crontab -`);
    
    res.json({ success: true, message: 'Lembrete removido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: detectar tipo de recorrência
function detectRecurring(parts) {
  const [min, hour, day, month, weekday] = parts;
  if (day === '*' && month === '*' && weekday === '*') return 'daily';
  if (weekday === '1-5') return 'weekdays';
  if (day === '*' && weekday !== '*') return 'weekly';
  return 'once';
}

// ==========================================
// ROTAS DE CRONJOB (Scheduled Tasks)
// ==========================================

// Listar cronjobs únicos
app.get('/api/scheduled-tasks/list', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar cronjob único
app.post('/api/scheduled-tasks/create', async (req, res) => {
  try {
    const { title, description, agent_id, execute_at, cron } = req.body;
    const fs = require('fs');
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    // Salvar no Supabase
    const { data: task, error } = await supabase
      .from('scheduled_tasks')
      .insert({
        title,
        description,
        agent_id,
        execute_at,
        cron,
        status: 'scheduled',
        type: 'scheduled',
        source: req.body.source || 'dyad'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Criar script que executa o agente
    const scriptName = `scheduled-task-${task.id}.sh`;
    const scriptPath = `/root/.openclaw/workspace/${scriptName}`;
    
    const scriptContent = `#!/bin/bash
# Cronjob Único: ${title}
# ID: ${task.id}
# Criado: ${new Date().toISOString()}

# Atualizar status para 'running'
curl -s -X POST "${process.env.SUPABASE_URL}/rest/v1/scheduled_tasks?id=eq.${task.id}" \\
  -H "apikey: ${process.env.SUPABASE_SERVICE_KEY}" \\
  -H "Authorization: Bearer ${process.env.SUPABASE_SERVICE_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"running"}'

# Notificar Telegram que iniciou
curl -s "https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage" \\
  -d "chat_id=${process.env.TELEGRAM_CHAT_ID}" \\
  -d "text=🔥 CRONJOB INICIADO: ${title}" \\
  -d "parse_mode=HTML"

# Chamar API Bridge para executar tarefa
curl -s -X POST "http://localhost:3001/api/scheduled-tasks/execute" \\
  -H "Content-Type: application/json" \\
  -d '{"taskId":"${task.id}","agentId":"${agent_id}","description":"${description}"}'

# Remover do crontab após execução
crontab -l | grep -v "${scriptName}" | crontab -

# Remover script
rm ${scriptPath}

echo "[$(date)] Cronjob único executado: ${title}" >> /root/.openclaw/workspace/logs/cronjobs.log
`;
    
    fs.writeFileSync(scriptPath, scriptContent);
    fs.chmodSync(scriptPath, '755');
    
    // Adicionar ao crontab
    const { stdout: currentCrontab } = await execPromise('crontab -l 2>/dev/null || echo ""');
    const newCrontab = currentCrontab.trim() + `\n${cron} ${scriptPath}\n`;
    await execPromise(`echo "${newCrontab}" | crontab -`);
    
    res.json({ 
      success: true, 
      message: 'Cronjob único agendado!',
      task,
      script: scriptName
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Executar cronjob (chamado pelo script)
app.post('/api/scheduled-tasks/execute', async (req, res) => {
  try {
    const { taskId, agentId, description } = req.body;
    
    // Enviar para OpenClaw executar
    if (isConnected && openclawWS) {
      openclawWS.send(JSON.stringify({
        type: 'cronjob.execute',
        taskId,
        agentId,
        description,
        timestamp: new Date().toISOString()
      }));
    }
    
    // Atualizar status no Supabase
    await supabase
      .from('scheduled_tasks')
      .update({ 
        status: 'completed',
        executed_at: new Date().toISOString()
      })
      .eq('id', taskId);
    
    res.json({ success: true, message: 'Executado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar cronjob único
app.post('/api/scheduled-tasks/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    const fs = require('fs');
    
    // Remover do Supabase
    await supabase.from('scheduled_tasks').delete().eq('id', id);
    
    // Remover do crontab
    const scriptName = `scheduled-task-${id}.sh`;
    const { stdout: currentCrontab } = await execPromise('crontab -l');
    const newCrontab = currentCrontab.split('\n').filter(line => !line.includes(scriptName)).join('\n');
    await execPromise(`echo "${newCrontab}" | crontab -`);
    
    // Remover script se existir
    const scriptPath = `/root/.openclaw/workspace/${scriptName}`;
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
    }
    
    res.json({ success: true, message: 'Cronjob removido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ROTAS DE CRONJOB RECORRENTE
// ==========================================

// Listar cronjobs recorrentes
app.get('/api/recurring-tasks/list', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recurring_tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar cronjob recorrente
app.post('/api/recurring-tasks/create', async (req, res) => {
  try {
    const { title, description, agent_id, frequency, time, day_of_week, day_of_month, cron } = req.body;
    const fs = require('fs');
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    // Salvar no Supabase
    const { data: task, error } = await supabase
      .from('recurring_tasks')
      .insert({
        title,
        description,
        agent_id,
        frequency,
        time,
        day_of_week,
        day_of_month,
        cron,
        status: 'active',
        type: 'recurring',
        last_executed: null,
        next_execution: calculateNextExecution(frequency, time, day_of_week, day_of_month),
        source: req.body.source || 'dyad'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Criar script
    const scriptName = `recurring-task-${task.id}.sh`;
    const scriptPath = `/root/.openclaw/workspace/${scriptName}`;
    
    const scriptContent = `#!/bin/bash
# Cronjob Recorrente: ${title}
# ID: ${task.id}
# Frequência: ${frequency}

# Atualizar última execução
curl -s -X PATCH "${process.env.SUPABASE_URL}/rest/v1/recurring_tasks?id=eq.${task.id}" \\
  -H "apikey: ${process.env.SUPABASE_SERVICE_KEY}" \\
  -H "Authorization: Bearer ${process.env.SUPABASE_SERVICE_KEY}" \\
  -H "Content-Type: application/json" \\
  -d "{\"last_executed\":\"$(date -Iseconds)\"}"

# Notificar Telegram
curl -s "https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage" \\
  -d "chat_id=${process.env.TELEGRAM_CHAT_ID}" \\
  -d "text=🔄 CRONJOB RECORRENTE: ${title}" \\
  -d "parse_mode=HTML"

# Executar tarefa
curl -s -X POST "http://localhost:3001/api/recurring-tasks/execute" \\
  -H "Content-Type: application/json" \\
  -d '{"taskId":"${task.id}","agentId":"${agent_id}","description":"${description}"}'

echo "[$(date)] Cronjob recorrente executado: ${title}" >> /root/.openclaw/workspace/logs/recurring.log
`;
    
    fs.writeFileSync(scriptPath, scriptContent);
    fs.chmodSync(scriptPath, '755');
    
    // Adicionar ao crontab
    const { stdout: currentCrontab } = await execPromise('crontab -l 2>/dev/null || echo ""');
    const newCrontab = currentCrontab.trim() + `\n${cron} ${scriptPath}\n`;
    await execPromise(`echo "${newCrontab}" | crontab -`);
    
    res.json({ 
      success: true, 
      message: 'Cronjob recorrente criado!',
      task
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Executar cronjob recorrente
app.post('/api/recurring-tasks/execute', async (req, res) => {
  try {
    const { taskId, agentId, description } = req.body;
    
    if (isConnected && openclawWS) {
      openclawWS.send(JSON.stringify({
        type: 'recurring.execute',
        taskId,
        agentId,
        description
      }));
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pausar/ativar cronjob recorrente
app.post('/api/recurring-tasks/toggle', async (req, res) => {
  try {
    const { id, active } = req.body;
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    // Atualizar no Supabase
    await supabase
      .from('recurring_tasks')
      .update({ status: active ? 'active' : 'paused' })
      .eq('id', id);
    
    // Atualizar crontab
    const scriptName = `recurring-task-${id}.sh`;
    const { stdout: currentCrontab } = await execPromise('crontab -l');
    
    let newCrontab;
    if (active) {
      // Remover comentário (#) da linha
      newCrontab = currentCrontab.replace(new RegExp(`#(.*${scriptName})`, 'g'), '$1');
    } else {
      // Comentar a linha
      newCrontab = currentCrontab.replace(new RegExp(`^(.*${scriptName})$`, 'gm'), '#$1');
    }
    
    await execPromise(`echo "${newCrontab}" | crontab -`);
    
    res.json({ success: true, status: active ? 'active' : 'paused' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar cronjob recorrente
app.post('/api/recurring-tasks/delete', async (req, res) => {
  try {
    const { id } = req.body;
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    const fs = require('fs');
    
    // Remover do Supabase
    await supabase.from('recurring_tasks').delete().eq('id', id);
    
    // Remover do crontab
    const scriptName = `recurring-task-${id}.sh`;
    const { stdout: currentCrontab } = await execPromise('crontab -l');
    const newCrontab = currentCrontab.split('\n').filter(line => !line.includes(scriptName)).join('\n');
    await execPromise(`echo "${newCrontab}" | crontab -`);
    
    // Remover script
    const scriptPath = `/root/.openclaw/workspace/${scriptName}`;
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
    }
    
    res.json({ success: true, message: 'Cronjob recorrente removido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: calcular próxima execução
function calculateNextExecution(frequency, time, dayOfWeek, dayOfMonth) {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  
  // Simplificado - retorna data aproximada
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  
  if (frequency === 'daily' || frequency === 'weekdays') {
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (frequency === 'weekly') {
    const targetDay = parseInt(dayOfWeek);
    const currentDay = next.getDay();
    const daysUntil = (targetDay - currentDay + 7) % 7;
    next.setDate(next.getDate() + (daysUntil === 0 ? 7 : daysUntil));
  } else if (frequency === 'monthly') {
    next.setDate(parseInt(dayOfMonth));
    if (next <= now) next.setMonth(next.getMonth() + 1);
  }
  
  return next.toISOString();
}

// Listar todos os cronjobs (unificados)
app.get('/api/cronjobs/all', async (req, res) => {
  try {
    const [scheduledRes, recurringRes] = await Promise.all([
      supabase.from('scheduled_tasks').select('*'),
      supabase.from('recurring_tasks').select('*')
    ]);
    
    const allJobs = [
      ...(scheduledRes.data || []).map(j => ({ ...j, jobType: 'scheduled' })),
      ...(recurringRes.data || []).map(j => ({ ...j, jobType: 'recurring' }))
    ];
    
    res.json(allJobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ROTA: Spawnar agente do OpenClaw
// Chamada pelo Task Runner para executar tarefas
// ==========================================

app.post('/api/agent-spawn', async (req, res) => {
  try {
    const { agentId, task, taskId, timeout = 300000 } = req.body;
    
    console.log(`🤖 Spawning agente: ${agentId} para tarefa: ${taskId}`);
    
    if (!isConnected || !openclawWS) {
      return res.status(503).json({ 
        error: 'OpenClaw não conectado',
        fallback: true 
      });
    }
    
    // Enviar comando para OpenClaw spawnar subagente
    openclawWS.send(JSON.stringify({
      type: 'subagent.spawn',
      agentId: agentId,
      task: task,
      taskId: taskId,
      timeout: timeout,
      timestamp: new Date().toISOString()
    }));
    
    // Aguardar resposta (simplificado - em produção usar Promise com timeout)
    res.json({
      success: true,
      message: `Agente ${agentId} spawnado`,
      taskId: taskId,
      status: 'running'
    });
    
  } catch (err) {
    res.status(500).json({ 
      error: err.message,
      fallback: true 
    });
  }
});

// ==========================================
// ROTAS ESPECÍFICAS PARA TELEGRAM
// Simplificadas para criação rápida via chat
// ==========================================

// Criar cronjob único via Telegram (simplificado)
app.post('/api/telegram/scheduled-task', async (req, res) => {
  try {
    const { title, datetime, agent_id = 'freellm', description = '' } = req.body;
    
    // Converter datetime para cron (SP → UTC)
    const date = new Date(datetime);
    const minute = date.getMinutes();
    const hourSP = date.getHours();
    const hourUTC = (hourSP + 3) % 24;
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const cron = `${minute} ${hourUTC} ${day} ${month} *`;
    
    // Usar a mesma lógica do endpoint normal
    const response = await fetch(`http://localhost:${PORT}/api/scheduled-tasks/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || `Criado via Telegram`,
        agent_id,
        execute_at: datetime,
        cron,
        source: 'telegram'
      })
    });
    
    const result = await response.json();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar cronjob recorrente via Telegram (simplificado)
app.post('/api/telegram/recurring-task', async (req, res) => {
  try {
    const { title, frequency, time, agent_id = 'freellm', description = '', day_of_week = '1', day_of_month = '1' } = req.body;
    
    // Converter time para cron (SP → UTC)
    const [hourSP, minute] = time.split(':').map(Number);
    const hourUTC = (hourSP + 3) % 24;
    
    let cron;
    switch (frequency) {
      case 'daily': cron = `${minute} ${hourUTC} * * *`; break;
      case 'weekdays': cron = `${minute} ${hourUTC} * * 1-5`; break;
      case 'weekly': cron = `${minute} ${hourUTC} * * ${day_of_week}`; break;
      case 'monthly': cron = `${minute} ${hourUTC} ${day_of_month} * *`; break;
      default: cron = `${minute} ${hourUTC} * * *`;
    }
    
    const response = await fetch(`http://localhost:${PORT}/api/recurring-tasks/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || `Criado via Telegram`,
        agent_id,
        frequency,
        time,
        day_of_week,
        day_of_month,
        cron,
        source: 'telegram'
      })
    });
    
    const result = await response.json();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SINCRONIZAÇÃO DE MODELO — Dyad → VPS
// Quando trocar modelo no Dyad, atualiza agent.json na VPS
// ==========================================
const fs = require('fs');
const path = require('path');

// Mapeamento UUID Supabase → agentId na VPS
const SUPABASE_UUID_TO_AGENT = {
  '48916317-d996-4822-9e01-7ba50ae0e170': 'copywriter',
  '90149113-3e6a-4b40-b9da-cc997071fb68': 'designer',
  '78698cd5-acad-4c09-97f4-2ce37b9c0d90': 'analista',
  '8fa377f6-effd-401b-b0a5-0d622a3a601e': 'freellm',
  'eaa71569-7a1b-4c34-861f-752e9927eef0': 'barato',
  '7bc464ca-2f44-43bc-a217-7f035e7f5236': 'main',
};

const OPENCLAW_AGENTS_DIR = '/root/.openclaw/agents';
const OPENCLAW_CONFIG = '/root/.openclaw/openclaw.json';

// Helper: Atualizar modelo no openclaw.json (agents.list)
// Retorna erro se agente não existir (não cria automaticamente)
function updateOpenClawJsonModel(agentKey, modelFull) {
  const config = JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf-8'));
  
  // Garantir que modelo está na whitelist
  if (!config.agents.defaults.models[modelFull]) {
    config.agents.defaults.models[modelFull] = {};
  }
  
  // Verificar se agents.list existe
  if (!config.agents.list || !Array.isArray(config.agents.list)) {
    throw new Error(`agents.list não existe ou não é um array em ${OPENCLAW_CONFIG}`);
  }
  
  // Verificar se agente existe (NÃO cria automaticamente)
  const agentIndex = config.agents.list.findIndex(a => a.id === agentKey);
  
  if (agentIndex < 0) {
    throw new Error(`Agente "${agentKey}" não encontrado em agents.list. Cadastre o agente primeiro.`);
  }
  
  // Atualizar modelo do agente existente
  config.agents.list[agentIndex].model = modelFull;
  
  // Se for main, também atualizar o defaults (fallback)
  if (agentKey === 'main') {
    config.agents.defaults.model.primary = modelFull;
  }
  
  fs.writeFileSync(OPENCLAW_CONFIG, JSON.stringify(config, null, 2));
  console.log(`✅ openclaw.json atualizado: agents.list["${agentKey}"].model = ${modelFull}`);
  return config;
}

app.post('/api/agents/sync-model', async (req, res) => {
  try {
    const { agent_id, model } = req.body;
    if (!agent_id || !model) {
      return res.status(400).json({ error: 'agent_id e model são obrigatórios' });
    }

    const agentKey = SUPABASE_UUID_TO_AGENT[agent_id] || agent_id;
    const modelFull = model.startsWith('openrouter/') ? model : `openrouter/${model}`;
    
    // 1. SEMPRE atualizar openclaw.json (fonte principal de runtime)
    try {
      updateOpenClawJsonModel(agentKey, modelFull);
    } catch (updateErr) {
      console.error(`❌ Falha ao atualizar openclaw.json: ${updateErr.message}`);
      return res.status(400).json({ 
        error: updateErr.message,
        agent: agentKey,
        hint: 'Cadastre o agente em agents.list antes de alterar o modelo'
      });
    }

    if (agentKey === 'main') {
      // 2. Resetar sessão do main para aplicar imediatamente
      try {
        await resetMainSession();
        return res.json({ 
          success: true, 
          agent: 'main', 
          model: modelFull, 
          sessionReset: true,
          note: 'Modelo atualizado e sessão reiniciada'
        });
      } catch (resetErr) {
        console.error('Erro ao resetar sessão:', resetErr.message);
        return res.status(500).json({ 
          error: 'Modelo atualizado mas falha ao resetar sessão',
          details: resetErr.message 
        });
      }
    }

    // 3. Subagentes: também atualizar agent.json individual (se existir) - SEM reset de sessão
    let agentJsonUpdated = false;
    const agentJsonPath = path.join(OPENCLAW_AGENTS_DIR, agentKey, 'agent.json');
    if (fs.existsSync(agentJsonPath)) {
      const agentConfig = JSON.parse(fs.readFileSync(agentJsonPath, 'utf-8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''));
      agentConfig.model = modelFull;
      fs.writeFileSync(agentJsonPath, JSON.stringify(agentConfig, null, 2));
      console.log(`✅ agent.json atualizado: ${agentKey}`);
      agentJsonUpdated = true;
    }
    
    res.json({ 
      success: true, 
      agent: agentKey, 
      model: modelFull,
      openclawUpdated: true,
      agentJsonUpdated: agentJsonUpdated
    });

  } catch (err) {
    console.error('Erro sync-model:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Helper: Resetar sessão do agente principal (SÓ para main)
async function resetMainSession() {
  const SESSIONS_DIR = '/root/.openclaw/agents/main/sessions';
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  // Ler sessions.json para saber o sessionId ativo
  const sessionsFile = path.join(SESSIONS_DIR, 'sessions.json');
  let activeSessionId = null;

  if (fs.existsSync(sessionsFile)) {
    const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'));
    const entry = Object.values(sessions)[0];
    activeSessionId = entry?.sessionId || null;
  }

  // Remover .lock do session ativo
  if (activeSessionId && fs.existsSync(path.join(SESSIONS_DIR, `${activeSessionId}.jsonl.lock`))) {
    fs.unlinkSync(path.join(SESSIONS_DIR, `${activeSessionId}.jsonl.lock`));
  }

  // Deletar sessions.json
  if (fs.existsSync(sessionsFile)) fs.unlinkSync(sessionsFile);

  // Remover arquivo .jsonl da sessão ativa
  if (activeSessionId && fs.existsSync(path.join(SESSIONS_DIR, `${activeSessionId}.jsonl`))) {
    fs.unlinkSync(path.join(SESSIONS_DIR, `${activeSessionId}.jsonl`));
  }

  // Reiniciar gateway (desacoplado — fire and forget)
  require('child_process').spawn('/usr/local/bin/restart-gateway.sh', [], { detached: true, stdio: 'ignore' }).unref();
  console.log('✅ Gateway reiniciado após mudança de modelo');
}

// ==========================================
// RESET SESSÃO DO AGENTE PRINCIPAL
// Remove arquivos de sessão e reinicia o gateway para aplicar novo modelo
// ==========================================
app.post('/api/agents/reset-session', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    const SESSIONS_DIR = '/root/.openclaw/agents/main/sessions';

    // 1. Ler sessions.json para saber o sessionId ativo
    const sessionsFile = path.join(SESSIONS_DIR, 'sessions.json');
    let activeSessionId = null;

    if (fs.existsSync(sessionsFile)) {
      const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'));
      const entry = Object.values(sessions)[0];
      activeSessionId = entry?.sessionId || null;
    }

    // 2. Remover .lock do session ativo (se existir)
    if (activeSessionId) {
      const lockFile = path.join(SESSIONS_DIR, `${activeSessionId}.jsonl.lock`);
      if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
    }

    // 3. Deletar sessions.json
    if (fs.existsSync(sessionsFile)) fs.unlinkSync(sessionsFile);

    // 4. Remover arquivo .jsonl da sessão ativa
    if (activeSessionId) {
      const jsonlFile = path.join(SESSIONS_DIR, `${activeSessionId}.jsonl`);
      if (fs.existsSync(jsonlFile)) fs.unlinkSync(jsonlFile);
    }

    // 5. Reiniciar o gateway do OpenClaw para aplicar o novo modelo
    console.log('🔄 Reiniciando gateway do OpenClaw...');
    try {
      require('child_process').spawn('/usr/local/bin/restart-gateway.sh', [], { detached: true, stdio: 'ignore' }).unref();
      console.log('✅ Gateway reiniciado com sucesso');
    } catch (restartErr) {
      console.warn('⚠️ Aviso ao reiniciar gateway:', restartErr.message);
      // Não falha o endpoint se o restart der erro, pois os arquivos já foram limpos
    }

    console.log(`✅ Sessão do agente principal resetada (sessionId: ${activeSessionId})`);
    res.json({ 
      success: true, 
      message: 'Sessão reiniciada e gateway atualizado. O novo modelo está ativo!'
    });

  } catch (err) {
    console.error('Erro reset-session:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// GATEWAY RESTART — Confirmar Alteração de Modelo
// Apenas reinicia o gateway, sem mexer em arquivos de sessão
// ==========================================
app.post('/api/agents/gateway-restart', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    console.log('🔄 Reiniciando gateway (Confirmar Alteração)...');
    require('child_process').spawn('/usr/local/bin/restart-gateway.sh', [], { detached: true, stdio: 'ignore' }).unref();
    console.log('✅ Gateway reiniciado com sucesso');

    res.json({ success: true, message: 'Gateway reiniciado! Modelo atualizado com sucesso.' });
  } catch (err) {
    console.error('Erro gateway-restart:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API Bridge na porta ${PORT}`);
  connectToOpenClaw();
});
