import { z } from "zod";

const states = new Set([
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]);
export const validUf = (uf: string) => states.has(uf);

export function parseCoordinates(params: URLSearchParams) {
  const rawLat = params.get("lat"),
    rawLon = params.get("lon");
  if (!rawLat?.trim() || !rawLon?.trim()) return null;
  const lat = Number(rawLat),
    lon = Number(rawLon);
  return Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
    ? { lat, lon }
    : null;
}

const values = z.array(z.number().finite());
const weatherSchema = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string(),
    current: z
      .object({
        time: z.string(),
        temperature_2m: z.number().finite().nullable(),
        relative_humidity_2m: z.number().min(0).max(100).nullable(),
        wind_speed_10m: z.number().nonnegative().nullable(),
      })
      .passthrough()
      .optional(),
    current_units: z
      .object({
        temperature_2m: z.literal("°C"),
        relative_humidity_2m: z.literal("%"),
        wind_speed_10m: z.literal("km/h"),
      })
      .passthrough()
      .optional(),
    daily: z
      .object({
        time: z
          .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
          .min(1)
          .max(16),
        temperature_2m_max: values,
        temperature_2m_min: values,
        precipitation_sum: z.array(z.number().nonnegative()),
        precipitation_probability_max: z.array(z.number().min(0).max(100)),
      })
      .passthrough(),
    daily_units: z
      .object({
        temperature_2m_max: z.literal("°C"),
        temperature_2m_min: z.literal("°C"),
        precipitation_sum: z.literal("mm"),
        precipitation_probability_max: z.literal("%"),
      })
      .passthrough(),
  })
  .passthrough();

export function parseWeather(input: unknown) {
  const data = weatherSchema.parse(input);
  if (data.current && !data.current_units)
    throw new Error("Missing current weather units");
  const n = data.daily.time.length;
  if (
    [
      data.daily.temperature_2m_max,
      data.daily.temperature_2m_min,
      data.daily.precipitation_sum,
      data.daily.precipitation_probability_max,
    ].some((series) => series.length !== n)
  ) {
    throw new Error("Incomplete weather series");
  }
  return data;
}

export type WeatherData = ReturnType<typeof parseWeather>;
export type WeatherResponse = {
  status: "connected";
  mode: "live";
  source: "Open-Meteo";
  sourceUrl: string;
  retrievedAt: string;
  coordinates: { lat: number; lon: number };
  data: WeatherData;
};

const municipalitySchema = z
  .object({
    id: z.number().int().positive(),
    nome: z.string().min(1),
    microrregiao: z
      .object({
        mesorregiao: z
          .object({ UF: z.object({ sigla: z.string() }).passthrough() })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();

export function parseMunicipalities(input: unknown, uf: string) {
  const data = z.array(municipalitySchema).min(1).max(6000).parse(input);
  if (
    data.some(
      (municipality) => municipality.microrregiao.mesorregiao.UF.sigla !== uf,
    )
  )
    throw new Error("Unexpected state in catalogue");
  return data;
}

/** A verified source document is not an interpreted current ENSO forecast. */
export function verifyEnsoBulletin(html: string) {
  return (
    /ENSO/i.test(html) &&
    /Diagnostic\s+Discussion/i.test(html) &&
    /Climate\s+Prediction\s+Center/i.test(html)
  );
}

/** Fixed server-owned URLs, bounded duration/body, normal TLS validation and Next cache. */
export async function fetchPublicDocument(url: string, revalidate: number) {
  const response = await fetch(url, {
    next: { revalidate },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok || !response.body)
    throw new Error("Public source unavailable");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0,
    text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1_000_000) throw new Error("Public document too large");
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}
