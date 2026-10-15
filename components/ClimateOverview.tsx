"use client";
import { useId } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  CartesianGrid,
  YAxis,
} from "recharts";
import { Activity, Droplets, ArrowUpRight } from "lucide-react";
type Day = { day: string; rain: number; max: number; min: number };
export default function ClimateOverview({
  days,
  real,
  city,
}: {
  days: Day[];
  real: boolean;
  city: string;
}) {
  const reducedMotion = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const total = days.reduce((sum, d) => sum + d.rain, 0);
  return (
    <section className="panel climate-overview">
      <div className="panel-heading">
        <h3>
          <Activity size={19} className="green" /> Panorama climático
        </h3>
        <span className={"tiny-badge " + (real ? "green" : "")}>
          {real ? "Open-Meteo" : "Demonstração"}
        </span>
      </div>
      <div className="climate-metric">
        <div>
          <span>Chuva prevista · 7 dias</span>
          <b>
            {total.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
            <small>mm</small>
          </b>
        </div>
        <div className="climate-metric-icon">
          <Droplets size={25} />
        </div>
      </div>
      <div
        className="climate-chart"
        role="img"
        aria-label={`Gráfico de chuva diária em ${city}, ${real ? "previsão Open-Meteo" : "dados demonstrativos"}`}
      >
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart
            data={days}
            margin={{ top: 15, right: 3, left: -28, bottom: 0 }}
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#30d7a9" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#30d7a9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ffffff08" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "#849eac", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.slice(0, 3)}
            />
            <YAxis
              tick={{ fill: "#688994", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#122a34",
                border: "1px solid #33515d",
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(value) => [`${value} mm`, "Precipitação"]}
            />
            <Area
              type="monotone"
              dataKey="rain"
              stroke="#38d8b0"
              strokeWidth={2.5}
              fill={`url(#${id})`}
              animationDuration={1200}
              isAnimationActive={!reducedMotion}
              activeDot={{ r: 4, stroke: "#b2ffe5", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="climate-caption">
        <span>
          <span className="online-dot" /> {city} · acumulado previsto
        </span>
        <ArrowUpRight size={14} />
      </div>
      <p className="source">
        {real
          ? "Previsão sujeita a mudanças. Não representa aviso oficial."
          : "Cenário ilustrativo. Sem classificação automática de risco."}
      </p>
    </section>
  );
}
