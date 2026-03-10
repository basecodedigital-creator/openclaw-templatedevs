#!/usr/bin/env node
/**
 * TASK RUNNER V6 - SERVIÇO CONTÍNUO (DAEMON)
 * 
 * Solução definitiva para o problema de gaps no processamento.
 * Em vez de rodar via cron a cada 1 minuto, este script roda 
 * continuamente e verifica o banco a cada 15 segundos.
 * 
 * Isso elimina completamente os problemas de:
 * - Gaps quando o processo demora > 1 minuto
 * - Lembretes perdidos quando criados em cima da hora
 * - Race conditions com lock files
 */

require('./load-env'); // Carrega variáveis do .env
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');

const execPromise = util.promisify(exec);

// Configurações
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const CHECK_INTERVAL_MS = 15000; // 15 segundos
const LOG_FILE = '/root/.openclaw/workspace/logs/task-runner-daemon.log';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 📝 Logger
function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  console.log(line.trim());
  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch(e) {}
}

// ==========================================
// PROCESSAR LEMBRETES
// ==========================================

async function processReminders() {
  try {
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('status', 'pending');
    
    if (error) {
      log(`❌ Erro ao buscar lembretes: ${error.message}`);
      return;
    }
    
    if (!reminders || reminders.length === 0) {
      return; // Silencioso quando não há nada
    }
    
    log(`📋 ${reminders.length} lembrete(s) pendente(s)`);
    
    const now = new Date();
    const nowHour = now.getUTCHours();
    const nowMinute = now.getUTCMinutes();
    const nowDay = now.getUTCDate();
    const nowMonth = now.getUTCMonth() + 1;
    
    let executados = 0;
    
    for (const reminder of reminders) {
      if (!reminder.schedule) continue;
      
      // Parse cron: "MM HH DD MM *"
      const parts = reminder.schedule.split(' ');
      if (parts.length < 4) continue;
      
      const minute = parseInt(parts[0]);
      const hour = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      const month = parseInt(parts[3]);
      
      // Verificar se é hora de executar (com margem de 2 minutos)
      const horaIgual = hour === nowHour;
      const minutoDentroMargem = Math.abs(minute - nowMinute) <= 1;
      const diaIgual = day === nowDay;
      const mesIgual = month === nowMonth;
      
      if (horaIgual && minutoDentroMargem && diaIgual && mesIgual) {
        log(`🚀 Executando: ${reminder.title}`);
        await executeReminder(reminder);
        executados++;
      }
    }
    
    if (executados > 0) {
      log(`✅ ${executados} lembrete(s) executado(s)`);
    }
    
  } catch (err) {
    log(`❌ Erro: ${err.message}`);
  }
}

async function executeReminder(reminder) {
  try {
    // Enviar notificação no Telegram
    const message = `🔔 <b>LEMBRETE</b>\n\n${reminder.title}`;
    
    await execPromise(`curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d "chat_id=${TELEGRAM_CHAT_ID}" \
      -d "text=${message.replace(/"/g, '\\"')}" \
      -d "parse_mode=HTML"`, { timeout: 10000 });
    
    // Atualizar status no banco
    await supabase
      .from('reminders')
      .update({ 
        status: 'executed', 
        executed_at: new Date().toISOString() 
      })
      .eq('id', reminder.id);
    
    log(`✅ Executado: ${reminder.title}`);
    
  } catch (err) {
    log(`❌ Erro ao executar: ${err.message}`);
  }
}

// ==========================================
// PROCESSAR TAREFAS (SCHEDULED_TASKS)
// ==========================================

async function processTasks() {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
    
    const { data: tasks, error } = await supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('status', 'scheduled')
      .not('cron', 'is', null)
      .gte('execute_at', fiveMinutesAgo.toISOString())
      .lte('execute_at', now.toISOString());
    
    if (error) {
      log(`❌ Erro ao buscar tarefas: ${error.message}`);
      return;
    }
    
    if (!tasks || tasks.length === 0) {
      return;
    }
    
    log(`📋 ${tasks.length} tarefa(s) para executar`);
    
    for (const task of tasks) {
      // Verificar se já foi executada
      if (task.executed_at) {
        log(`⚠️ Tarefa ${task.id} já executada, pulando`);
        continue;
      }
      
      await executeTask(task);
    }
    
  } catch (err) {
    log(`❌ Erro em processTasks: ${err.message}`);
  }
}

async function executeTask(task) {
  try {
    // Atualizar para running
    await supabase.from('scheduled_tasks').update({ status: 'running' }).eq('id', task.id);
    
    // Mapear agente
    const UUID_MAP = {
      '48916317-d996-4822-9e01-7ba50ae0e170': 'copywriter',
      '90149113-3e6a-4b40-b9da-cc997071fb68': 'designer',
      'designer': 'designer', 'analista': 'analista', 
      'freellm': 'freellm', 'barato': 'barato', 'copywriter': 'copywriter'
    };
    
    let agentId = task.agent_id || 'freellm';
    if (UUID_MAP[agentId]) agentId = UUID_MAP[agentId];
    
    // Chamar auto-executor
    const description = task.description || task.title;
    const cmd = `/usr/bin/node /root/.openclaw/workspace/auto-executor-silent.js "${task.id}" "${agentId}" "${description.replace(/"/g, '\\"')}" 2>/dev/null`;
    
    await execPromise(cmd, { timeout: 240000 });
    
    log(`✅ Tarefa executada: ${task.title}`);
    
  } catch (err) {
    log(`❌ Erro na tarefa: ${err.message}`);
    await supabase.from('scheduled_tasks').update({
      status: 'error',
      executed_at: new Date().toISOString(),
      result: JSON.stringify({ error: err.message })
    }).eq('id', task.id);
  }
}

// ==========================================
// LOOP PRINCIPAL
// ==========================================

async function main() {
  log('🚀 Task Runner Daemon V6.0 iniciado');
  log(`⏰ Verificando a cada ${CHECK_INTERVAL_MS/1000} segundos`);
  
  while (true) {
    try {
      await processReminders();
      await processTasks();
    } catch (err) {
      log(`❌ Erro no loop: ${err.message}`);
    }
    
    // Aguardar antes da próxima verificação
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL_MS));
  }
}

// Tratamento de sinais para desligamento gracioso
process.on('SIGINT', () => {
  log('👋 Desligando...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('👋 Desligando...');
  process.exit(0);
});

// Iniciar
main().catch(err => {
  log(`❌ Erro fatal: ${err.message}`);
  process.exit(1);
});
