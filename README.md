# AgroNiño

Plataforma de acompanhamento climático e agrícola, em implementação. Interface em português, responsiva, inspirada na referência fornecida. **Esta versão é uma demonstração funcional, não um serviço agronômico de produção.**

## Executar

Requer Node.js 22 ou superior.

```sh
npm ci
npm run dev
```

A aplicação escuta na porta 3000. `npm run build` gera a distribuição e `npm start` inicia a versão de produção. `npm test` executa os testes do motor de chuva; `npm run typecheck` verifica os tipos.

## O que funciona nesta versão

- Dashboard, navegação, seleção entre quatro localidades de referência e seis culturas.
- Mapa Leaflet / OpenStreetMap, sem camada de risco fabricada.
- Cadastro de propriedades, edição e ativação de regras de chuva, histórico de alertas e consentimento sandbox em localStorage.
- Simulação de acumulado de chuva, deduplicação por regra/município/dia e prévia WhatsApp sem envio.
- Consulta meteorológica no servidor via `GET /api/weather?lat=...&lon=...`, cache de 30 minutos, timeout, coordenadas validadas e erros explícitos. A página de previsão permite solicitar dados reais.
- Catálogo IBGE no servidor via `GET /api/municipalities?uf=MT`, cache de 24 horas. A seleção visual ainda usa quatro localidades fixas; não confundir com catálogo nacional integrado.

Os cards ENSO, preços e previsão inicial são fictícios e identificados como demonstração. Nenhum boletim atual da NOAA foi importado. Os links das instituições são fontes de referência, não integrações de ingestão ativas. O armazenamento do navegador não é um banco compartilhado nem autenticação; não cadastre dados sensíveis.

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

Interface sem credenciais. Open-Meteo: `api.open-meteo.com`; IBGE: `servicodados.ibge.gov.br`; mapa: `*.tile.openstreetmap.org`; fontes: `fonts.googleapis.com`, `fonts.gstatic.com`; geração Prisma: `binaries.prisma.sh`. Preserve TLS e checksums. Os endpoints meteorológico e IBGE dependem de liberação de rede neste ambiente.

WhatsApp real ainda não implementado. A etapa futura exigirá aplicativo Meta, número habilitado, templates aprovados, credenciais somente no servidor, webhook verificado, consentimento persistido e cancelamento. Não informe tokens no chat ou em commits.

## Antes de produção

Veja [plano de desenvolvimento](docs/IMPLEMENTATION.md). Autenticação, autorização por organização, banco integrado, auditoria, notificações, backups e revisão profissional são pendentes. Verificar licença comercial Open-Meteo, direitos das cotações e política de tiles OpenStreetMap antes da publicação comercial. Não utilizar a demonstração para decisões meteorológicas, financeiras ou operações agrícolas.

## Testes de navegador

```sh
npx playwright install chromium
npm run test:e2e
```

Se já houver Chromium no sistema, use `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`. Os testes criam dados apenas no contexto isolado do navegador. Validam cadastro, persistência local, simulação, deduplicação e largura móvel.
