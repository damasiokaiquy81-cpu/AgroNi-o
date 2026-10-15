import { NextRequest, NextResponse } from "next/server";
import {
  fetchPublicDocument,
  parseMunicipalities,
  validUf,
} from "@/lib/integrations/publicSources";

export async function GET(request: NextRequest) {
  const uf = (request.nextUrl.searchParams.get("uf") || "MT").toUpperCase();
  if (!validUf(uf))
    return NextResponse.json({ error: "UF inválida." }, { status: 400 });
  try {
    const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`;
    const body = await fetchPublicDocument(url, 86400);
    const municipalities = parseMunicipalities(JSON.parse(body), uf);
    // Preserve the array contract for clients consuming the official catalogue.
    return NextResponse.json(municipalities, {
      headers: {
        "X-Data-Source": "IBGE",
        "X-Checked-At": new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: "unavailable",
        source: "IBGE",
        sourceUrl: "https://www.ibge.gov.br/",
        error:
          "O catálogo do IBGE está indisponível no momento. Os municípios de referência continuam disponíveis.",
        checkedAt: new Date().toISOString(),
      },
      { status: 502 },
    );
  }
}
