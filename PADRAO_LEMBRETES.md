# 📋 PADRÃO DE LEMBRETES - Fuso Horário São Paulo (UTC-3)

## ⚠️ REGRA IMPORTANTE:
Sempre converter horário de SP para UTC antes de criar o cron job!

## 🔄 Conversão:
- **Horário SP (UTC-3)** → **UTC = SP + 3 horas**
- Exemplo: 22:00 SP = 01:00 UTC (do dia seguinte)

## 📝 Exemplo Prático:
Quer lembrete para 04:10 SP (amanhã de madrugada)?
- 04:10 SP = 07:10 UTC
- Timestamp: `1770621000000` (em milissegundos)

## ✅ Fórmula para calcular:
```bash
# Para lembrete às HH:MM de SP
# UTC = HH:MM + 3 horas

# Exemplo: 22:15 SP
# UTC = 22:15 + 3h = 01:15 (dia seguinte)
```

## 🎯 Próximos lembretes:
Sempre informar:
1. **Horário desejado** (ex: "22:30")
2. **Dia** (ex: "hoje", "amanhã", "10/02")
3. **Mensagem**

Eu calculo o UTC correto e crio o job!

## 📌 Status Atual:
- ✅ Lembrete 04:10 SP criado (executa 07:10 UTC)
- ⏳ Aguardando teste em 7 minutos
