"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CloudRain,
  Database,
  ExternalLink,
  LoaderCircle,
  MapPin,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Waves,
  WifiOff,
} from "lucide-react";

type City = { name: string; uf: string; lat: number; lon: number };
type Connection = {
  state: "loading" | "connected" | "unavailable";
  detail: string;
  checkedAt?: string;
};
type SourceId = "weather" | "ibge" | "noaa";
const initialConnections: Record<SourceId, Connection> = {
  weather: { state: "loading", detail: "Consultando a previsão da região…" },
  ibge: { state: "loading", detail: "Consultando o catálogo oficial…" },
  noaa: { state: "loading", detail: "Verificando o boletim oficial…" },
};
const sources = [
  {
    id: "weather" as const,
    name: "Open-Meteo",
    description: "Chuva e temperatura",
    icon: CloudRain,
    url: "https://open-meteo.com/",
  },
  {
    id: "ibge" as const,
    name: "IBGE",
    description: "Catálogo de municípios",
    icon: MapPin,
    url: "https://servicodados.ibge.gov.br/api/docs/localidades",
  },
  {
    id: "noaa" as const,
    name: "NOAA / CPC",
    description: "Boletim El Niño / La Niña",
    icon: Waves,
    url: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml",
  },
];

export default function IntegrationsPanel({ city }: { city: City }) {
  const [connections, setConnections] = useState(initialConnections);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setConnections(initialConnections);
    const urls = {
      weather: `/api/weather?lat=${city.lat}&lon=${city.lon}`,
      ibge: `/api/municipalities?uf=${encodeURIComponent(city.uf)}`,
      noaa: "/api/enso",
    };
    const requests = sources.map(async ({ id }) => {
      try {
        const response = await fetch(urls[id], { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error("unavailable");
        if (disposed || controller.signal.aborted) return;
        const detail =
          id === "weather"
            ? `Previsão consultada para ${city.name}/${city.uf}. Atualização automática no painel.`
            : id === "ibge"
              ? `${result.length} municípios de ${city.uf} no catálogo oficial. O mapa usa as localidades de referência.`
              : "Boletim oficial acessível. Consulte a publicação para fase e probabilidades.";
        setConnections((current) => ({
          ...current,
          [id]: {
            state: "connected",
            detail,
            checkedAt: new Date().toISOString(),
          },
        }));
      } catch {
        if (disposed) return;
        const detail =
          id === "weather"
            ? "Previsão indisponível nesta consulta. O painel informa quando está em demonstração."
            : id === "ibge"
              ? "Catálogo indisponível nesta consulta. Os limites municipais locais continuam no mapa."
              : "Não foi possível verificar o boletim. A publicação oficial continua no link abaixo.";
        setConnections((current) => ({
          ...current,
          [id]: {
            state: "unavailable",
            detail,
            checkedAt: new Date().toISOString(),
          },
        }));
      }
    });
    void Promise.allSettled(requests).then(() => {
      clearTimeout(timeout);
    });
    return () => {
      disposed = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [city.lat, city.lon, city.uf, city.name, attempt]);

  const loading = Object.values(connections).some(
    (connection) => connection.state === "loading",
  );
  return (
    <section
      className="panel detail-panel integrations-panel"
      aria-labelledby="integrations-title"
    >
      <div className="section-head">
        <div>
          <span className="eyebrow">FONTES E CONEXÕES</span>
          <h2 id="integrations-title">Dados com origem clara</h2>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => setAttempt((value) => value + 1)}
          disabled={loading}
        >
          <RefreshCw size={16} aria-hidden="true" />{" "}
          {loading ? "Verificando…" : "Verificar conexões"}
        </button>
      </div>
      <p className="muted">
        As fontes públicas são consultadas automaticamente. Cada estado abaixo
        reflete a última consulta feita pelo aplicativo.
      </p>
      <div className="integration-grid" aria-live="polite">
        {sources.map(({ id, name, description, icon: Icon, url }) => {
          const connection = connections[id];
          const StatusIcon =
            connection.state === "loading"
              ? LoaderCircle
              : connection.state === "connected"
                ? CheckCircle2
                : WifiOff;
          return (
            <article
              className={`integration-card is-${connection.state}`}
              key={id}
            >
              <div className="integration-title">
                <Icon size={22} aria-hidden="true" />
                <div>
                  <h3>{name}</h3>
                  <small>{description}</small>
                </div>
              </div>
              <span className={`connection-status ${connection.state}`}>
                <StatusIcon size={14} aria-hidden="true" />
                {connection.state === "loading"
                  ? "Consultando"
                  : connection.state === "connected"
                    ? id === "noaa"
                      ? "Boletim acessível"
                      : "Consulta realizada"
                    : "Indisponível agora"}
              </span>
              <p>{connection.detail}</p>
              {connection.checkedAt && (
                <small>
                  Verificado às{" "}
                  {new Date(connection.checkedAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              )}
              <a href={url} target="_blank" rel="noreferrer">
                Abrir fonte oficial{" "}
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </article>
          );
        })}
      </div>
      <div className="connection-next-steps">
        <h3>Para ativar a operação da sua equipe</h3>
        <p className="muted">
          Estas etapas precisam de contas da sua organização e de uma próxima
          integração técnica. Adicionar credenciais, sozinho, ainda não ativa
          esses serviços.
        </p>
        <details>
          <summary>
            <MessageCircle size={18} aria-hidden="true" /> WhatsApp oficial{" "}
            <span>Próxima integração</span>
          </summary>
          <ol>
            <li>
              Crie um aplicativo empresarial no{" "}
              <a
                href="https://developers.facebook.com/"
                target="_blank"
                rel="noreferrer"
              >
                Meta for Developers
              </a>{" "}
              e adicione o produto WhatsApp.
            </li>
            <li>
              Vincule o número da empresa e solicite os modelos de mensagem.
              Registre o consentimento dos destinatários.
            </li>
            <li>
              Guarde o token de sistema, o ID do número e o segredo do
              aplicativo nas variáveis privadas da hospedagem.
            </li>
            <li>
              A próxima implementação conecta o envio, os webhooks e a
              confirmação de entrega. Hoje há somente prévia de mensagem.
            </li>
          </ol>
        </details>
        <details>
          <summary>
            <Database size={18} aria-hidden="true" /> Banco compartilhado{" "}
            <span>Próxima integração</span>
          </summary>
          <p>
            Crie um PostgreSQL, por exemplo no Supabase ou Neon, e salve a
            conexão como <code>DATABASE_URL</code> no servidor. Ainda precisamos
            integrar as telas ao banco, criar migrações e permissões. Os
            cadastros desta versão ficam neste navegador.
          </p>
        </details>
        <details>
          <summary>
            <ShieldCheck size={18} aria-hidden="true" /> Login e identidade dos
            agrônomos <span>Próxima integração</span>
          </summary>
          <p>
            Defina quem administra a equipe e um provedor de login, como
            Supabase Auth ou Clerk. A próxima integração vincula cada agrônomo à
            sua conta e registra a auditoria no servidor. O nome informado nas
            regras hoje é uma identificação declarada.
          </p>
        </details>
      </div>
    </section>
  );
}
