import { NextRequest, NextResponse } from "next/server";
import {
  fetchPublicDocument,
  parseCoordinates,
  parseWeather,
} from "@/lib/integrations/publicSources";

export async function GET(request: NextRequest) {
  const coordinates = parseCoordinates(request.nextUrl.searchParams);
  if (!coordinates)
    return NextResponse.json(
      { error: "Coordenadas inválidas." },
      { status: 400 },
    );
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(coordinates.lat),
    longitude: String(coordinates.lon),
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
    hourly:
      "temperature_2m,precipitation,relative_humidity_2m,wind_speed_10m,wind_gusts_10m",
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m",
    timezone: "auto",
    forecast_days: "7",
  }).toString();
  try {
    const body = await fetchPublicDocument(url.toString(), 1800);
    const data = parseWeather(JSON.parse(body));
    return NextResponse.json({
      status: "connected",
      mode: "live",
      source: "Open-Meteo",
      sourceUrl: "https://open-meteo.com/",
      retrievedAt: new Date().toISOString(),
      coordinates,
      data,
    });
  } catch {
    return NextResponse.json(
      {
        status: "unavailable",
        source: "Open-Meteo",
        sourceUrl: "https://open-meteo.com/",
        error:
          "Não foi possível obter uma previsão válida. Tente novamente em alguns minutos.",
        checkedAt: new Date().toISOString(),
      },
      { status: 502 },
    );
  }
}
