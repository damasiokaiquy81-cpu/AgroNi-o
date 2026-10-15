import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateRain,
  evaluateHourly,
  evaluateCondition,
  eventKey,
  ruleSchema,
  normalizeRule,
  saveRuleRevision,
} from "../lib/rules";
const rule = ruleSchema.parse({
  id: "r1",
  name: "Chuva excessiva",
  city: "Sorriso",
  crop: "Soja",
  threshold: 70,
  hours: 48,
  guidance: "Orientação de teste",
  active: true,
});
test("chuva acumulada atinge limite inclusivo", () => {
  assert.equal(evaluateRain(rule, [30, 40]), true);
  assert.equal(evaluateRain(rule, [30, 39]), false);
});
test("regra inativa não dispara", () =>
  assert.equal(evaluateRain({ ...rule, active: false }, [100]), false));
test("respeita a janela horária", () =>
  assert.equal(evaluateRain({ ...rule, hours: 2 }, [10, 10, 100]), false));
test("calor compara a máxima e não soma temperaturas", () => {
  const heat = { ...rule, kind: "heat" as const, threshold: 35, hours: 3 };
  assert.equal(evaluateHourly(heat, [20, 20, 20]), false);
  assert.equal(evaluateHourly(heat, [33, 35, 34]), true);
  assert.equal(evaluateHourly(heat, [30, 31, 32, 40]), false);
  assert.equal(evaluateRain(heat, [40]), false);
});
test("dados inválidos ou vazios não geram alertas", () => {
  assert.equal(evaluateHourly(rule, []), false);
  assert.equal(evaluateHourly(rule, [NaN]), false);
  assert.equal(evaluateHourly(rule, [-20, 100]), false);
  assert.equal(evaluateCondition(rule, Infinity), false);
});
test("chave de deduplicação estável e específica", () => {
  assert.equal(
    eventKey("r1", "Sorriso", "2026-10-15"),
    eventKey("r1", "Sorriso", "2026-10-15"),
  );
  assert.notEqual(
    eventKey("r1", "Sorriso", "2026-10-15"),
    eventKey("r2", "Sorriso", "2026-10-15"),
  );
});
test("limites e autoria inválidos são rejeitados", () => {
  for (const patch of [
    { threshold: -1 },
    { hours: 400 },
    { hours: 1.5 },
    { agronomist: "" },
    { kind: "heat", threshold: 80 },
  ])
    assert.equal(ruleSchema.safeParse({ ...rule, ...patch }).success, false);
});
test("regras antigas migram sem perder a orientação", () => {
  const old = {
    id: "old",
    name: "Chuva excessiva",
    city: "Sinop",
    crop: "Milho",
    threshold: 70,
    hours: 24,
    guidance: "Orientação anterior",
    active: true,
  };
  const migrated = normalizeRule(old);
  assert.equal(migrated?.kind, "rain");
  assert.equal(migrated?.guidance, old.guidance);
  assert.equal(normalizeRule({ bad: true }), null);
});
test("autoria original e histórico são preservados nas edições", () => {
  const created = saveRuleRevision(
    { ...rule, agronomist: "Ana Silva" },
    undefined,
    "2026-10-15T12:00:00Z",
  );
  const updated = saveRuleRevision(
    { ...created, agronomist: "Bruno Lima", threshold: 90 },
    created,
    "2026-10-15T13:00:00Z",
  );
  assert.equal(updated.createdBy, "Ana Silva");
  assert.equal(updated.createdAt, created.createdAt);
  assert.equal(updated.agronomist, "Bruno Lima");
  assert.equal(updated.history.length, 2);
  assert.equal(updated.history[1].by, "Bruno Lima");
  assert.equal(updated.history[0].by, "Ana Silva");
});
