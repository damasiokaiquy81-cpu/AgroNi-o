# AgroNiño

Plataforma de acompanhamento climático e agrícola, em implementação. Interface em português, responsiva, inspirada na referência fornecida. **Esta versão é uma demonstração funcional, não um serviço agronômico de produção.**

## Executar

Recomendado Node.js 24. Neste ambiente com proxy, os scripts ativam `NODE_USE_ENV_PROXY=1`, recurso do Node 24.

```sh
npm ci
npm run dev
```

A aplicação escuta na porta 3000. `npm run build` gera a distribuição e `npm start` inicia a versão de produção. `npm test` executa os testes de chuva, calor e validação das fontes; `npm run typecheck` verifica os tipos.

## O que funciona nesta versão

- Dashboard, navegação, seleção entre quatro localidades de referência. Culturas são configuradas nas propriedades e nas regras.
- Mapa Leaflet com limites municipais reais de referência, destaque do município selecionado e navegação animada. A camada local funciona sem acesso a serviços externos; a camada opcional de ruas usa OpenStreetMap. Sem camada de risco fabricada.
- Cadastro de propriedades, edição e ativação de regras de chuva e calor com responsável, registro opcional e histórico de alterações; histórico de alertas e consentimento sandbox em localStorage.
- Simulação de chuva acumulada ou temperatura máxima, deduplicação por regra/município/dia e prévia WhatsApp sem envio.
- Consulta meteorológica no servidor via `GET /api/weather?lat=...&lon=...`, cache de 30 minutos, timeout, coordenadas validadas e erros explícitos. A previsão real é consultada automaticamente ao abrir o painel ou mudar de município; a fonte e o momento da consulta aparecem na tela.
- Catálogo IBGE no servidor via `GET /api/municipalities?uf=MT`, cache de 24 horas. A seleção visual ainda usa quatro localidades fixas; não confundir com catálogo nacional integrado.

A previsão usa dados reais quando a consulta tem sucesso; em falhas, o cenário demonstrativo é identificado. Os cards ENSO não exibem fase ativa ou probabilidades sem verificação. Nenhum boletim atual da NOAA foi importado. Os links das instituições são fontes de referência, não integrações de ingestão ativas. O armazenamento do navegador não é um banco compartilhado nem autenticação; não cadastre dados sensíveis.

## Infraestrutura inicial, ainda não integrada à interface

Há um schema Prisma inicial e um Compose para PostgreSQL e Redis. O schema não cobre ainda todas as entidades do produto e não há migrations versionadas. Para um banco **novo de desenvolvimento**, configure `.env` a partir de `.env.example`, forneça uma senha local própria e rode:

```sh
docker compose up -d
npm run db:generate
npm run db:push
npm run worker
```

O worker agenda somente um heartbeat sandbox a cada hora, com retentativas e encerramento gracioso. **Não coleta fontes, avalia propriedades de produção nem envia notificações.** A interface não usa PostgreSQL nesta etapa. Não execute `db:push` em banco de produção.

## Rede e credenciais

Interface sem credenciais. Open-Meteo: `api.open-meteo.com`; IBGE: `servicodados.ibge.gov.br`; mapa: `*.tile.openstreetmap.org`; fontes: `fonts.googleapis.com`, `fonts.gstatic.com`; geração Prisma: `binaries.prisma.sh`. Preserve TLS e checksums. A Open-Meteo foi validada com dados reais neste ambiente. IBGE apresentou falha TLS no caminho de saída; NOAA precisa de liberação de rede. Veja o painel Integrações e [instruções de conexão](docs/CONNECTIONS.md).

WhatsApp real ainda não implementado. A etapa futura exigirá aplicativo Meta, número habilitado, templates aprovados, credenciais somente no servidor, webhook verificado, consentimento persistido e cancelamento. Não informe tokens no chat ou em commits.

## Antes de produção

Veja [plano de desenvolvimento](docs/IMPLEMENTATION.md). Autenticação, autorização por organização, banco integrado, auditoria, notificações, backups e revisão profissional são pendentes. Verificar licença comercial Open-Meteo e política de tiles OpenStreetMap antes da publicação comercial. Não utilizar a demonstração para decisões meteorológicas ou operações agrícolas.

## Testes de navegador

```sh
npx playwright install chromium
npm run test:e2e
```

Se já houver Chromium no sistema, use `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`. Os testes criam dados apenas no contexto isolado do navegador. Validam cadastro, persistência local, simulação, deduplicação e largura móvel.

## Interface e cartografia

O módulo de economia e preços foi removido do escopo. O dashboard usa paleta vermelha/carvão, cenário climático ilustrativo em perspectiva 3D e panorama de precipitação com gráfico animado. O som ambiente de chuva é sintetizado no navegador, vem desligado e só começa após um clique. Não representa a chuva real na região. Animações respeitam a preferência de movimento reduzido do sistema.

O mapa abre em Sorriso/MT como exemplo e acompanha a seleção de município. A cor de destaque indica a seleção geográfica, nunca risco climático. A camada Território inclui geometrias IBGE distribuídas por Geodata BR (CC0), com fonte e limitações em `public/maps/SOURCES.md`. A data de atualização dos limites não é garantida. A camada Ruas depende da disponibilidade e das políticas de acesso do OpenStreetMap.
