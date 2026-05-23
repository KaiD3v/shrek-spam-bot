# Shrek Spam Bot

Bot de Discord que envia mensagens via WhatsApp usando [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js). Inclui o clássico: disparar o roteiro completo de *Shrek* para um número fixo.

## Arquitetura

Dois processos separados no mesmo repositório:

```
Discord Bot (npm run dev)  ──HTTP──►  WhatsApp Service (npm run wpp)
                                         POST /send
                                         POST /script/shrek
```

- **Bot Discord** — escuta slash commands e chama a API local
- **Serviço WhatsApp** — mantém a sessão do WhatsApp Web e envia as mensagens

Isso evita que reinícios do bot (nodemon) derrubem a sessão do WhatsApp.

## Pré-requisitos

- Node.js 18+
- Conta Discord com [aplicação/bot](https://discord.com/developers/applications) criada
- WhatsApp no celular (para escanear o QR code na primeira execução)
- Linux/WSL: dependências do Chrome para o Puppeteer (Arch: `npm run wpp:deps`)

## Instalação

```bash
git clone <url-do-repo>
cd shrek-spam-bot
npm install
```

Crie o arquivo `.env` na raiz do projeto (veja seção abaixo).

Registre os slash commands no Discord:

```bash
npm run deploy
```

Convide o bot ao servidor com permissão de **applications.commands**.

## Configuração (`.env`)

```env
# Discord
DISCORD_TOKEN=seu_token_do_bot
GUILD_ID=id_do_servidor

# WhatsApp API
WPP_PORT=3001
WPP_API_URL=http://localhost:3001
WPP_API_SECRET=uma_senha_secreta_qualquer

# Destino das mensagens
WHATSAPP_TARGET=5511999999999

# Roteiro Shrek (intervalo entre mensagens, em ms)
SHREK_DELAY_MS=250

# Opcional
WPP_INIT_RETRIES=3
WPP_READY_TIMEOUT_MS=120000
WPP_SEND_READY_WAIT_MS=30000
# CHROME_EXECUTABLE_PATH=/usr/bin/chromium
```

| Variável | Descrição |
|----------|-----------|
| `DISCORD_TOKEN` | Token do bot (Developer Portal → Bot) |
| `GUILD_ID` | ID do servidor (modo desenvolvedor → copiar ID) |
| `WPP_API_SECRET` | Senha compartilhada entre bot e API WhatsApp |
| `WHATSAPP_TARGET` | Número de destino com DDI, sem `+` |

## Como rodar

**Terminal 1** — serviço WhatsApp:

```bash
npm run wpp
```

Na primeira vez, escaneie o QR code em **WhatsApp → Aparelhos conectados**. Aguarde:

```
WhatsApp client is ready!
```

**Terminal 2** — bot Discord:

```bash
npm run dev
```

## Comandos Discord

| Comando | Descrição |
|---------|-----------|
| `/ping` | Teste de resposta |
| `/enviar mensagem:...` | Envia uma mensagem para `WHATSAPP_TARGET` |
| `/shrek` | Envia o roteiro completo de Shrek (~2666 mensagens, ~11 min) |
| `/teste` | Comando de teste |

## Scripts npm

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Bot Discord (nodemon) |
| `npm run wpp` | Serviço WhatsApp + API HTTP |
| `npm run wpp:stop` | Para processos na porta e Chrome da sessão |
| `npm run wpp:reset` | Limpa sessão (exige novo QR code) |
| `npm run wpp:deps` | Instala deps do Chrome no Arch Linux |
| `npm run deploy` | Registra slash commands no Discord |

## API WhatsApp (local)

Todas as rotas exigem header:

```
Authorization: Bearer <WPP_API_SECRET>
```

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Status da conexão WhatsApp |
| `POST` | `/send` | Envia uma mensagem |
| `POST` | `/script/shrek` | Inicia o roteiro em background |
| `GET` | `/script/status` | Progresso do roteiro |

## Solução de problemas

**Token inválido (Discord)**  
Use o **Bot Token** (três partes separadas por `.`), não o Client Secret.

**WhatsApp não fica pronto**  
Aguarde `WhatsApp client is ready!` após escanear o QR. Se travar, rode `npm run wpp:stop` e depois `npm run wpp` de novo.

**Porta 3001 em uso**  
`npm run wpp:stop` ou `fuser -k 3001/tcp`

**Erro de Chrome/Puppeteer no Linux**  
`npm run wpp:deps` (Arch) ou instale as libs do Chromium manualmente.

**Comandos não aparecem no Discord**  
Confirme `GUILD_ID`, rode `npm run deploy` e verifique se o bot está no servidor.

## Aviso

Este projeto usa automação não oficial do WhatsApp Web. Uso excessivo (ex.: roteiro completo) pode resultar em limitação ou banimento da conta. Use por sua conta e risco, preferencialmente em ambiente pessoal/teste.

## Licença

ISC
