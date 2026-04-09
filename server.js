const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let qrCodeData = null;
let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', async (qr) => {
  qrCodeData = await QRCode.toDataURL(qr);
  console.log('QR Code gerado! Abra http://localhost:3000 para escanear.');
});

client.on('ready', () => {
  isReady = true;
  qrCodeData = null;
  console.log('WhatsApp conectado com sucesso!');
});

client.on('disconnected', () => {
  isReady = false;
  console.log('WhatsApp desconectado.');
});

client.initialize();

app.get('/api/status', (req, res) => {
  res.json({ ready: isReady, qr: qrCodeData });
});

app.post('/api/enviar', async (req, res) => {
  if (!isReady) {
    return res.status(400).json({ error: 'WhatsApp não está conectado.' });
  }

  const { numeros, mensagens, delay, modo } = req.body;
  // modo: 'rotacao' (1 msg por cliente alternando) ou 'sequencial' (todas msgs para cada cliente)
  const delayMs = Math.max(5, Math.min(120, delay || 15)) * 1000;

  if (!numeros || !mensagens || mensagens.length === 0) {
    return res.status(400).json({ error: 'Números e mensagens são obrigatórios.' });
  }

  // Parse: "numero | nome | empresa" ou só "numero"
  const lista = numeros
    .split('\n')
    .map(line => {
      const parts = line.split('|').map(p => p.trim());
      const num = parts[0].replace(/\D/g, '').trim();
      return {
        numero: num,
        nome: parts[1] || '',
        empresa: parts[2] || ''
      };
    })
    .filter(item => item.numero.length >= 10);

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  let enviados = 0;
  const totalEnvios = modo === 'sequencial' ? lista.length * mensagens.length : lista.length;
  let envioAtual = 0;

  for (let i = 0; i < lista.length; i++) {
    const { numero, nome, empresa } = lista[i];
    const formatado = numero.length <= 11 ? `55${numero}` : numero;

    try {
      let numberId = await client.getNumberId(formatado);

      if (!numberId && formatado.length === 13) {
        const semNove = formatado.slice(0, 4) + formatado.slice(5);
        numberId = await client.getNumberId(semNove);
      }

      if (!numberId) {
        envioAtual += modo === 'sequencial' ? mensagens.length : 1;
        res.write(JSON.stringify({
          tipo: 'progresso', atual: envioAtual, total: totalEnvios,
          numero, status: 'erro', detalhe: 'Numero nao encontrado no WhatsApp',
          modelo: 0
        }) + '\n');
        continue;
      }

      // Função para substituir variáveis
      function personalize(msg) {
        return msg
          .replace(/\{nome\}/gi, nome)
          .replace(/\{empresa\}/gi, empresa);
      }

      if (modo === 'sequencial') {
        for (let m = 0; m < mensagens.length; m++) {
          envioAtual++;
          try {
            await client.sendMessage(numberId._serialized, personalize(mensagens[m]));
            enviados++;
            res.write(JSON.stringify({
              tipo: 'progresso', atual: envioAtual, total: totalEnvios,
              numero, status: 'enviado', modelo: m + 1,
              info: `Msg ${m + 1}/${mensagens.length}`
            }) + '\n');
            console.log(`Msg ${m + 1}/${mensagens.length} enviada para ${numero}`);
            // Delay curto entre mensagens do mesmo cliente (3-5s)
            if (m < mensagens.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
            }
          } catch (err) {
            res.write(JSON.stringify({
              tipo: 'progresso', atual: envioAtual, total: totalEnvios,
              numero, status: 'erro', detalhe: err.message, modelo: m + 1
            }) + '\n');
          }
        }
      } else {
        // Rotacao: 1 mensagem por cliente
        envioAtual++;
        const mensagem = personalize(mensagens[i % mensagens.length]);
        await client.sendMessage(numberId._serialized, mensagem);
        enviados++;
        res.write(JSON.stringify({
          tipo: 'progresso', atual: envioAtual, total: totalEnvios,
          numero, status: 'enviado', modelo: (i % mensagens.length) + 1
        }) + '\n');
        console.log(`Mensagem enviada para ${numero} (modelo ${(i % mensagens.length) + 1})`);
      }
    } catch (err) {
      envioAtual++;
      res.write(JSON.stringify({
        tipo: 'progresso', atual: envioAtual, total: totalEnvios,
        numero, status: 'erro', detalhe: err.message, modelo: 0
      }) + '\n');
    }

    // Delay entre clientes
    if (i < lista.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  res.write(JSON.stringify({
    tipo: 'fim', total: totalEnvios, enviados
  }) + '\n');
  res.end();
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:3000`);
});
