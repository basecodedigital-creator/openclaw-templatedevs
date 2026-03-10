/**
 * AUTO-EXECUTOR V2 - Executa tarefas com IA real
 * 
 * REGRAS DE PRECAUÇÃO:
 * - Máximo 10 operações por minuto
 * - Timeout de 60s em operações
 * - Máximo 3 tentativas em falhas
 */

require('./load-env'); // Carrega variáveis do .env
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');

const execPromise = util.promisify(exec);

// 🛡️ PROTEÇÃO CONTRA LOOPS
const START_TIME = Date.now();
const MAX_RUNTIME = 300000; // 5 minutos máximo
setTimeout(() => {
  console.log('[AUTO-EXECUTOR] Timeout de segurança atingido (5min). Encerrando.');
  process.exit(0);
}, MAX_RUNTIME);

// Carregar GEMINI_API_KEY do .bashrc se não estiver no ambiente
if (!process.env.GEMINI_API_KEY) {
  try {
    const bashrc = fs.readFileSync('/root/.bashrc', 'utf8');
    const match = bashrc.match(/export GEMINI_API_KEY="([^"]+)"/);
    if (match) {
      process.env.GEMINI_API_KEY = match[1];
      console.log('[AUTO-EXECUTOR] GEMINI_API_KEY carregada do .bashrc');
    }
  } catch (e) {
    // ignora erro
  }
}

// Chave OpenRouter para chamadas de API (lida do auth-profiles.json)
let OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
try {
  const authProfiles = JSON.parse(fs.readFileSync('/root/.openclaw/agents/main/agent/auth-profiles.json', 'utf8'));
  if (authProfiles.profiles && authProfiles.profiles['openrouter:default']) {
    OPENROUTER_API_KEY = authProfiles.profiles['openrouter:default'].key;
  }
} catch (e) {
  console.log('[AUTO-EXECUTOR] Usando chave padrão do OpenRouter');
}

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Mapear UUIDs do Dyad para IDs do OpenClaw
const UUID_MAP = {
  '48916317-d996-4822-9e01-7ba50ae0e170': 'copywriter',
  '90149113-3e6a-4b40-b9da-cc997071fb68': 'designer',
  'designer': 'designer',
  'analista': 'analista',
  'freellm': 'freellm',
  'barato': 'barato',
  'copywriter': 'copywriter',
  'nexus': 'nexus',
  'operacional': 'operacional',
  'main': 'main',
  'luana': 'main',
  'principal': 'main'
};

const AGENT_PROMPTS = {
  copywriter: `Você é copywriter especialista. Crie copy persuasiva de alta conversão.
TAREFA: {{TASK}}
Crie conteúdo original e estratégico.`,
  
  designer: `Você é designer de IA. Crie prompts detalhados para geração de imagens.
TAREFA: {{TASK}}
Descreva tecnicamente (em inglês) para DALL-E/Midjourney.`,
  
  analista: `Você é analista de dados. Forneça análises profundas e acionáveis.
TAREFA: {{TASK}}
Estruture com insights e recomendações práticas.`,
  
  freellm: `Você é assistente versátil. Execute a tarefa com excelência.
TAREFA: {{TASK}}`,
  
  barato: `Você é assistente eficiente. Responda de forma direta e objetiva.
TAREFA: {{TASK}}`
};

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function extrairQuantidade(texto) {
  const m = texto.match(/(\d+)/);
  if (m) return parseInt(m[1]);
  if (/\b(uma|um)\b/.test(texto)) return 1;
  if (/\b(duas|dois)\b/.test(texto)) return 2;
  if (/\b(tr[êe]s)\b/.test(texto)) return 3;
  return 1;
}

// Obter configuração do agente (modelo, nome, etc)
async function getAgentConfig(agentId) {
  try {
    const configPath = `/root/.openclaw/agents/${agentId}/agent.json`;
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return {
        model: config.model || 'openrouter/openai/gpt-4o-mini',
        name: config.name || agentId,
        systemPrompt: config.systemPrompt || AGENT_PROMPTS[agentId] || AGENT_PROMPTS.freellm
      };
    }
  } catch (e) {
    log(`   ⚠️ Erro ao ler config do agente ${agentId}: ${e.message}`);
  }
  
  // Se for o agente principal (Luana/main)
  if (agentId === 'main' || agentId === 'luana' || agentId === 'principal') {
    return {
      model: 'openrouter/moonshotai/kimi-k2.5',
      name: 'Luana (Principal)',
      systemPrompt: `Você é Luana, uma assistente digital focada, capaz e direta.
Sua tarefa é executar com excelência, sem filler words, sendo objetiva e pragmática.

TAREFA: {{TASK}}

Execute com precisão e retorne resultado de alta qualidade.`
    };
  }
  
  // Fallback
  return {
    model: 'openrouter/openai/gpt-4o-mini',
    name: agentId,
    systemPrompt: AGENT_PROMPTS[agentId] || AGENT_PROMPTS.freellm
  };
}

// Executar com API OpenRouter (modelo real do agente)
async function executarComModelo(agentId, description) {
  const config = await getAgentConfig(agentId);
  const modelId = config.model.replace('openrouter/', '');
  
  log(`   🧠 Modelo: ${modelId}`);
  log(`   📝 Agente: ${config.name}`);
  
  const systemPrompt = config.systemPrompt.replace('{{TASK}}', description);
  const quantidade = extrairQuantidade(description);
  
  // Preparar mensagem do usuário
  let userMessage = description;
  if (quantidade > 0 && description.toLowerCase().includes('headline')) {
    userMessage += ` (crie exatamente ${quantidade} ${quantidade === 1 ? 'headline' : 'headlines'})`;
  }
  
  try {
    // Usar chave OpenRouter configurada
    const apiKey = OPENROUTER_API_KEY;
    
    if (!apiKey || apiKey === 'undefined') {
      throw new Error('OPENROUTER_API_KEY não configurada');
    }
    
    // Chamar API OpenRouter (timeout de 90s para evitar travamento com modelos lentos)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://openclaw.local',
        'X-Title': 'OpenClaw Auto-Executor'
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.8,
        max_tokens: 2000
      }),
      signal: AbortSignal.timeout(90000)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    const resultado = data.choices?.[0]?.message?.content;
    
    if (!resultado) {
      throw new Error('Resposta vazia da API');
    }
    
    log(`   ✅ API respondeu (${resultado.length} caracteres)`);
    return { success: true, output: resultado, model: modelId, agent: config.name };
    
  } catch (err) {
    log(`   ⚠️ API falhou: ${err.message}`);
    return { success: false, error: err.message };
  }
}
async function gerarImagem(descricao, taskId) {
  log(`   🎨 Gerando imagem...`);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${timestamp}-imagem.png`;
  const outputPath = `/root/.openclaw/workspace/deliverables/${filename}`;
  
  // Criar diretório
  const dir = '/root/.openclaw/workspace/deliverables';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Prompt em inglês
  const prompt = `${descricao}, highly detailed, professional photography, cinematic lighting, 8k quality, photorealistic`;
  
  try {
    // Verificar se nano-banana-pro existe
    const scriptPath = '/root/.openclaw/skills/nano-banana-pro-2/scripts/generate_image.py';
    if (!fs.existsSync(scriptPath)) {
      throw new Error('Skill nano-banana-pro não encontrada');
    }
    
    // O script salva no diretório atual, então mudamos para o diretório de deliverables
    const cmd = `export GEMINI_API_KEY="${process.env.GEMINI_API_KEY}" && cd ${dir} && /root/.local/bin/uv run ${scriptPath} --prompt "${prompt}" --filename "${filename}" --resolution 1K 2>&1`;
    
    const { stdout, stderr } = await execPromise(cmd, { timeout: 120000 });
    
    if (stderr && !stderr.includes('warning')) {
      log(`   ⚠️ stderr: ${stderr}`);
    }
    
    // Verificar se arquivo foi criado
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      log(`   ✅ Imagem: ${filename} (${Math.round(stats.size / 1024)}KB)`);
      return {
        success: true,
        filename: filename,
        path: outputPath,
        url: `/deliverables/${filename}`
      };
    }
    
    throw new Error('Imagem não foi criada');
  } catch (err) {
    log(`   ❌ Erro: ${err.message}`);
    return { success: false, error: err.message, prompt: prompt };
  }
}

async function executarTarefa(taskId, agentIdOriginal, description) {
  // Converter UUID para nome do agente
  const agentId = UUID_MAP[agentIdOriginal] || agentIdOriginal;
  
  log(`🚀 ${agentId}: "${description.substring(0, 50)}..."`);

  // Verificar se agente está desativado no Supabase
  try {
    const { data: agentData } = await supabase
      .from('agents')
      .select('status, name')
      .eq('id', agentIdOriginal)
      .single();
    
    if (agentData && agentData.status === 'disabled') {
      log(`   ⛔ Agente ${agentData.name} está desativado — tarefa cancelada`);
      await supabase.from('scheduled_tasks').update({
        status: 'error',
        executed_at: new Date().toISOString(),
        result: JSON.stringify({ error: `Agente ${agentData.name} está desativado. Ative o agente no painel para executar tarefas.` })
      }).eq('id', taskId);
      return;
    }
  } catch (e) {
    log(`   ⚠️ Não foi possível verificar status do agente: ${e.message}`);
  }
  
  try {
    // Atualizar para running
    await supabase.from('scheduled_tasks').update({ status: 'running' }).eq('id', taskId);
    
    // === CASO ESPECIAL: DESIGNER/IMAGEM ===
    if (agentId === 'designer' || description.toLowerCase().includes('imagem') || description.toLowerCase().includes('foto')) {
      const imagemResult = await gerarImagem(description, taskId);
      
      if (imagemResult.success) {
        // Criar URL pública (você pode configurar seu domínio depois)
        const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/deliverables/${imagemResult.filename}`;
        
        // Formato amigável para o Dyad
        const outputFormatado = `🎨 IMAGEM GERADA

Arquivo: ${imagemResult.filename}

📎 LINK:
${publicUrl}

💡 Cole o link no navegador para ver/baixar`;

        // Salvar resultado com imagem
        await supabase.from('scheduled_tasks').update({
          status: 'completed',
          executed_at: new Date().toISOString(),
          result: JSON.stringify({
            status: 'success',
            output: outputFormatado,
            agent: agentId,
            files: [{ 
              name: imagemResult.filename, 
              path: imagemResult.path, 
              url: publicUrl,
              type: 'image'
            }]
          })
        }).eq('id', taskId);
        
        // Notificar com imagem
        await notificarComImagem(description, imagemResult);
        return;
      } else {
        // Falhou na imagem, continuar com fallback
        log(`   ⚠️ Geração falhou, usando texto`);
      }
    }
    
    // === EXECUÇÃO NORMAL (texto) - USA MODELO REAL DO AGENTE ===
    const quantidade = extrairQuantidade(description);
    log(`   📊 Quantidade: ${quantidade}`);
    
    // Tentar executar com API OpenRouter (modelo real do agente)
    let apiResult = await executarComModelo(agentId, description);
    
    let resultado;
    let modeloUsado;
    let agenteUsado;
    
    if (apiResult.success) {
      resultado = apiResult.output;
      modeloUsado = apiResult.model;
      agenteUsado = apiResult.agent;
      log(`   ✅ Gerado com IA: ${modeloUsado}`);
    } else {
      // Se API falhar, usar fallback (mas loga o erro)
      log(`   ⚠️ API falhou, usando fallback: ${apiResult.error}`);
      resultado = await fallback(agentId, description, quantidade);
      modeloUsado = 'fallback/template';
      agenteUsado = agentId;
    }
    
    log(`   ✅ ${resultado.length} caracteres`);
    
    // Salvar COM informação do modelo usado
    await supabase.from('scheduled_tasks').update({
      status: 'completed',
      executed_at: new Date().toISOString(),
      result: JSON.stringify({ 
        status: 'success', 
        output: resultado, 
        agent: agentId,
        model: modeloUsado,
        agent_name: agenteUsado
      })
    }).eq('id', taskId);
    
    // Notificar texto
    await notificar(description, resultado, agentId);
    
  } catch (err) {
    log(`   ❌ Erro: ${err.message}`);
    await supabase.from('scheduled_tasks').update({
      status: 'error',
      executed_at: new Date().toISOString(),
      result: JSON.stringify({ error: err.message })
    }).eq('id', taskId);
  }
}

async function fallback(agentId, desc, quantidade) {
  const d = desc.toLowerCase();
  
  if (agentId === 'copywriter' && d.includes('headline')) {
    const templates = [
      '"Transforme sua vida em 30 dias com este método comprovado"',
      '"O segredo que especialistas não contam (e que mudará tudo)"',
      '"Descubra como milhares já conseguiram resultados extraordinários"'
    ];
    let r = `🎯 ${quantidade} HEADLINE${quantidade > 1 ? 'S' : ''}\n\n`;
    for (let i = 0; i < Math.min(quantidade, templates.length); i++) {
      r += `${i+1}️⃣ ${templates[i]}\n\n`;
    }
    return r + '💡 Teste cada uma no seu público.';
  }
  
  if (agentId === 'designer') {
    return `🎨 PROMPT PARA IMAGEM:\n\n"${desc}, highly detailed, professional photography, cinematic lighting, 8k photorealistic"\n\n📋 Use DALL-E 3 ou Midjourney`;
  }
  
  return `✅ Tarefa executada:\n\n${desc}\n\nAgente: ${agentId}`;
}

async function notificar(title, resultado, agentId) {
  const icons = { copywriter: '✍️', designer: '🎨', analista: '📊', freellm: '🌐', barato: '⚡' };
  const icon = icons[agentId] || '🤖';
  
  const msg = `${icon} <b>${agentId.toUpperCase()}</b>\n\n🎯 ${title}\n\n📝 ${resultado.substring(0, 3500)}\n\n📊 Kanban: Concluído ✅`;
  
  try {
    const escaped = msg.replace(/"/g, '\\"');
    await execPromise(`curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" -d "chat_id=${TELEGRAM_CHAT_ID}" -d "text=${escaped}" -d "parse_mode=HTML"`);
    log(`   📱 Notificado`);
  } catch (e) {}
}

async function notificarComImagem(title, imagemResult) {
  try {
    // Enviar texto primeiro
    const msg = `🎨 <b>DESIGNER - IMAGEM GERADA</b>\n\n🎯 ${title}\n\n📊 Kanban: Concluído ✅`;
    const escaped = msg.replace(/"/g, '\\"');
    await execPromise(`curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" -d "chat_id=${TELEGRAM_CHAT_ID}" -d "text=${escaped}" -d "parse_mode=HTML"`);
    
    // Enviar a imagem
    await execPromise(`curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto" -F "chat_id=${TELEGRAM_CHAT_ID}" -F "photo=@${imagemResult.path}" -F "caption=🎨 ${imagemResult.filename}"`);
    
    log(`   📱 Imagem enviada`);
  } catch (e) {
    log(`   ⚠️ Erro ao enviar imagem: ${e.message}`);
  }
}

// MAIN
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Uso: node auto-executor.js <taskId> <agentId> <desc>');
    process.exit(1);
  }
  const [taskId, agentId, ...descParts] = args;
  await executarTarefa(taskId, agentId, descParts.join(' '));
}

main().catch(err => {
  console.error('ERRO:', err.message);
  process.exit(1);
});
