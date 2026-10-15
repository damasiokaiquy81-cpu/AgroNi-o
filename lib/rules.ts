import { z } from "zod";

export const riskTypes = {
  rain: {
    name: "Chuva excessiva",
    unit: "mm",
    metric: "Chuva acumulada",
    example: 70,
  },
  heat: {
    name: "Calor intenso",
    unit: "°C",
    metric: "Temperatura máxima",
    example: 35,
  },
} as const;
export type RiskType = keyof typeof riskTypes;
export const ruleSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(3),
    kind: z.enum(["rain", "heat"]).default("rain"),
    city: z.string().min(1),
    crop: z.string().min(1),
    threshold: z.number().finite().positive().max(3000),
    hours: z.number().int().min(1).max(384),
    guidance: z.string().trim().min(10),
    active: z.boolean(),
    agronomist: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .default("Equipe de demonstração"),
    registration: z.string().trim().max(60).default(""),
    createdBy: z.string().default("Equipe de demonstração"),
    createdAt: z.string().default(""),
    updatedAt: z.string().default(""),
    history: z
      .array(z.object({ at: z.string(), by: z.string(), action: z.string() }))
      .default([]),
  })
  .refine((r) => r.kind !== "heat" || r.threshold <= 65, {
    message: "Informe uma temperatura de até 65 °C.",
    path: ["threshold"],
  });
export type Rule = z.infer<typeof ruleSchema>;
export function evaluateCondition(rule: Rule, value: number) {
  return rule.active && Number.isFinite(value) && value >= rule.threshold;
}
export function evaluateHourly(rule: Rule, hourly: number[]) {
  const window = hourly.slice(0, rule.hours);
  if (!window.length || window.some((v) => !Number.isFinite(v))) return false;
  if (rule.kind === "rain" && window.some((v) => v < 0)) return false;
  const value =
    rule.kind === "heat"
      ? Math.max(...window)
      : window.reduce((a, b) => a + b, 0);
  return evaluateCondition(rule, value);
}
// Kept for the existing worker contract; rain must never evaluate a heat rule.
export function evaluateRain(rule: Rule, hourly: number[]) {
  return rule.kind === "rain" && evaluateHourly(rule, hourly);
}
export function eventKey(ruleId: string, region: string, period: string) {
  return `${ruleId}:${region}:${period}`;
}
export function normalizeRule(value: unknown): Rule | null {
  const r = ruleSchema.safeParse(value);
  return r.success ? r.data : null;
}
export function saveRuleRevision(
  input: Rule,
  previous?: Rule,
  at = new Date().toISOString(),
): Rule {
  const parsed = ruleSchema.parse({
    ...input,
    name: riskTypes[input.kind].name,
  });
  const action = previous
    ? `Editou ${parsed.name}: ${parsed.threshold} ${riskTypes[parsed.kind].unit} / ${parsed.hours}h; ${parsed.city}; ${parsed.crop}; ${parsed.active ? "ativa" : "inativa"}.`
    : `Criou ${parsed.name}: ${parsed.threshold} ${riskTypes[parsed.kind].unit} / ${parsed.hours}h; ${parsed.city}; ${parsed.crop}.`;
  return {
    ...parsed,
    createdBy: previous?.createdBy || parsed.agronomist,
    createdAt: previous?.createdAt || at,
    updatedAt: at,
    history: [
      ...(previous?.history || []),
      { at, by: parsed.agronomist, action },
    ],
  };
}
