# Validação da versão atual

Validação realizada em 15/10/2026 neste ambiente.

- `npm test`: 13 testes aprovados — chuva, calor, limites e janela, dados inválidos, deduplicação, migração das regras anteriores, autoria e histórico, coordenadas, séries/unidades meteorológicas, catálogo municipal e identidade do documento ENSO.
- `npm run build`: compilação e verificação TypeScript aprovadas.
- `prisma validate`: schema válido, incluindo os campos de autoria e histórico; sem conexão ou alteração de banco.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`: 6 testes aprovados — propriedades/persistência, layout móvel, remoção de economia e mapa municipal, movimento reduzido, regra de calor com autoria/histórico, cenário interativo e áudio desligado por padrão/iniciado por clique/interrompido ao sair da página.
- Interface inspecionada em 1440 px e 390 px, sem erros JavaScript nem excesso de largura móvel.
- `GET /`: HTTP 200. Servidor iniciado com `NODE_USE_ENV_PROXY=1`, usando o proxy fornecido pelo ambiente.
- `GET /api/weather?lat=-12.5425&lon=-55.7211`: HTTP 200, `mode: live`, fonte Open-Meteo e sete dias de previsão. A página consulta automaticamente ao carregar e mudar o município. Fonte, horário da consulta no fuso da região e modo dos dados ficam visíveis.
- `GET /api/weather` sem coordenadas: HTTP 400. UF inválida no catálogo: HTTP 400.
- IBGE: indisponível pela falha TLS upstream do ambiente. Endpoint retorna HTTP 502 tratado. A verificação de certificados foi preservada.
- NOAA: conexão bloqueada pelo proxy nesta configuração em execução. Endpoint retorna HTTP 502 tratado, sem fase ou probabilidade fabricada. Domínio adicionado ao rascunho de rede; salvar rascunho não comprova aplicação na máquina ou acesso futuro.
- Cartografia local: 203 geometrias municipais, incluindo os quatro municípios de referência. Seleção de Sorriso para Silvânia e recentralização verificadas sem serviços externos. Camada de ruas OpenStreetMap continua opcional e sujeita às condições do provedor.

A identidade profissional informada nas regras não é autenticada. Cadastros e histórico ficam neste navegador. O nome preenchido é exibido na regra, no histórico e na prévia de mensagem. O histórico local não é uma trilha de auditoria inviolável.

PostgreSQL integrado à interface, migrações de produção, worker de coleta/alertas e envio Meta não foram implementados ou validados nesta entrega. Consulte `CONNECTIONS.md` para as ações necessárias e a implementação ainda pendente. Nenhuma mensagem real foi enviada.
