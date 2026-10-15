# Conexões do AgroNiño

## Fontes públicas já preparadas

As consultas partem do servidor. Nenhuma destas fontes exige que você envie uma senha para o aplicativo.

| Fonte | Uso e comportamento | Endereço |
| --- | --- | --- |
| Open-Meteo | Previsão de sete dias, chuva, temperatura e probabilidades. Consulta por coordenadas, cache de 30 minutos, timeout de 10 segundos, validação dos valores e unidades. | `api.open-meteo.com` |
| IBGE | Catálogo oficial de municípios por UF, cache de 24 horas. O mapa continua usando os quatro municípios de referência e sua cartografia local. O catálogo não fornece geocodificação nem amplia automaticamente a seleção. | `servicodados.ibge.gov.br` |
| NOAA / CPC | Verificação de acesso ao documento oficial ENSO Diagnostic Discussion, com link de leitura e cache de uma hora. Não interpreta automaticamente fase, probabilidades ou data de emissão. | `www.cpc.ncep.noaa.gov` |
| Cartografia | Limites municipais locais disponíveis sem rede. A camada opcional de ruas usa tiles OpenStreetMap, conforme disponibilidade e política do provedor. | `*.tile.openstreetmap.org` |

O painel **Integrações**, acessível pela navegação lateral, consulta os endpoints e mostra sucesso ou indisponibilidade por fonte. Abrir um link de referência não equivale a uma ingestão automática de seu conteúdo.

### Validação em 15/10/2026

- Open-Meteo: resposta HTTPS 200 com dados válidos de Sorriso/MT, incluindo a previsão iniciada em `2026-10-15`. O ambiente usa proxy; o Node 24 precisa de `NODE_USE_ENV_PROXY=1` para respeitar `HTTPS_PROXY` e `NO_PROXY`.
- IBGE: o provedor de saída do ambiente retornou HTTP 503 por falha na verificação do certificado upstream. O aplicativo informa indisponibilidade. A validação TLS foi mantida; não usamos exceções de certificado.
- NOAA: conexão bloqueada pelo proxy do ambiente, HTTP 403 no túnel CONNECT. O aplicativo informa que não conseguiu verificar o boletim e mantém o link oficial. Não há classificação ENSO atual inventada.
- Não foram verificados envios WhatsApp, banco compartilhado ou login, pois esses fluxos ainda não foram implementados.

O status pode mudar conforme rede e hospedagem. Libere os domínios necessários nas configurações da hospedagem; não desative TLS. Em hospedagem sem proxy, o Node acessa diretamente as fontes. Nenhum token do GitHub ou da Meta deve ser usado para essas fontes públicas.

O domínio da NOAA foi acrescentado ao rascunho de configuração deste ambiente em nuvem. Para aplicar, revise e salve as configurações do ambiente e publique-o. Salvar o rascunho não altera a rede da instância atual nem comprova a conexão; use **Verificar conexões** na nova instância para confirmar.

## O que depende de você e da próxima implementação

### WhatsApp oficial

1. Acesse [Meta for Developers](https://developers.facebook.com/), crie ou selecione o aplicativo da sua empresa e adicione o produto WhatsApp. Vincule uma conta empresarial e um número habilitado.
2. Prepare os modelos de mensagem para os alertas e solicite aprovação à Meta. Defina os destinatários autorizados, consentimento e forma de cancelamento.
3. Nas configurações **privadas** da hospedagem, disponibilize as credenciais da sua empresa: token de sistema com permissões adequadas, ID do número e segredo do aplicativo. Não use prefixo `NEXT_PUBLIC_`, não cole tokens no chat e não versione `.env`.
4. **Ainda requer implementação:** envio pela Cloud API, validação de assinatura do webhook, verificação inicial do webhook, registro persistente de consentimento, deduplicação/outbox, retorno de entrega e cancelamento. Os nomes exatos das variáveis serão definidos junto ao adaptador. A prévia atual não envia mensagens.

Referência: [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/).

### Banco compartilhado

1. Crie um PostgreSQL na sua conta (por exemplo, [Supabase](https://supabase.com/) ou [Neon](https://neon.tech/)). Escolha região e política de backups adequadas à operação.
2. Cadastre a URL de conexão segura como `DATABASE_URL` no servidor. Não exponha a senha no navegador.
3. **Ainda requer implementação:** migrações versionadas, APIs autenticadas de propriedades/regras/alertas, autorização por organização, auditoria e migração controlada dos dados locais. O schema Prisma inicial não significa que as telas já gravam no banco.
4. Para um banco novo de desenvolvimento, o README descreve o Compose local. Não execute `db:push` em produção.

### Login e identidade profissional

1. Defina os administradores, agrônomos e produtores da organização e o provedor desejado (por exemplo, Supabase Auth ou Clerk).
2. Depois da escolha e da integração, cadastre o domínio/callback autorizado e as chaves privadas nas configurações da hospedagem.
3. **Ainda requer implementação:** sessão autenticada, permissões por equipe, vínculo das regras ao usuário real, histórico de alterações e verificação profissional conforme política do produto. O nome e eventual registro profissional preenchidos nas regras são declarados pelo usuário; não são prova de identidade ou habilitação.

## Serviços sem integração nesta versão

INMET, Embrapa e outras instituições citadas como referência não são coletores automáticos ativos. Um adaptador futuro precisa respeitar o contrato da fonte, registrar emissão/validade, tratar indisponibilidade e distinguir aviso oficial de regra própria. Redis e o worker inicial ainda não executam esse fluxo nem entregam notificações.

Não há módulo de economia, preços ou cotações no escopo atual.
