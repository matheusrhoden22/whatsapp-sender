# WhatsApp Sender - FazNota IA

## O que é
App web para envio de mensagens WhatsApp para clientes. Usa `whatsapp-web.js` (não é API oficial, simula WhatsApp Web via Puppeteer).

## Como rodar
```bash
cd faznota-ia
npm install
node server.js
```
Abrir `http://localhost:3000` no navegador e escanear o QR Code.

## Estrutura
- `server.js` — Backend Express + WhatsApp Web
- `public/index.html` — Interface web completa (single file)
- `.wwebjs_auth/` — Sessão salva do WhatsApp (criada automaticamente)

## Funcionalidades
- **Modo Manual**: escreve uma mensagem e envia pra todos os números
- **Modo Rotação**: alterna automaticamente entre os modelos salvos (1 msg por cliente)
- **Modo Sequencial**: envia TODAS as mensagens dos modelos pra cada cliente em ordem
- **Modelos de mensagem**: cria/salva/exclui templates (salvos no localStorage do navegador)
- **Intervalo configurável**: delay entre mensagens (recomendado 30s pra evitar ban)
- **Barra de progresso**: mostra envio em tempo real via streaming

## Notas importantes
- Intervalo recomendado: 30s para 20-50 números
- Variar mensagens reduz risco de bloqueio
- Não enviar pra mais de 50 números por vez
- A sessão WhatsApp fica salva, não precisa escanear QR toda vez
- Números são formatados automaticamente (adiciona 55 se não tiver)
- Verifica se o número existe no WhatsApp antes de enviar
