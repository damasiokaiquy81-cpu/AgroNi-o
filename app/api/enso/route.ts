import { NextResponse } from "next/server";
import {
  fetchPublicDocument,
  verifyEnsoBulletin,
} from "@/lib/integrations/publicSources";

const sourceUrl =
  "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml";

export async function GET() {
  const metadata = {
    source: "NOAA / CPC",
    sourceUrl,
    title: "ENSO Diagnostic Discussion",
    // No heuristic extraction of phase, probabilities or issue date from HTML.
    phase: null,
    probability: null,
    issuedAt: null,
    checkedAt: new Date().toISOString(),
  };
  try {
    const html = await fetchPublicDocument(sourceUrl, 3600);
    if (!verifyEnsoBulletin(html))
      throw new Error("Unexpected bulletin document");
    return NextResponse.json({
      ...metadata,
      status: "connected",
      mode: "bulletin",
      message:
        "Boletim oficial disponível para leitura. Fase e probabilidades não são interpretadas automaticamente.",
    });
  } catch {
    return NextResponse.json(
      {
        ...metadata,
        status: "unavailable",
        mode: "unavailable",
        error:
          "Não foi possível verificar o boletim da NOAA agora. Consulte a publicação oficial.",
      },
      { status: 502 },
    );
  }
}
