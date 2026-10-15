"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  GeoJSON,
  Marker,
  Popup,
  TileLayer,
  useMap,
  Tooltip as MapTooltip,
} from "react-leaflet";
import { Layers, LocateFixed, MapPin, RotateCw } from "lucide-react";
import type { FeatureCollection } from "geojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.divIcon({
  className: "map-pin",
  html: "<span></span>",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});
function Camera({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 8, {
      duration: 1.25,
      animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }, [map, lat, lon]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}
function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  return (
    <button
      className="map-recenter"
      onClick={() =>
        map.flyTo([lat, lon], 8, {
          duration: 1,
          animate: !window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches,
        })
      }
      aria-label="Centralizar no município"
    >
      <LocateFixed size={16} />
    </button>
  );
}
export default function RegionMap({
  lat,
  lon,
  name,
}: {
  lat: number;
  lon: number;
  name: string;
}) {
  const [data, setData] = useState<FeatureCollection | null>(null),
    [state, setState] = useState("loading"),
    [streets, setStreets] = useState(false),
    [tileError, setTileError] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState("loading");
    fetch("/maps/regions.geojson", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        setData(d);
        setState("ready");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setState("error");
      });
    return () => controller.abort();
  }, [attempt]);
  const selected = data?.features.filter((f) => f.properties?.name === name);
  return (
    <div
      className="region-map"
      role="region"
      aria-label={`Mapa regional de ${name}`}
    >
      <MapContainer
        center={[lat, lon]}
        zoom={8}
        scrollWheelZoom={false}
        attributionControl={true}
        style={{ height: "100%", width: "100%" }}
      >
        <Camera lat={lat} lon={lon} />
        <Recenter lat={lat} lon={lon} />
        {streets && (
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: () => {
                setTileError(true);
                setStreets(false);
              },
            }}
          />
        )}
        {data && (
          <GeoJSON
            key={`region-${streets}`}
            data={data}
            attribution="Limites: IBGE / Geodata BR (CC0)"
            style={{
              color: "#48776c",
              weight: 1,
              fillColor: "#1c3e38",
              fillOpacity: streets ? 0.18 : 0.65,
            }}
            onEachFeature={(feature, layer) => {
              layer.bindTooltip(String(feature.properties?.name || ""), {
                className: "municipality-tooltip",
                sticky: true,
              });
            }}
          />
        )}
        {selected && selected.length > 0 && (
          <GeoJSON
            key={name}
            data={
              {
                type: "FeatureCollection",
                features: selected,
              } as FeatureCollection
            }
            style={{
              color: "#52e6b6",
              weight: 2,
              fillColor: "#24c68c",
              fillOpacity: 0.27,
            }}
          />
        )}
        {[
          { lat: -12.5425, lon: -55.7211, name: "Sorriso" },
          { lat: -11.8642, lon: -55.5036, name: "Sinop" },
          { lat: -13.0588, lon: -55.9042, name: "Lucas do Rio Verde" },
          { lat: -16.6589, lon: -48.6081, name: "Silvânia" },
        ]
          .filter((c) => Math.abs(c.lat - lat) < 2 && Math.abs(c.lon - lon) < 2)
          .map((c) => (
            <Marker key={c.name} position={[c.lat, c.lon]} icon={icon}>
              <MapTooltip
                permanent
                direction="right"
                offset={[12, 0]}
                className={"city-label " + (c.name === name ? "current" : "")}
              >
                {c.name}
              </MapTooltip>
              <Popup>
                <strong>{c.name}</strong>
                <br />
                Sede municipal de referência.
                <br />
                Não representa localização exata da propriedade.
              </Popup>
            </Marker>
          ))}
      </MapContainer>
      <div className="map-layer-control">
        <button
          className={!streets ? "active" : ""}
          onClick={() => setStreets(false)}
        >
          <Layers size={12} /> Território
        </button>
        <button
          className={streets ? "active" : ""}
          onClick={() => {
            setTileError(false);
            setStreets(true);
          }}
        >
          Ruas
        </button>
      </div>
      {state === "loading" && (
        <div className="map-notice">
          <RotateCw size={12} className="spin" /> Carregando limites municipais…
        </div>
      )}
      {state === "error" && (
        <div className="map-notice">
          Cartografia indisponível.{" "}
          <button onClick={() => setAttempt((a) => a + 1)}>
            Tentar novamente
          </button>
        </div>
      )}
      {tileError && (
        <div className="map-notice">
          Ruas indisponíveis. Exibindo limites municipais.
        </div>
      )}
      <span className="map-coordinate">
        <MapPin size={10} />
        {Math.abs(lat).toFixed(2)}° S · {Math.abs(lon).toFixed(2)}° O
      </span>
    </div>
  );
}
