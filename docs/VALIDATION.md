# Validação da entrega inicial

Executado no ambiente de desenvolvimento:

- `npm test`: 5 testes aprovados (acumulado inclusivo, regra inativa, janela, chave de deduplicação e validação).
- `npm run build`: compilação e verificação de tipos aprovadas.
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e`: 2 testes aprovados, fluxo de propriedade/alertas e layout móvel.
- Verificação adicional no Chromium: edição de limite de regra, ausência de erros JavaScript e persistência após recarregar.
- `GET /`: HTTP 200.
- `GET /api/weather` sem coordenadas: HTTP 400 com erro específico.
- `GET /api/municipalities?uf=INVALID`: HTTP 400.
- Consulta meteorológica válida: HTTP 502 com mensagem tratada, após bloqueio externo 403 do proxy. Dados reais não foram validados.
- IBGE externo: bloqueio 403 do proxy. Catálogo real não validado.
- `npm run db:generate`: bloqueado no download de checksum por 403 em binaries.prisma.sh. Verificação de integridade mantida; não foram utilizadas opções para ignorá-la.

PostgreSQL/Redis, migrations, geração Prisma, worker conectado e envios Meta não foram validados nesta entrega. Domínios necessários foram salvos no rascunho de configuração; salvar não aplica a política em execução nem comprova conectividade.
