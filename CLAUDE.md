# WhatsApp Sender - FazNota IA

## O que é
App web para envio de mensagens WhatsApp para clientes. Usa `whatsapp-web.js` (não é API oficial, simula WhatsApp Web via Puppeteer).

## Como rodar (FORMA FÁCIL)
**Duplo clique no arquivo `iniciar.bat`** na pasta `faznota-ia`. Ele mata processos antigos e inicia o servidor automaticamente.
Depois abrir `http://localhost:3000` no navegador.

## Como rodar (manual)
```bash
npx kill-port 3000
cd faznota-ia
node server.js
```

## Resolução de problemas comuns

### Erro "EADDRINUSE: address already in use :::3000"
A porta 3000 está ocupada. Rode: `npx kill-port 3000` e tente novamente.

### Erro "Cannot read properties of undefined (reading 'WidFactory')"
Sessão corrompida. Feche tudo e delete a pasta `.wwebjs_auth`:
1. Gerenciador de Tarefas → finalizar todos node.exe e Google Chrome for Testing
2. `powershell -Command "Remove-Item -Recurse -Force 'C:\Users\User\faznota-ia\.wwebjs_auth' -ErrorAction SilentlyContinue"`
3. Rodar `iniciar.bat` novamente — vai pedir novo QR Code

### Erro "Attempted to use detached Frame"
Sessão expirou. Mesmo procedimento: deletar `.wwebjs_auth` e reconectar.

### Tela "Verificando conexao..." sem carregar QR
Pode ser erro no JavaScript. Acessar `http://localhost:3000/index.html?v=99` pra forçar sem cache.

### WhatsApp desconecta durante envio
Verificar no log do servidor qual foi o último número enviado e continuar a partir dele.

## Estrutura
- `server.js` — Backend Express + WhatsApp Web
- `public/index.html` — Interface web completa (single file)
- `iniciar.bat` — Script para iniciar fácil (duplo clique)
- `.wwebjs_auth/` — Sessão salva do WhatsApp (criada automaticamente)

## Funcionalidades
- **Modo Manual**: escreve uma mensagem e envia pra todos os números
- **Modo Rotação**: alterna automaticamente entre os modelos selecionados (1 msg por cliente)
- **Modo Sequencial**: envia TODAS as mensagens selecionadas pra cada cliente em ordem
- **Modelos de mensagem**: cria/edita/exclui templates com checkbox pra selecionar quais usar
- **Personalização**: usar {nome} e {empresa} nos modelos. Formato: `numero | nome | empresa`
- **Intervalo variável**: delay entre mensagens varia ±30% do valor base (mais natural)
- **Pausa real**: botão Pausar para o envio no servidor de verdade
- **Stats em tempo real**: caixa com contagem de enviados, erros e total
- **Barra de progresso**: mostra envio em tempo real via streaming

## Notas importantes
- Intervalo recomendado: 45s para 40+ números
- Variar mensagens com rotação reduz risco de bloqueio
- Não enviar pra mais de 50 números por dia
- Números são formatados automaticamente (adiciona 55 se não tiver)
- Verifica se o número existe no WhatsApp antes de enviar
- Quando não tem nome, o sistema limpa automaticamente (ex: "Boa tarde, !" vira "Boa tarde!")
