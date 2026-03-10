# 🌐 DOCUMENTAÇÃO - PLAYWRIGHT (Automação de Browser)

> **Data:** 2026-03-06  
> **Propósito:** Acesso a sites com JavaScript/SPA (Single Page Applications)

---

## 📍 LOCALIZAÇÃO DOS ARQUIVOS

### Core do Playwright:
```
/root/.openclaw/workspace/node_modules/playwright/
```

### Scripts de Automação:
```
/root/.openclaw/workspace/playwright-extract.js      # Extrair texto/conteúdo
/root/.openclaw/workspace/playwright-screenshot.js   # Tirar screenshots
/root/.openclaw/workspace/playwright-click.js        # Clicar em elementos
/root/.openclaw/workspace/playwright-form.js         # Preencher formulários
/root/.openclaw/workspace/playwright-automation.sh   # Script shell geral
/root/.openclaw/workspace/playwright-monitor.js      # Monitoramento
```

---

## 🎯 QUANDO USAR

**Use Playwright quando:**
- ❌ `curl` ou `web_fetch` retornam apenas HTML vazio/título
- ❌ Site é React/Vue/Angular (SPA - Single Page Application)
- ✅ Precisa interagir com elementos (clicar, rolar)
- ✅ Precisa esperar JavaScript renderizar conteúdo

**Exemplos de uso:**
- Sites como `meuniverkids.com.br` (React)
- Dashboards com dados carregados via API
- Páginas que exigem login/automação

---

## 🚀 COMO USAR

### Método 1: Comando Inline (Rápido)
```bash
cd /root/.openclaw/workspace && node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://site.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text);
  await browser.close();
})();
"
```

### Método 2: Script Pronto
```bash
cd /root/.openclaw/workspace
node playwright-extract.js
# Editar o URL dentro do script antes
```

---

## ✅ VERIFICAÇÃO DE INSTALAÇÃO

**Teste rápido:**
```bash
cd /root/.openclaw/workspace && node -e "const { chromium } = require('playwright'); console.log('✅ Playwright OK')"
```

**Se der erro:** Playwright não está instalado → seguir restauração abaixo.

---

## 🔄 RESTAURAÇÃO (Se Perder)

### Opção 1: Do Backup (Mais Rápido)
```bash
# Copiar do backup mais recente
cp -r /root/.openclaw/backup/20260228-022128/workspace/node_modules/playwright \
      /root/.openclaw/workspace/node_modules/

# Copiar scripts
cp /root/.openclaw/backup/20260228-022128/workspace/playwright*.js \
   /root/.openclaw/workspace/
```

### Opção 2: Instalação Nova
```bash
cd /root/.openclaw/workspace
npm install playwright
npx playwright install chromium
```

---

## 🛡️ PROTEÇÃO CONTRA FUTURAS PERDAS

### 1. Verificação Pós-Update
Após qualquer atualização do OpenClaw ou restore de backup:
```bash
# Rodar este comando para verificar se Playwright existe
cd /root/.openclaw/workspace && ls node_modules/playwright 2>/dev/null && echo "OK" || echo "NEED RESTORE"
```

### 2. Backup Periódico
Incluir Playwright nos backups:
```bash
# Adicionar ao script de backup existente
tar -czf backup-completo.tar.gz \
    /root/.openclaw/workspace/node_modules/playwright \
    /root/.openclaw/workspace/playwright*.js \
    [outros arquivos...]
```

---

## 📝 REGISTRO DE RESTAURAÇÕES

| Data | Motivo | Ação | Status |
|------|--------|------|--------|
| 2026-03-06 | Perdido após update | Restaurado do backup 2026-02-28 | ✅ OK |
| | | | |

---

## 💡 DICAS

- **Timeout:** Sempre usar `timeout` no comando (ex: `timeout 60 node ...`)
- **Headless:** Manter `headless: true` para não abrir interface gráfica
- **Espera:** Usar `waitForTimeout(3000-5000)` após `goto` para JS renderizar
- **Debug:** Se falhar, tentar `waitUntil: 'networkidle'` em vez de `'domcontentloaded'`

---

*Última atualização: 2026-03-06*  
*Responsável: LuanaDevs*
