"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Sprout,
  House,
  Waves,
  CloudSun,
  Bell,
  Newspaper,
  Tractor,
  Settings,
  ChevronDown,
  ArrowUpRight,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Plus,
  X,
  Check,
  Send,
  SlidersHorizontal,
  Menu,
  CloudRain,
  Wind,
  Droplets,
  ExternalLink,
  FlaskConical,
  Activity,
  Users,
  Thermometer,
  History,
  Plug,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  CartesianGrid,
} from "recharts";
import { useReducedMotion } from "@/lib/useReducedMotion";
import ClimateOverview from "@/components/ClimateOverview";
import {
  evaluateCondition,
  eventKey,
  normalizeRule,
  riskTypes,
  ruleSchema,
  saveRuleRevision,
  type Rule,
} from "@/lib/rules";
import type { WeatherResponse } from "@/lib/integrations/publicSources";
import RuleEditor from "@/components/RuleEditor";
import ClimateHero from "@/components/ClimateHero";
import RainAudio from "@/components/RainAudio";
import IntegrationsPanel from "@/components/IntegrationsPanel";
const RegionMap = dynamic(() => import("@/components/RegionMap"), {
  ssr: false,
  loading: () => <div className="map-loading">Carregando mapa…</div>,
});
const cities = [
  { name: "Sorriso", uf: "MT", lat: -12.5425, lon: -55.7211 },
  { name: "Sinop", uf: "MT", lat: -11.8642, lon: -55.5036 },
  { name: "Lucas do Rio Verde", uf: "MT", lat: -13.0588, lon: -55.9042 },
  { name: "Silvânia", uf: "GO", lat: -16.6589, lon: -48.6081 },
];
const nav = [
  { label: "Visão geral", icon: House },
  { label: "El Niño / La Niña", icon: Waves },
  { label: "Previsão do tempo", icon: CloudSun },
  { label: "Alertas e riscos", icon: Bell },
  { label: "Atualizações", icon: Newspaper },
];
const initialRule: Rule = ruleSchema.parse({
  id: "rain-1",
  name: "Chuva excessiva",
  city: "Sorriso",
  crop: "Soja",
  threshold: 70,
  hours: 48,
  guidance:
    "Verificar a drenagem da lavoura e evitar operações com máquinas em solo encharcado.",
  active: true,
  kind: "rain",
});
const heatRule: Rule = ruleSchema.parse({
  ...initialRule,
  id: "heat-1",
  kind: "heat",
  name: "Calor intenso",
  threshold: 35,
  hours: 24,
  crop: "Todas as culturas",
  guidance:
    "Acompanhe a disponibilidade hídrica e consulte o agrônomo antes de alterar o manejo. Evite atividades de campo nos horários de maior calor.",
});
const initialRules = [initialRule, heatRule];
const forecast = [
  {
    day: "Hoje",
    date: "13 out",
    max: 32,
    min: 24,
    rain: 20,
    chance: 60,
    sun: true,
  },
  { day: "Quarta", date: "14 out", max: 28, min: 22, rain: 80, chance: 90 },
  { day: "Quinta", date: "15 out", max: 27, min: 21, rain: 70, chance: 90 },
  { day: "Sexta", date: "16 out", max: 29, min: 22, rain: 50, chance: 70 },
  {
    day: "Sábado",
    date: "17 out",
    max: 31,
    min: 23,
    rain: 10,
    chance: 30,
    sun: true,
  },
  {
    day: "Domingo",
    date: "18 out",
    max: 33,
    min: 24,
    rain: 5,
    chance: 20,
    sun: true,
  },
  { day: "Segunda", date: "19 out", max: 32, min: 23, rain: 12, chance: 40 },
];
type Farm = {
  id: string;
  name: string;
  city: string;
  crop: string;
  stage: string;
};
type Alert = {
  id: string;
  title: string;
  date: string;
  guidance: string;
  value: number;
  unit: string;
  hours: number;
  kind: "rain" | "heat";
  city: string;
  crop: string;
  agronomist: string;
  ruleName: string;
};
export default function Home() {
  const reducedMotion = useReducedMotion();
  const [page, setPage] = useState("Visão geral"),
    [cityIdx, setCityIdx] = useState(0),
    [mobile, setMobile] = useState(false),
    [modal, setModal] = useState<string | null>(null),
    [toast, setToast] = useState(""),
    [rules, setRules] = useState<Rule[]>(initialRules),
    [farms, setFarms] = useState<Farm[]>([]),
    [alerts, setAlerts] = useState<Alert[]>([]),
    [ready, setReady] = useState(false),
    [live, setLive] = useState<WeatherResponse | null>(null),
    [weatherState, setWeatherState] = useState("demo"),
    [simulation, setSimulation] = useState(85),
    [simulationRuleId, setSimulationRuleId] = useState("rain-1"),
    [previewAlert, setPreviewAlert] = useState<Alert | null>(null),
    [form, setForm] = useState(initialRule),
    [farmForm, setFarmForm] = useState({
      name: "",
      city: "Sorriso",
      crop: "Soja",
      stage: "Plantio",
    }),
    [consent, setConsent] = useState(false),
    [notification, setNotification] = useState(false);
  const city = cities[cityIdx];
  const requestRef = useRef<AbortController | null>(null);
  const activeRules = rules.filter((r) => r.active && r.city === city.name);
  const simulationRule =
    activeRules.find((r) => r.id === simulationRuleId) || activeRules[0];
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("agronino-demo") || "null");
      if (d) {
        if (Array.isArray(d.rules))
          setRules(
            d.rules
              .map(normalizeRule)
              .filter((r: Rule | null): r is Rule => r !== null),
          );
        setFarms(d.farms || []);
        if (Array.isArray(d.alerts))
          setAlerts(
            d.alerts
              .filter((a: any) => a && typeof a.title === "string")
              .map((a: any) => ({
                ...a,
                value: a.value ?? a.mm ?? 0,
                unit: a.unit || "mm",
                hours: a.hours || 48,
                kind: a.kind || "rain",
                city: a.city || "Sorriso",
                crop: a.crop || "Soja",
                agronomist: a.agronomist || "Equipe de demonstração",
                ruleName: a.ruleName || "Chuva excessiva",
              })),
          );
        if (
          Number.isInteger(d.cityIdx) &&
          d.cityIdx >= 0 &&
          d.cityIdx < cities.length
        )
          setCityIdx(d.cityIdx);
        setConsent(!!d.consent);
      }
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      localStorage.setItem(
        "agronino-demo",
        JSON.stringify({ rules, farms, alerts, consent, cityIdx }),
      );
  }, [rules, farms, alerts, consent, cityIdx, ready]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    if (modal === "simulate")
      setSimulation(simulationRule?.kind === "heat" ? 40 : 85);
  }, [modal, simulationRule?.id]);
  function go(p: string) {
    setPage(p);
    setMobile(false);
  }
  const loadWeather = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setWeatherState("loading");
    setLive(null);
    try {
      const r = await fetch(`/api/weather?lat=${city.lat}&lon=${city.lon}`, {
        signal: controller.signal,
      });
      const d = await r.json();
      if (!r.ok) throw Error();
      if (!controller.signal.aborted) {
        setLive(d);
        setWeatherState("live");
      }
    } catch {
      if (!controller.signal.aborted) {
        setWeatherState("error");
        setLive(null);
      }
    }
  }, [city.lat, city.lon]);
  useEffect(() => {
    if (ready) void loadWeather();
    return () => requestRef.current?.abort();
  }, [ready, loadWeather]);
  function simulate() {
    const rule = simulationRule;
    if (!rule) {
      setToast("Cadastre uma regra ativa para este município.");
      return;
    }
    const unit = riskTypes[rule.kind].unit;
    if (
      !Number.isFinite(simulation) ||
      simulation < 0 ||
      simulation > (rule.kind === "heat" ? 65 : 3000)
    ) {
      setToast("Informe um valor válido para a simulação.");
      return;
    }
    if (!evaluateCondition(rule, simulation)) {
      setToast(
        `Condição não atingida: ${simulation} ${unit} abaixo do limite de ${rule.threshold} ${unit}.`,
      );
      return;
    }
    const id = eventKey(
      rule.id,
      rule.city,
      new Date().toISOString().slice(0, 10),
    );
    if (alerts.some((a) => a.id === id)) {
      setToast(
        "Alerta já registrado para esta regra e período. Duplicata evitada.",
      );
      return;
    }
    const alert: Alert = {
      id,
      title: `${rule.name} em ${rule.city}`,
      date: new Date().toLocaleString("pt-BR"),
      guidance: rule.guidance,
      value: simulation,
      unit,
      hours: rule.hours,
      kind: rule.kind,
      city: rule.city,
      crop: rule.crop,
      agronomist: rule.agronomist,
      ruleName: rule.name,
    };
    setAlerts((a) => [alert, ...a]);
    setPreviewAlert(alert);
    setModal("whatsapp");
    setToast("Alerta de demonstração gerado. Nenhuma mensagem foi enviada.");
  }
  const days =
    weatherState === "live" && live
      ? live.data.daily.time.map((date: string, i: number) => ({
          day:
            i === 0
              ? "Hoje"
              : new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
                  weekday: "short",
                }),
          date: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          }),
          max: Math.round(live.data.daily.temperature_2m_max[i]),
          min: Math.round(live.data.daily.temperature_2m_min[i]),
          rain: live.data.daily.precipitation_sum[i],
          chance: live.data.daily.precipitation_probability_max[i],
          sun: live.data.daily.precipitation_sum[i] < 5,
        }))
      : forecast;
  function heading(
    icon: React.ReactNode,
    title: string,
    action: string,
    onClick: () => void,
  ) {
    return (
      <div className="panel-heading">
        <h3>
          {icon}
          {title}
        </h3>
        <button className="text-button" onClick={onClick}>
          {action}
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }
  function weather(full = false) {
    return (
      <section className="panel weather">
        {heading(
          <CloudSun size={21} className="yellow" />,
          `Previsão do tempo`,
          full ? "Atualizar previsão" : "Ver previsão",
          () => (full ? loadWeather() : go("Previsão do tempo")),
        )}
        <div className="subline">
          {city.name}, {city.uf}{" "}
          <span
            className={"tiny-badge " + (weatherState === "live" ? "green" : "")}
          >
            {weatherState === "live"
              ? "Dados reais · Open-Meteo"
              : "Demonstração"}
          </span>
        </div>
        {weatherState === "error" && (
          <div className="inline-error">
            Fonte indisponível. Os valores abaixo continuam sendo
            demonstrativos.{" "}
            <button onClick={loadWeather}>Tentar novamente</button>
          </div>
        )}
        <div className={"forecast " + (full ? "full" : "")}>
          {days.slice(0, full ? 7 : 5).map((d: any, i: number) => (
            <div className={"day " + (i === 0 ? "today" : "")} key={i}>
              <strong>{d.day}</strong>
              <small>{d.date}</small>
              {d.sun ? (
                <CloudSun className="weather-icon yellow" />
              ) : (
                <CloudRain className="weather-icon blue" />
              )}
              <b>
                {d.max}°<span>{d.min}°</span>
              </b>
              <div className="rain">
                <Droplets size={12} />
                {d.rain} <small>mm</small>
              </div>
              <small className="muted">{d.chance}%</small>
            </div>
          ))}
        </div>
        <div className="source">
          {weatherState === "live" && live
            ? `Open-Meteo · Consulta: ${new Date(live.retrievedAt).toLocaleString("pt-BR", { timeZone: live.data.timezone })} · ${live.data.timezone}`
            : "Cenário ilustrativo · não utilizar para decisões no campo"}
          {weatherState === "loading" && " · Consultando…"}
        </div>
        {full && (
          <div className="weather-extra">
            <span>
              <Droplets /> Umidade{" "}
              {live?.data.current?.relative_humidity_2m ?? "—"}%
            </span>
            <span>
              <Wind /> Vento {live?.data.current?.wind_speed_10m ?? "—"} km/h
            </span>
            <button
              className="primary"
              onClick={loadWeather}
              disabled={weatherState === "loading"}
            >
              {weatherState === "loading"
                ? "Consultando…"
                : "Consultar dados reais"}
            </button>
          </div>
        )}
      </section>
    );
  }
  function enso(kind: string) {
    const el = kind === "El Niño";
    return (
      <section className={"enso " + (el ? "el" : "la")}>
        <div className="enso-top">
          <div className="enso-title">
            <Waves size={36} />
            <h2>{kind}</h2>
          </div>
          <span className={"status " + (el ? "red" : "neutral")}>
            {el ? "Não verificado" : "Não verificado"}
          </span>
        </div>
        <p>
          {el
            ? "Aquecimento anormal das águas do Pacífico, com possíveis impactos no clima e na agricultura."
            : "Resfriamento das águas do Pacífico, com possíveis impactos no clima e na agricultura."}
        </p>
        <div className="prob-label">
          {el
            ? "Probabilidade de continuidade"
            : "Probabilidade de desenvolvimento"}
          <span>Sem boletim verificado</span>
        </div>
        <div className="prob">
          <b>
            —<span> %</span>
          </b>
          <div className="progress">
            <i style={{ width: "0%" }} />
          </div>
        </div>
        <p className="trend">
          <strong>Tendência:</strong>{" "}
          {el
            ? "Consulte o boletim oficial para a classificação atual."
            : "Probabilidade atual ainda não verificada."}
        </p>
        <button
          className="outline"
          onClick={() => {
            go("El Niño / La Niña");
          }}
        >
          Ver detalhes e impactos
          <ArrowRight size={15} />
        </button>
        <div className="source">
          Fonte de referência: NOAA/CPC · classificação atual não confirmada
        </div>
      </section>
    );
  }
  return (
    <div className="app">
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <a className="brand" onClick={() => go("Visão geral")}>
          <div className="brand-icon">
            <Sprout size={35} />
          </div>
          <div>
            AgroNiño <span>BETA</span>
            <small>Inteligência para o seu campo.</small>
          </div>
        </a>
        <div className="nav-caption">PRINCIPAL</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.label}
              className={page === n.label ? "selected" : ""}
              onClick={() => go(n.label)}
            >
              <n.icon size={20} />
              {n.label}
              {n.label === "Alertas e riscos" && alerts.length > 0 && (
                <em>{alerts.length}</em>
              )}
            </button>
          ))}
        </nav>
        <div className="nav-divider" />
        <div className="nav-caption">MEU ESPAÇO</div>
        <nav>
          {[
            { label: "Minhas propriedades", icon: Tractor },
            { label: "Painel do agrônomo", icon: Users },
            { label: "Integrações", icon: Plug },
            { label: "Configurações", icon: Settings },
          ].map((n) => (
            <button
              key={n.label}
              className={page === n.label ? "selected" : ""}
              onClick={() => go(n.label)}
            >
              <n.icon size={20} />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="official">
          <ShieldCheck size={24} />
          <div>
            Informação que vem
            <br />
            de quem entende.
          </div>
          <p>FONTES DE REFERÊNCIA</p>
          <div className="logos">
            <strong>INMET</strong>
            <strong>NOAA</strong>
            <strong>CONAB</strong>
            <span>IBGE</span>
          </div>
          <button className="text-button" onClick={() => go("Integrações")}>
            Ver conexões <ArrowRight size={12} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <span className="online-dot" /> Ambiente de demonstração
          <span>v0.1.0</span>
        </div>
      </aside>
      <div className="main-shell">
        <header>
          <button
            className="mobile-menu icon-button"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <div className="selectors">
            <label>
              Minha região
              <div className="select-wrap">
                <MapPin size={17} />
                <select
                  value={cityIdx}
                  onChange={(e) => {
                    setCityIdx(+e.target.value);
                    setWeatherState("demo");
                    setLive(null);
                  }}
                >
                  {cities.map((c, i) => (
                    <option value={i} key={c.name}>
                      {c.name} – {c.uf}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </div>
            </label>
          </div>
          <div className="header-user">
            <RainAudio />
            <button
              className="notification icon-button"
              onClick={() => setNotification(!notification)}
            >
              <Bell size={21} />
              <i />
            </button>
            <span className="header-divider" />
            <div className="avatar">JS</div>
            <div className="user-name">
              João Silva
              <small>
                Produtor rural <ChevronDown size={11} />
              </small>
            </div>
          </div>
          {notification && (
            <div className="notification-pop">
              <b>Central de notificações</b>
              <p>
                {alerts.length
                  ? `${alerts.length} alerta(s) de demonstração registrado(s).`
                  : "Você está em dia. Nenhum alerta registrado."}
              </p>
              <button
                className="text-button"
                onClick={() => {
                  go("Alertas e riscos");
                  setNotification(false);
                }}
              >
                Ver histórico <ArrowRight size={14} />
              </button>
            </div>
          )}
        </header>
        <main>
          <div className="page-title">
            <div>
              <div className="eyebrow">SEU CAMPO, MAIS PREPARADO</div>
              <h1>
                {page === "Visão geral" ? "Bom dia, João" : page}
                {page === "Visão geral" && <span className="greeting"> ☀</span>}
              </h1>
              <p>
                {page === "Visão geral"
                  ? "Acompanhe o clima, antecipe riscos e cuide da sua produção."
                  : "Informação organizada para decisões mais conscientes no campo."}
              </p>
            </div>
            <div className="date-chip">
              <span className="online-dot" /> Modo demonstração{" "}
              <FlaskConical size={14} />
            </div>
          </div>
          <div className="demo-banner">
            <FlaskConical size={15} />
            <span>
              Você está explorando o AgroNiño. Os indicadores são{" "}
              <strong>dados demonstrativos</strong>, exceto quando identificados
              como dados reais.
            </span>
            <button onClick={() => setModal("demo")}>
              Saiba mais <ArrowUpRight size={13} />
            </button>
          </div>
          {page === "Visão geral" && (
            <div className="dashboard-content">
              <ClimateHero
                city={city.name}
                onWeather={() => go("Previsão do tempo")}
                onAlerts={() => go("Alertas e riscos")}
              />
              <div className="enso-grid">
                {enso("El Niño")}
                {enso("La Niña")}
              </div>
              <div className="dashboard-grid">
                <div>
                  {weather()}
                  <div className="bottom-grid">
                    <ClimateOverview
                      days={days}
                      real={weatherState === "live"}
                      city={city.name}
                    />
                    <section className="panel updates">
                      {heading(
                        <Newspaper size={21} className="blue" />,
                        "Últimas atualizações",
                        "Ver todas",
                        () => go("Atualizações"),
                      )}
                      {[
                        [
                          "NOAA",
                          "Monitoramento do Pacífico equatorial",
                          "Acompanhe a discussão oficial sobre o ENSO.",
                          "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml",
                        ],
                        [
                          "INMET",
                          "Avisos meteorológicos para sua região",
                          "Consulte os avisos emitidos pelo instituto.",
                          "https://avisos.inmet.gov.br/",
                        ],
                        [
                          "CONAB",
                          "Acompanhamento da safra brasileira",
                          "Boletins e levantamentos oficiais.",
                          "https://www.conab.gov.br/",
                        ],
                      ].map(([org, title, desc, url]) => (
                        <a
                          className="update"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          key={org}
                        >
                          <span className={"institution " + org.toLowerCase()}>
                            {org}
                          </span>
                          <div>
                            <b>{title}</b>
                            <p>{desc}</p>
                            <small>
                              Fonte oficial <ExternalLink size={10} />
                            </small>
                          </div>
                          <ArrowUpRight size={14} />
                        </a>
                      ))}
                    </section>
                  </div>
                </div>
                <div className="right-column">
                  <section className="panel map-panel">
                    {heading(
                      <MapPin size={20} className="green" />,
                      "Mapa da região",
                      "Expandir",
                      () => setModal("map"),
                    )}
                    <div className="map-container">
                      <RegionMap
                        lat={city.lat}
                        lon={city.lon}
                        name={city.name}
                      />
                      <span className="map-tag">
                        <span className="online-dot" />
                        {city.name}, {city.uf}
                      </span>
                    </div>
                    <div className="map-legend">
                      <span className="legend-dot" /> Limites municipais · sem
                      camada de risco
                    </div>
                  </section>
                  <section className="panel alert-summary">
                    <div className="alert-symbol">
                      <ShieldCheck size={25} />
                    </div>
                    <h3>Prevenir é o melhor caminho.</h3>
                    <p>
                      Receba orientações para sua cultura e alertas relevantes
                      para a sua região.
                    </p>
                    <button
                      className="primary"
                      onClick={() => go("Alertas e riscos")}
                    >
                      Meus alertas <ArrowRight size={15} />
                    </button>
                    <div className="subline">
                      <ShieldCheck size={12} /> Você escolhe o que quer receber
                    </div>
                  </section>
                </div>
              </div>
              <section className="field-banner">
                <div className="field-art">
                  <Sprout size={52} />
                  <div className="field-lines" />
                </div>
                <div>
                  <span>CUIDADO QUE VAI ALÉM DA PREVISÃO</span>
                  <h3>Mais informação. Menos imprevistos.</h3>
                  <p>
                    Conecte suas propriedades e acompanhe o que importa para sua
                    lavoura.
                  </p>
                </div>
                <button
                  className="outline"
                  onClick={() => go("Minhas propriedades")}
                >
                  Cadastrar propriedade <Plus size={16} />
                </button>
              </section>
            </div>
          )}
          {page === "Previsão do tempo" && (
            <>
              {weather(true)}
              <section className="panel detail-panel">
                <h3>Temperaturas da semana</h3>
                <p className="muted">
                  {weatherState === "live"
                    ? "Previsão Open-Meteo"
                    : "Dados de demonstração"}
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={days}>
                    <CartesianGrid stroke="#233943" vertical={false} />
                    <XAxis dataKey="day" stroke="#7c939d" />
                    <Tooltip
                      contentStyle={{
                        background: "#122630",
                        border: "1px solid #345",
                      }}
                    />
                    <Area
                      isAnimationActive={!reducedMotion}
                      type="monotone"
                      dataKey="max"
                      name="Máxima °C"
                      stroke="#25d4a1"
                      fill="#25d4a120"
                    />
                    <Area
                      isAnimationActive={!reducedMotion}
                      type="monotone"
                      dataKey="min"
                      name="Mínima °C"
                      stroke="#4ca9ef"
                      fill="#4ca9ef10"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="source">
                  Consulte condições e licença comercial da Open-Meteo antes de
                  publicar o serviço.
                </p>
              </section>
            </>
          )}
          {page === "El Niño / La Niña" && (
            <>
              <div className="enso-grid">
                {enso("El Niño")}
                {enso("La Niña")}
              </div>
              <section className="panel detail-panel">
                <span className="tiny-badge">OBSERVAÇÃO ≠ PROJEÇÃO</span>
                <h2>Entenda o que acontece no Pacífico</h2>
                <p>
                  O ENSO alterna entre El Niño, La Niña e neutralidade. A
                  classificação depende de observações oceânicas e atmosféricas;
                  as probabilidades futuras não são uma garantia.
                </p>
                <div className="info-grid">
                  {[
                    [
                      "El Niño",
                      "Aquecimento persistente do Pacífico equatorial. Os efeitos variam por região, estação e cultura.",
                    ],
                    [
                      "La Niña",
                      "Resfriamento persistente do Pacífico equatorial. Não ocorre como fase ativa simultânea ao El Niño.",
                    ],
                    [
                      "Neutralidade",
                      "Condições que não atendem aos critérios de uma das fases. Não significa ausência de eventos extremos.",
                    ],
                  ].map(([t, d]) => (
                    <article key={t}>
                      <Waves className="blue" />
                      <h3>{t}</h3>
                      <p>{d}</p>
                    </article>
                  ))}
                </div>
                <div className="empty-state">
                  <Activity />
                  <h3>Boletim atual ainda não conectado</h3>
                  <p>
                    A classificação, intensidade e probabilidades atuais não
                    foram verificadas. Os cards acima não exibem probabilidades
                    sem confirmação da fonte.
                  </p>
                  <a
                    className="primary"
                    href="https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Consultar NOAA/CPC <ExternalLink size={14} />
                  </a>
                </div>
              </section>
            </>
          )}
          {page === "Alertas e riscos" && (
            <>
              <div className="stat-grid">
                <div className="panel stat">
                  <Bell className="green" />
                  <b>{alerts.length}</b>
                  <span>Alertas simulados</span>
                </div>
                <div className="panel stat">
                  <ShieldCheck className="blue" />
                  <b>{rules.filter((r) => r.active).length}</b>
                  <span>Regras ativas de demonstração</span>
                </div>
                <div className="panel stat">
                  <Send className="yellow" />
                  <b>0</b>
                  <span>Mensagens reais enviadas</span>
                </div>
              </div>
              <section className="panel detail-panel">
                <div className="panel-heading">
                  <h3>Histórico de alertas</h3>
                  <button
                    className="primary"
                    onClick={() => setModal("simulate")}
                  >
                    <FlaskConical size={15} /> Simular condição
                  </button>
                </div>
                {alerts.length ? (
                  alerts.map((a) => (
                    <div className="alert-row" key={a.id}>
                      <div className="risk-icon">
                        <CloudRain />
                      </div>
                      <div>
                        <span className="tiny-badge">
                          PERSONALIZADO · SIMULAÇÃO
                        </span>
                        <h3>{a.title}</h3>
                        <p>
                          {a.value} {a.unit} simulados · {a.date}
                        </p>
                        <p>{a.guidance}</p>
                        <small className="rule-author">
                          Responsável informado: {a.agronomist} · {a.crop}
                        </small>
                      </div>
                      <button
                        className="outline"
                        onClick={() => {
                          setPreviewAlert(a);
                          setModal("whatsapp");
                        }}
                      >
                        Prévia <ArrowRight size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <ShieldCheck />
                    <h3>Nenhum alerta registrado</h3>
                    <p>
                      Simule uma condição para testar as regras. Os avisos
                      oficiais ainda não estão conectados.
                    </p>
                    <button
                      className="outline"
                      onClick={() => setModal("simulate")}
                    >
                      Testar uma regra
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
          {page === "Minhas propriedades" && (
            <section className="panel detail-panel">
              <div className="panel-heading">
                <h3>Seu campo, em um só lugar</h3>
                <button className="primary" onClick={() => setModal("farm")}>
                  <Plus size={16} /> Nova propriedade
                </button>
              </div>
              {farms.length ? (
                <div className="info-grid">
                  {farms.map((f) => (
                    <article key={f.id}>
                      <Tractor className="green" />
                      <h3>{f.name}</h3>
                      <p>
                        <MapPin size={14} /> {f.city}
                      </p>
                      <p>
                        {f.crop} · {f.stage}
                      </p>
                      <button
                        className="text-button"
                        onClick={() => {
                          setFarms((x) => x.filter((v) => v.id !== f.id));
                          setToast("Propriedade removida da demonstração");
                        }}
                      >
                        Remover
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Tractor />
                  <h3>O próximo capítulo começa na sua propriedade.</h3>
                  <p>
                    Cadastre sua primeira propriedade para personalizar esta
                    demonstração.
                  </p>
                  <button className="primary" onClick={() => setModal("farm")}>
                    Cadastrar propriedade <Plus size={15} />
                  </button>
                </div>
              )}
              <p className="source">
                Cadastros armazenados apenas neste navegador. Não informe dados
                pessoais sensíveis.
              </p>
            </section>
          )}
          {page === "Painel do agrônomo" && (
            <>
              <div className="admin-note">
                <ShieldCheck size={18} /> Painel demonstrativo · autenticação e
                aprovação profissional ainda não habilitadas.
              </div>
              <section className="panel detail-panel">
                <div className="panel-heading">
                  <h3>Regras de alerta preventivo</h3>
                  <button
                    className="primary"
                    onClick={() => {
                      setForm({
                        ...initialRule,
                        id: crypto.randomUUID(),
                        city: city.name,
                        crop:
                          farms.find((f) => f.city === city.name)?.crop ||
                          "Todas as culturas",
                        agronomist: "",
                        createdAt: "",
                        createdBy: "",
                        history: [],
                      });
                      setModal("rule");
                    }}
                  >
                    <Plus size={16} /> Nova regra
                  </button>
                </div>
                <p className="muted">
                  Regras de chuva e calor por região e cultura. Nome do
                  responsável e histórico são informados localmente, sem
                  autenticação profissional.
                </p>
                {rules.map((r) => (
                  <div className="rule-row" key={r.id}>
                    <div className={"risk-icon " + r.kind}>
                      {r.kind === "heat" ? <Thermometer /> : <CloudRain />}
                    </div>
                    <div>
                      <h3>{r.name}</h3>
                      <p>
                        {r.city} · {r.crop} · ≥ {r.threshold}{" "}
                        {riskTypes[r.kind].unit} em {r.hours}h
                      </p>
                      <small>{r.guidance}</small>
                      <div className="rule-author">
                        <Users size={12} /> {r.agronomist}
                        {r.registration && ` · ${r.registration}`}
                      </div>
                      <span className="source">
                        {r.updatedAt
                          ? `Atualizada em ${new Date(r.updatedAt).toLocaleString("pt-BR")}`
                          : "Regra de exemplo · validar limite com profissional"}
                      </span>
                    </div>
                    <button
                      className={"toggle " + (r.active ? "on" : "")}
                      aria-label={r.active ? "Desativar regra" : "Ativar regra"}
                      onClick={() =>
                        setRules((rs) =>
                          rs.map((x) =>
                            x.id === r.id
                              ? {
                                  ...x,
                                  active: !x.active,
                                  updatedAt: new Date().toISOString(),
                                  history: [
                                    ...x.history,
                                    {
                                      at: new Date().toISOString(),
                                      by: "Operador local (sem autenticação)",
                                      action: x.active
                                        ? "Desativou a regra."
                                        : "Ativou a regra.",
                                    },
                                  ],
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      <span />
                    </button>
                    <button
                      className="outline"
                      onClick={() => {
                        setForm(r);
                        setModal("rule");
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Histórico de ${r.name}`}
                      onClick={() => {
                        setForm(r);
                        setModal("history");
                      }}
                    >
                      <History size={17} />
                    </button>
                  </div>
                ))}
              </section>
              <section className="panel detail-panel">
                <h3>Como o alerta é preparado</h3>
                <div className="flow">
                  <div>
                    <CloudSun />
                    Fontes climáticas<small>Dados com origem</small>
                  </div>
                  <ArrowRight />
                  <div>
                    <Activity />
                    Leitura do clima<small>Previsão disponível</small>
                  </div>
                  <ArrowRight />
                  <div>
                    <SlidersHorizontal />
                    Regras do agrônomo<small>Limites e orientações</small>
                  </div>
                  <ArrowRight />
                  <div>
                    <Send />
                    Notificações<small>Sandbox padrão</small>
                  </div>
                </div>
                <p className="source">
                  Teste chuva ou calor para conferir a condição e a orientação
                  antes de habilitar notificações reais.
                </p>
                <button
                  className="outline"
                  onClick={() => setModal("simulate")}
                >
                  Testar fluxo demonstrativo <FlaskConical size={15} />
                </button>
              </section>
            </>
          )}
          {page === "Atualizações" && (
            <section className="panel detail-panel">
              <h3>Central de fontes oficiais</h3>
              <p className="muted">
                Links de referência. Nenhum boletim atual foi importado ou
                atribuído automaticamente às instituições.
              </p>
              <div className="info-grid">
                {[
                  [
                    "NOAA / CPC",
                    "Discussões oficiais e monitoramento ENSO",
                    "https://www.cpc.ncep.noaa.gov/",
                  ],
                  [
                    "INMET",
                    "Avisos meteorológicos brasileiros",
                    "https://avisos.inmet.gov.br/",
                  ],
                  [
                    "CEMADEN",
                    "Monitoramento de riscos e desastres",
                    "https://www.gov.br/cemaden/",
                  ],
                  [
                    "Defesa Civil",
                    "Proteção e defesa civil",
                    "https://www.gov.br/mdr/",
                  ],
                  [
                    "CONAB",
                    "Acompanhamento de safras",
                    "https://www.conab.gov.br/",
                  ],
                  [
                    "IBGE",
                    "Municípios e informações territoriais",
                    "https://www.ibge.gov.br/",
                  ],
                ].map(([t, d, url]) => (
                  <a href={url} target="_blank" rel="noreferrer" key={t}>
                    <Newspaper className="blue" />
                    <h3>{t}</h3>
                    <p>{d}</p>
                    <span className="text-button">
                      Acessar instituição <ExternalLink size={14} />
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}
          {page === "Integrações" && <IntegrationsPanel city={city} />}
          {page === "Configurações" && (
            <section className="panel detail-panel settings">
              <h3>Preferências de demonstração</h3>
              <div className="setting-row">
                <div>
                  <h4>Prévia de notificações WhatsApp</h4>
                  <p>Permitir testar mensagens no sandbox, sem envio real.</p>
                </div>
                <button
                  aria-label="Alterar consentimento sandbox"
                  className={"toggle " + (consent ? "on" : "")}
                  onClick={() => setConsent(!consent)}
                >
                  <span />
                </button>
              </div>
              <div className="setting-row">
                <div>
                  <h4>Armazenamento local</h4>
                  <p>
                    Propriedades, regras e eventos ficam apenas neste navegador.
                  </p>
                </div>
                <button className="outline" onClick={() => setModal("reset")}>
                  Limpar demonstração
                </button>
              </div>
              <div className="empty-state">
                <ShieldCheck />
                <h3>Integrações de produção não configuradas</h3>
                <p>
                  Autenticação, banco compartilhado e WhatsApp real dependem da
                  próxima etapa de implementação e configuração segura do
                  servidor.
                </p>
              </div>
            </section>
          )}
          <footer>
            <span>
              <Sprout size={13} /> AgroNiño{" "}
              <span className="muted">· Inteligência para o seu campo</span>
            </span>
            <span>Feito para quem cultiva o amanhã.</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast">
          <Check size={18} />
          {toast}
          <button onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className={"modal " + (modal === "map" ? "wide" : "")}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close icon-button"
              onClick={() => setModal(null)}
              aria-label="Fechar"
            >
              <X />
            </button>
            {modal === "demo" && (
              <>
                <FlaskConical className="green" size={30} />
                <h2>Explore com tranquilidade</h2>
                <p>
                  ENSO, previsão inicial e simulações usam dados fictícios. A
                  previsão consultada pelo botão “Consultar dados reais” vem da
                  Open-Meteo. O mapa usa OpenStreetMap, sem camada artificial de
                  risco.
                </p>
                <p>
                  Cadastros ficam no navegador e nenhuma mensagem real é
                  enviada.
                </p>
                <button className="primary" onClick={() => setModal(null)}>
                  Entendi <Check size={15} />
                </button>
              </>
            )}
            {modal === "farm" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setFarms((f) => [
                    ...f,
                    { ...farmForm, id: crypto.randomUUID() },
                  ]);
                  setModal(null);
                  setFarmForm({ ...farmForm, name: "" });
                  setToast("Propriedade cadastrada nesta demonstração");
                }}
              >
                <div className="eyebrow">MEU ESPAÇO</div>
                <h2>Nova propriedade</h2>
                <p>Personalize seu acompanhamento no campo.</p>
                <label>
                  Nome da propriedade
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="Ex.: Fazenda Boa Esperança"
                    value={farmForm.name}
                    onChange={(e) =>
                      setFarmForm({ ...farmForm, name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Município
                  <select
                    value={farmForm.city}
                    onChange={(e) =>
                      setFarmForm({ ...farmForm, city: e.target.value })
                    }
                  >
                    {cities.map((c) => (
                      <option key={c.name}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <div className="form-grid">
                  <label>
                    Cultura
                    <select
                      value={farmForm.crop}
                      onChange={(e) =>
                        setFarmForm({ ...farmForm, crop: e.target.value })
                      }
                    >
                      {[
                        "Soja",
                        "Milho",
                        "Café",
                        "Feijão",
                        "Arroz",
                        "Pastagem",
                        "Outras",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Fase da lavoura
                    <select
                      value={farmForm.stage}
                      onChange={(e) =>
                        setFarmForm({ ...farmForm, stage: e.target.value })
                      }
                    >
                      {[
                        "Plantio",
                        "Crescimento",
                        "Floração",
                        "Enchimento de grãos",
                        "Colheita",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="source">
                  Localidades de demonstração. Catálogo IBGE disponível no
                  endpoint /api/municipalities.
                </p>
                <button className="primary" type="submit">
                  Salvar propriedade <Check size={16} />
                </button>
              </form>
            )}
            {modal === "rule" && (
              <RuleEditor
                value={form}
                cities={cities.map((c) => c.name)}
                onSave={(value) => {
                  const revision = saveRuleRevision(
                    value,
                    rules.find((r) => r.id === value.id),
                  );
                  setRules((rs) =>
                    rs.some((r) => r.id === revision.id)
                      ? rs.map((r) => (r.id === revision.id ? revision : r))
                      : [...rs, revision],
                  );
                  setModal(null);
                  setToast("Regra salva com responsável e histórico.");
                }}
              />
            )}
            {modal === "history" && (
              <>
                <div className="eyebrow">RASTREABILIDADE LOCAL</div>
                <h2>Histórico de {form.name}</h2>
                <p>
                  Responsável informado: {form.agronomist}. Identidade não
                  verificada.
                </p>
                {form.history.length ? (
                  <ol className="audit-timeline">
                    {form.history.map((h, i) => (
                      <li key={i}>
                        <strong>{h.by}</strong>
                        <small>{new Date(h.at).toLocaleString("pt-BR")}</small>
                        <p>{h.action}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>Regra de exemplo. Nenhuma alteração registrada.</p>
                )}
              </>
            )}
            {modal === "simulate" && (
              <>
                <FlaskConical className="green" />
                <h2>Simular condição climática</h2>
                <p>
                  Escolha uma regra de {city.name}. Os dados são fictícios e
                  nenhum alerta real será enviado.
                </p>
                {activeRules.length ? (
                  <>
                    <label>
                      Regra a testar
                      <select
                        value={simulationRule?.id || ""}
                        onChange={(e) => {
                          setSimulationRuleId(e.target.value);
                          const r = rules.find((x) => x.id === e.target.value);
                          setSimulation(r?.kind === "heat" ? 40 : 85);
                        }}
                      >
                        {activeRules.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} · {r.crop} · {r.agronomist}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {simulationRule?.kind === "heat"
                        ? "Temperatura máxima simulada (°C)"
                        : "Acumulado simulado (mm)"}
                      <input
                        type="number"
                        min="0"
                        max={simulationRule?.kind === "heat" ? 65 : 3000}
                        step="0.1"
                        value={simulation}
                        onChange={(e) =>
                          setSimulation(Math.max(0, +e.target.value))
                        }
                      />
                    </label>
                    <p className="source">
                      Limite: {simulationRule?.threshold}{" "}
                      {simulationRule && riskTypes[simulationRule.kind].unit} em{" "}
                      {simulationRule?.hours}h. Cultura atendida:{" "}
                      {simulationRule?.crop}. A repetição da mesma regra no
                      mesmo dia não cria duplicatas.
                    </p>
                    <button className="primary" onClick={simulate}>
                      Executar simulação <ArrowRight size={15} />
                    </button>
                  </>
                ) : (
                  <div className="empty-state">
                    <p>Não há regras ativas para este município.</p>
                    <button
                      className="primary"
                      onClick={() => {
                        setModal(null);
                        go("Painel do agrônomo");
                      }}
                    >
                      Configurar regra
                    </button>
                  </div>
                )}
              </>
            )}
            {modal === "whatsapp" && (
              <>
                <span className="tiny-badge">SANDBOX · NENHUM ENVIO REAL</span>
                <h2>Prévia no WhatsApp</h2>
                <div className="whatsapp">
                  <div className="wa-head">
                    <span className="brand-icon">
                      <Sprout />
                    </span>
                    <div>
                      <b>
                        AgroNiño <ShieldCheck size={13} />
                      </b>
                      <small>Alertas e atualizações</small>
                    </div>
                  </div>
                  <div className="wa-bubble">
                    <b>🌱 AgroNiño — Alerta preventivo</b>
                    <p>📍 {previewAlert?.city || city.name}</p>
                    <p>
                      Período de análise: {previewAlert?.hours || 48} horas.
                    </p>
                    <p>
                      {previewAlert?.kind === "heat" ? "🌡️" : "🌧️"}{" "}
                      {previewAlert?.ruleName} · {previewAlert?.crop}
                    </p>
                    <p>
                      Condição simulada: {previewAlert?.value ?? simulation}{" "}
                      {previewAlert?.unit || "mm"}, conforme regra cadastrada.
                    </p>
                    <p>
                      <b>Orientação:</b>{" "}
                      {previewAlert?.guidance ?? initialRule.guidance}
                    </p>
                    <p>
                      Responsável informado:{" "}
                      {previewAlert?.agronomist || "Equipe de demonstração"}
                    </p>
                    <small>DADOS FICTÍCIOS · Demonstração</small>
                    <time>agora ✓✓</time>
                  </div>
                </div>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />{" "}
                  Autorizar teste no sandbox local
                </label>
                <button
                  className="primary"
                  disabled={!consent}
                  onClick={() => {
                    setToast(
                      "Prévia validada no sandbox. Nenhuma chamada à Meta foi realizada.",
                    );
                    setModal(null);
                  }}
                >
                  <Check size={15} /> Validar prévia
                </button>
              </>
            )}
            {modal === "map" && (
              <>
                <h2>
                  {city.name}, {city.uf}
                </h2>
                <p>
                  Cartografia municipal de referência · sem camada meteorológica
                  de risco.
                </p>
                <div style={{ height: 450 }}>
                  <RegionMap lat={city.lat} lon={city.lon} name={city.name} />
                </div>
              </>
            )}
            {modal === "reset" && (
              <>
                <h2>Limpar dados de demonstração?</h2>
                <p>
                  Remove propriedades e eventos salvos neste navegador e
                  restaura a regra inicial.
                </p>
                <button
                  className="primary"
                  onClick={() => {
                    setRules(initialRules);
                    setFarms([]);
                    setAlerts([]);
                    setConsent(false);
                    setModal(null);
                    setToast("Demonstração restaurada");
                  }}
                >
                  Limpar e restaurar
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
