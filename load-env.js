/**
 * load-env.js — Carrega variáveis do .env
 * Usar no topo de qualquer script: require('./load-env');
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=');
    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
  }
}
