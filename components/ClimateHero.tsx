"use client";

import { useId, useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  CloudRain,
  MapPin,
  Pause,
  Play,
  Sun,
  Waves,
} from "lucide-react";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Props = { city: string; onWeather: () => void; onAlerts: () => void };

/** An editorial illustration. It deliberately does not derive a risk level from the weather. */
export default function ClimateHero({ city, onWeather, onAlerts }: Props) {
  const [scene, setScene] = useState<"rain" | "heat">("rain");
  const [playing, setPlaying] = useState(true);
  const reducedMotion = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const animated = playing && !reducedMotion;
  return (
    <section
      className={`climate-hero scene-${scene}`}
      data-motion={animated ? "playing" : "paused"}
      aria-labelledby={`${id}-heading`}
    >
      <div className="hero-grid-light" aria-hidden="true" />
      <div className="hero-copy">
        <div className="hero-eyebrow">
          <span /> INTELIGÊNCIA CLIMÁTICA NO CAMPO
        </div>
        <h2 id={`${id}-heading`}>
          O clima muda.
          <br />
          <span>Você se antecipa.</span>
        </h2>
        <p>
          Da previsão à decisão. Acompanhe sua região e transforme chuva e calor
          em planos de ação.
        </p>
        <div className="hero-actions">
          <button className="primary" onClick={onWeather}>
            Ver minha previsão <ArrowUpRight size={16} />
          </button>
          <button className="hero-secondary" onClick={onAlerts}>
            Gerenciar alertas <ArrowUpRight size={13} aria-hidden="true" />
          </button>
        </div>
        <div className="hero-location">
          <MapPin size={13} />
          <span>{city}</span>
          <i />
          <span>Decisões com contexto local</span>
        </div>
      </div>

      <div className="hero-visual">
        <div
          className="scene-switch"
          role="group"
          aria-label="Cenário da ilustração"
        >
          <button
            onClick={() => setScene("rain")}
            aria-pressed={scene === "rain"}
          >
            <CloudRain size={13} /> Chuva
          </button>
          <button
            onClick={() => setScene("heat")}
            aria-pressed={scene === "heat"}
          >
            <Sun size={13} /> Calor
          </button>
        </div>
        <div className="scene-art" aria-hidden="true">
          <div className="scene-aura" />
          <div className="scene-sun">
            <div />
          </div>
          <div className="scene-orbit orbit-one" />
          <div className="scene-orbit orbit-two" />
          <div className="scene-stars">
            {Array.from({ length: 12 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: `${12 + ((i * 23) % 80)}%`,
                  top: `${10 + ((i * 13) % 65)}%`,
                  animationDelay: `${i * -0.6}s`,
                }}
              />
            ))}
          </div>
          <svg className="scene-terrain" viewBox="0 0 620 420" fill="none">
            <defs>
              <linearGradient
                id={`${id}-soil`}
                x1="310"
                y1="228"
                x2="310"
                y2="388"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#883d36" />
                <stop offset="1" stopColor="#24161d" />
              </linearGradient>
              <linearGradient
                id={`${id}-land`}
                x1="180"
                y1="180"
                x2="440"
                y2="320"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#b96c52" />
                <stop offset=".52" stopColor="#663e39" />
                <stop offset="1" stopColor="#41282d" />
              </linearGradient>
              <linearGradient
                id={`${id}-plot`}
                x1="170"
                y1="200"
                x2="270"
                y2="300"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#cb875f" />
                <stop offset="1" stopColor="#8c4840" />
              </linearGradient>
              <linearGradient
                id={`${id}-river`}
                x1="330"
                y1="195"
                x2="260"
                y2="335"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#ead3b1" />
                <stop offset="1" stopColor="#a35c56" />
              </linearGradient>
              <linearGradient
                id={`${id}-cloud`}
                x1="240"
                y1="60"
                x2="340"
                y2="170"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#bba6ad" />
                <stop offset=".46" stopColor="#71545d" />
                <stop offset="1" stopColor="#32232e" />
              </linearGradient>
              <pattern
                id={`${id}-rows`}
                width="16"
                height="16"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(30)"
              >
                <path
                  d="M0 0V16"
                  stroke="#f6bd88"
                  strokeWidth="3"
                  opacity=".36"
                />
              </pattern>
              <filter
                id={`${id}-shadow`}
                x="-40%"
                y="-40%"
                width="180%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="16"
                  stdDeviation="15"
                  floodColor="#08040a"
                  floodOpacity=".55"
                />
              </filter>
              <filter id={`${id}-glow`}>
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>
            <ellipse
              cx="315"
              cy="366"
              rx="205"
              ry="33"
              fill="#08050b"
              opacity=".3"
            />
            <g className="terrain-float" filter={`url(#${id}-shadow)`}>
              <path
                d="M70 252L308 146L552 248L552 296L314 403L70 298Z"
                fill={`url(#${id}-soil)`}
              />
              <path
                d="M70 252L314 355L552 248V296L314 403V355L70 252Z"
                fill="#291a20"
                opacity=".55"
              />
              <path
                d="M70 269L314 373L552 266M70 284L314 388L552 281"
                stroke="#b26951"
                strokeOpacity=".23"
                strokeWidth="2"
              />
              <path
                d="M70 252L308 146L552 248L314 355Z"
                fill={`url(#${id}-land)`}
                stroke="#bb735d"
                strokeWidth="1.5"
              />
              <path
                d="M94 249L206 201L285 235L176 286Z"
                fill={`url(#${id}-plot)`}
              />
              <path
                d="M94 249L206 201L285 235L176 286Z"
                fill={`url(#${id}-rows)`}
              />
              <path d="M211 198L306 157L389 192L294 231Z" fill="#78584b" />
              <path
                d="M211 198L306 157L389 192L294 231Z"
                fill={`url(#${id}-rows)`}
              />
              <path d="M339 267L438 223L526 249L420 297Z" fill="#92544b" />
              <path
                d="M339 267L438 223L526 249L420 297Z"
                fill={`url(#${id}-rows)`}
              />
              <path d="M184 291L293 244L365 277L257 322Z" fill="#64483f" />
              <path
                d="M184 291L293 244L365 277L257 322Z"
                fill={`url(#${id}-rows)`}
              />
              <path d="M271 329L373 284L411 301L313 345Z" fill="#ba7353" />
              <path
                className="terrain-river"
                d="M384 182C352 195 387 205 365 218C343 231 309 224 308 244C307 264 337 268 317 284C297 300 252 302 234 321"
                stroke={`url(#${id}-river)`}
                strokeWidth="8"
              />
              <path
                d="M121 238L326 327M192 211L400 295M260 181L473 262"
                stroke="#f2bd95"
                strokeWidth="1"
                opacity=".2"
              />
              <g className="terrain-barn">
                <path
                  d="M381 226V204L401 196L422 205V226L402 235Z"
                  fill="#dc9e83"
                />
                <path d="M402 213L422 205V226L402 235Z" fill="#874636" />
                <path d="M377 205L397 184L426 204L402 215Z" fill="#411e29" />
                <path d="M396 215L403 218V232L396 229Z" fill="#582b2f" />
                <path d="M410 215L415 213V220L410 222Z" fill="#ffc481" />
              </g>
              {[
                { x: 152, y: 247 },
                { x: 166, y: 253 },
                { x: 448, y: 255 },
                { x: 463, y: 249 },
                { x: 477, y: 242 },
              ].map(({ x, y }) => (
                <g key={`${x}-${y}`}>
                  <path d={`M${x} ${y}v-14`} stroke="#dda780" strokeWidth="2" />
                  <path
                    d={`M${x} ${y - 9}l-8-8m8 4l7-10m-7 6l-4-11`}
                    stroke="#d3a879"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </g>
              ))}
              <ellipse
                cx="321"
                cy="260"
                rx="28"
                ry="11"
                stroke="#ff9a80"
                strokeOpacity=".8"
                className="terrain-scan"
              />
              <ellipse cx="321" cy="260" rx="11" ry="4" fill="#ffb199" />
              <path
                d="M321 256V207"
                stroke="#ffd4b4"
                strokeWidth="1.5"
                strokeDasharray="3 4"
              />
              <circle cx="321" cy="202" r="6" fill="#ffb093" />
              <circle
                cx="321"
                cy="202"
                r="13"
                fill="#ff8460"
                opacity=".35"
                filter={`url(#${id}-glow)`}
              />
            </g>
            <g className="storm-cloud" filter={`url(#${id}-shadow)`}>
              <path
                d="M206 132C177 132 170 103 191 89C194 69 211 59 228 63C243 34 289 34 304 62C333 53 361 72 358 95C385 95 399 126 378 142C362 155 332 146 312 149L226 147C216 147 208 141 206 132Z"
                fill={`url(#${id}-cloud)`}
              />
              <path
                d="M194 88C211 79 227 84 233 95M261 58C281 57 294 70 295 86M322 79C338 80 349 92 348 104"
                stroke="#e1c8cb"
                strokeOpacity=".15"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                className="storm-bolt"
                d="M290 139L269 179H289L279 205L314 162H294L306 139Z"
                fill="#ffd4a0"
              />
            </g>
          </svg>
          <div className="scene-rain-drops">
            {Array.from({ length: 27 }, (_, i) => (
              <i
                key={i}
                style={
                  {
                    "--drop-x": `${15 + ((i * 17) % 72)}%`,
                    "--drop-delay": `${(i * 0.17) % 2}s`,
                    "--drop-duration": `${0.9 + (i % 5) * 0.12}s`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <div className="scene-data scene-data-top">
            <span className="scene-data-icon">
              {scene === "rain" ? <CloudRain size={18} /> : <Sun size={18} />}
            </span>
            <div>
              <small>CENÁRIO ILUSTRATIVO</small>
              <strong>
                {scene === "rain" ? "Chuva em movimento" : "Calor sob atenção"}
              </strong>
            </div>
          </div>
          <div className="scene-data scene-data-bottom">
            <Waves size={16} />
            <span>Observe. Planeje. Proteja.</span>
            <div className="scene-wave">
              {Array.from({ length: 10 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    animationDelay: `${i * -0.14}s`,
                    height: `${5 + ((i * 7) % 17)}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="scene-caption">
          <span>Visualização ilustrativa · não representa risco atual</span>
          <button
            onClick={() => setPlaying((value) => !value)}
            disabled={reducedMotion}
            aria-label={animated ? "Pausar animação" : "Ativar animação"}
            title={
              reducedMotion
                ? "Movimento reduzido conforme sua preferência"
                : animated
                  ? "Pausar animação"
                  : "Ativar animação"
            }
          >
            {animated ? <Pause size={12} /> : <Play size={12} />}
          </button>
        </div>
      </div>
    </section>
  );
}
