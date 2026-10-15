# Plano e estado de implementação

## Estrutura

- `app/`: App Router, layout, página de demonstração e endpoints de fontes.
- `components/`: mapa isolado, carregado somente no cliente.
- `lib/`: validação e avaliação de regras.
- `tests/`: limites, janela, estado ativo e chave de deduplicação.
- `prisma/`: modelo inicial de organização, usuário, propriedade, regra e evento.
- `worker/`: infraestrutura inicial BullMQ, heartbeat sandbox.

## Fases

1. **Estrutura e interface — implementada parcialmente:** dashboard responsivo, gráficos, mapa, navegação e formulários funcionais no navegador. Autenticação e ligação do banco ainda pendentes. Componentes próprios em CSS; Tailwind e shadcn não foram adotados nesta base.
2. **Meteorologia — parcial:** adaptadores HTTP Open-Meteo e IBGE implementados, validação e erros testados. Catálogo nacional na UI, horários detalhados, cache persistente e ingestão ENSO oficial pendentes. Conectividade real bloqueada no ambiente inicial.
3. **Agrônomos — demonstração:** regras de chuva, simulação e persistência local. Falta autorização profissional, fases de cultura na regra, demais riscos, auditoria e persistência no servidor.
4. **Avisos oficiais — pendente:** verificar documentação pública, licença, cobertura e cadência de cada fonte. Sem scraping ou avisos inventados. Adicionar cadastro de avisos manuais verificados quando API não existir.
5. **WhatsApp — somente prévia sandbox:** falta integração oficial Meta, destinatários, consentimentos persistidos, templates, outbox idempotente, status de entrega, assinatura de webhooks e cancelamento.
6. **Economia — visualização demonstrativa:** integrações e autorização de redistribuição pendentes. Não há previsão de câmbio.
7. **Publicações — diretório de fontes:** ingestão, revisão editorial e distribuição pendentes.
8. **Produção — pendente:** autenticação, RBAC, isolamento transacional por organização, rate limiting, migrations, backups, monitoramento, testes de integração e deploy.

## Próxima entrega técnica

Integrar autenticação e PostgreSQL antes de expor dados de produtores. Derivar organização exclusivamente da sessão autenticada; todas as operações devem filtrar organização no servidor, incluindo regras e eventos. Substituir localStorage por APIs autenticadas com validação e auditoria. Adicionar testes negativos de acesso entre organizações antes de ativar envios.

Para ENSO, persistir publicação oficial com URL, emissão, período, observações e probabilidades separadas; não extrair números de texto por heurística e assumir classificação atual. Revisão editorial é necessária até existir um contrato de fonte confiável. Não atribuir um evento ou cotação individual ao ENSO sem evidência.

Nenhuma etapa de produção é considerada concluída por haver apenas schema, layout ou heartbeat.
