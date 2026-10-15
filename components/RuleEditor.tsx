"use client";
import { useState } from "react";
import { Check, CloudRain, Thermometer, UserRound } from "lucide-react";
import { riskTypes, ruleSchema, type Rule, type RiskType } from "@/lib/rules";
export default function RuleEditor({
  value,
  cities,
  onSave,
}: {
  value: Rule;
  cities: string[];
  onSave: (r: Rule) => void;
}) {
  const [form, setForm] = useState(value),
    [error, setError] = useState("");
  const risk = riskTypes[form.kind];
  return (
    <form
      className="rule-editor"
      onSubmit={(e) => {
        e.preventDefault();
        const result = ruleSchema.safeParse({ ...form, name: risk.name });
        if (!result.success) {
          setError(result.error.issues[0].message);
          return;
        }
        onSave(result.data);
      }}
    >
      <div className="eyebrow">REGRAS PREVENTIVAS</div>
      <h2>{value.createdAt ? "Editar regra" : "Configurar regra"}</h2>
      <p>Defina a condição e registre o profissional responsável.</p>
      <label>
        Tipo de risco
        <select
          value={form.kind}
          onChange={(e) => {
            const kind = e.target.value as RiskType;
            setForm({
              ...form,
              kind,
              name: riskTypes[kind].name,
              threshold: riskTypes[kind].example,
            });
          }}
        >
          <option value="rain">Chuva excessiva</option>
          <option value="heat">Calor intenso</option>
        </select>
      </label>
      <div className={"rule-metric-summary " + form.kind}>
        {form.kind === "heat" ? (
          <Thermometer size={22} />
        ) : (
          <CloudRain size={22} />
        )}
        <span>
          {form.kind === "heat"
            ? "Dispara se a temperatura máxima alcançar o limite dentro do período."
            : "Dispara se a chuva acumulada alcançar o limite dentro do período."}
        </span>
      </div>
      <div className="form-grid">
        <label>
          Município
          <select
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          >
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Cultura atendida
          <select
            value={form.crop}
            onChange={(e) => setForm({ ...form, crop: e.target.value })}
          >
            {[
              "Todas as culturas",
              "Soja",
              "Milho",
              "Café",
              "Feijão",
              "Arroz",
              "Pastagem",
              "Outras",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          {risk.metric} ({risk.unit})
          <input
            type="number"
            required
            min="0.1"
            step="0.1"
            max={form.kind === "heat" ? 65 : 3000}
            value={form.threshold}
            onChange={(e) => setForm({ ...form, threshold: +e.target.value })}
          />
        </label>
        <label>
          Período (horas)
          <input
            type="number"
            required
            min="1"
            max="384"
            step="1"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: +e.target.value })}
          />
        </label>
      </div>
      <p className="field-help">
        A cultura direciona a orientação e o público desta regra. A previsão do
        município é a mesma para soja, milho e outras culturas.
      </p>
      <div className="editor-divider">
        <UserRound size={15} /> Responsabilidade técnica
      </div>
      <label>
        Agrônomo responsável
        <input
          required
          minLength={2}
          maxLength={100}
          placeholder="Nome completo do profissional"
          value={form.agronomist}
          onChange={(e) => setForm({ ...form, agronomist: e.target.value })}
        />
      </label>
      <label>
        Registro profissional (opcional)
        <input
          maxLength={60}
          placeholder="Ex.: CREA e UF"
          value={form.registration}
          onChange={(e) => setForm({ ...form, registration: e.target.value })}
        />
      </label>
      <label>
        Orientação preventiva
        <textarea
          required
          minLength={10}
          value={form.guidance}
          onChange={(e) => setForm({ ...form, guidance: e.target.value })}
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
        />{" "}
        Ativar para simulações
      </label>
      <p className="source">
        Nome e registro informados pelo usuário, sem verificação profissional.
        Dados e histórico ficam neste navegador. Limites de exemplo precisam de
        validação técnica antes de uso real.
      </p>
      {error && (
        <p role="alert" className="inline-error">
          {error}
        </p>
      )}
      <button className="primary" type="submit">
        Salvar regra <Check size={15} />
      </button>
    </form>
  );
}
