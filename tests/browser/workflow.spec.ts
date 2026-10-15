import { test, expect } from "@playwright/test";
test("propriedade persiste e alertas simulados são deduplicados", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Minhas propriedades", exact: true })
    .click();
  await page.getByRole("button", { name: "Nova propriedade" }).click();
  await page
    .getByPlaceholder("Ex.: Fazenda Boa Esperança")
    .fill("Fazenda Teste");
  await page.getByRole("button", { name: "Salvar propriedade" }).click();
  await expect(
    page.getByRole("heading", { name: "Fazenda Teste" }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Minhas propriedades", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Fazenda Teste" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Alertas e riscos", exact: true })
    .click();
  await page.getByRole("button", { name: "Simular condição" }).click();
  await page.getByRole("button", { name: "Executar simulação" }).click();
  await expect(
    page.getByRole("heading", { name: "Prévia no WhatsApp" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Chuva excessiva em Sorriso" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Simular condição" }).click();
  await page.getByRole("button", { name: "Executar simulação" }).click();
  await expect(
    page.getByText(
      "Alerta já registrado para esta regra e período. Duplicata evitada.",
    ),
  ).toBeVisible();
});
test("layout móvel não excede a largura da tela", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Bom dia, João" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("dashboard sem economia e mapa real acompanha o município sem serviços externos", async ({
  page,
}) => {
  await page.route(/^https:\/\//, (route) => route.abort());
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Economia e preços" }),
  ).toHaveCount(0);
  await expect(page.getByText("Preços e mercado")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Panorama climático" }),
  ).toBeVisible();
  const map = page.getByRole("region", {
    name: "Mapa regional de Sorriso",
    exact: true,
  });
  await expect(
    map.locator('.leaflet-overlay-pane path[stroke="#52e6b6"]'),
  ).toBeVisible();
  await expect(map.locator(".city-label.current")).toHaveText("Sorriso");
  await page.getByLabel("Minha região").selectOption("3");
  const changed = page.getByRole("region", {
    name: "Mapa regional de Silvânia",
    exact: true,
  });
  await expect(
    changed.getByRole("tooltip", { name: "Silvânia", exact: true }),
  ).toHaveText("Silvânia");
  await expect(
    changed.locator('.leaflet-overlay-pane path[stroke="#52e6b6"]'),
  ).toBeVisible();
  await changed
    .getByRole("button", { name: "Centralizar no município" })
    .click();
});

test("preferência por movimento reduzido desativa animações decorativas", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page
      .locator(".enso .progress i")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});

test("regra de calor salva responsável, simula temperatura e mantém histórico", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByLabel("Minha cultura", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Painel do agrônomo", exact: true })
    .click();
  await page.getByRole("button", { name: "Nova regra", exact: true }).click();
  await page.getByLabel("Tipo de risco").selectOption("heat");
  await page.getByLabel("Cultura atendida").selectOption("Milho");
  await page.getByLabel("Temperatura máxima (°C)").fill("38");
  await page.getByLabel("Agrônomo responsável").fill("Ana Silva");
  await page.getByLabel("Registro profissional (opcional)").fill("CREA TESTE");
  await page
    .getByLabel("Orientação preventiva")
    .fill(
      "Conferir a disponibilidade hídrica e acompanhar a lavoura nos horários de menor calor.",
    );
  await page.getByRole("button", { name: "Salvar regra", exact: true }).click();
  const row = page.locator(".rule-row").filter({ hasText: "Ana Silva" });
  await expect(row).toContainText("Milho");
  await expect(row).toContainText("38");
  await row.getByRole("button", { name: "Histórico de Calor intenso" }).click();
  await expect(page.locator(".audit-timeline")).toContainText("Ana Silva");
  await expect(page.locator(".audit-timeline")).toContainText(
    "Criou Calor intenso",
  );
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page
    .getByRole("button", { name: "Alertas e riscos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Simular condição", exact: true })
    .click();
  await page
    .getByLabel("Regra a testar")
    .selectOption({ label: "Calor intenso · Milho · Ana Silva" });
  await page.getByLabel("Temperatura máxima simulada (°C)").fill("40");
  await page.getByRole("button", { name: "Executar simulação" }).click();
  await expect(
    page.getByRole("heading", { name: "Prévia no WhatsApp" }),
  ).toBeVisible();
  await expect(page.locator(".wa-bubble")).toContainText("40 °C");
  await expect(page.locator(".wa-bubble")).toContainText("Ana Silva");
  await expect(page.locator(".wa-bubble")).toContainText("Calor intenso");
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Painel do agrônomo", exact: true })
    .click();
  await expect(
    page.locator(".rule-row").filter({ hasText: "Ana Silva" }),
  ).toContainText("38");
});

test("cenário climático é interativo e o áudio só liga após comando explícito", async ({
  page,
}) => {
  await page.goto("/");
  const audio = page.getByRole("button", {
    name: "Ligar som de chuva",
    exact: true,
  });
  await expect(audio).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Calor", exact: true }).click();
  await expect(page.locator(".climate-hero")).toHaveClass(/scene-heat/);
  await page.getByRole("button", { name: "Chuva", exact: true }).click();
  await expect(page.locator(".climate-hero")).toHaveClass(/scene-rain/);
  await page
    .getByRole("button", { name: "Pausar animação", exact: true })
    .click();
  await expect(page.locator(".climate-hero")).toHaveAttribute(
    "data-motion",
    "paused",
  );
  await audio.click();
  await expect(
    page.getByRole("button", { name: "Desligar som de chuva", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Volume do som de chuva")).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(
    page.getByRole("button", { name: "Ligar som de chuva", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});
