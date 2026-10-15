import assert from "node:assert/strict";
import test from "node:test";
import {
  parseCoordinates,
  parseMunicipalities,
  parseWeather,
  validUf,
  verifyEnsoBulletin,
} from "../lib/integrations/publicSources";

const forecast = {
  latitude: -12.54,
  longitude: -55.72,
  timezone: "America/Cuiaba",
  daily: {
    time: ["2026-10-15", "2026-10-16"],
    temperature_2m_max: [33, 34],
    temperature_2m_min: [22, 23],
    precipitation_sum: [0, 12],
    precipitation_probability_max: [0, 70],
  },
  daily_units: {
    temperature_2m_max: "°C",
    temperature_2m_min: "°C",
    precipitation_sum: "mm",
    precipitation_probability_max: "%",
  },
};

test("weather coordinates reject missing, empty and out-of-range inputs but allow zero", () => {
  for (const query of [
    "",
    "lat=&lon=0",
    "lat=0&lon= ",
    "lat=NaN&lon=5",
    "lat=91&lon=0",
    "lat=0&lon=-181",
  ])
    assert.equal(parseCoordinates(new URLSearchParams(query)), null);
  assert.deepEqual(parseCoordinates(new URLSearchParams("lat=0&lon=0")), {
    lat: 0,
    lon: 0,
  });
});

test("public weather validation preserves zero readings and rejects invalid units or missing days", () => {
  assert.equal(parseWeather(forecast).daily.precipitation_sum[0], 0);
  assert.throws(() =>
    parseWeather({
      ...forecast,
      daily: { ...forecast.daily, temperature_2m_max: [33] },
    }),
  );
  assert.throws(() =>
    parseWeather({
      ...forecast,
      daily: { ...forecast.daily, precipitation_sum: [null, 12] },
    }),
  );
  assert.throws(() =>
    parseWeather({
      ...forecast,
      daily_units: { ...forecast.daily_units, temperature_2m_max: "°F" },
    }),
  );
  assert.throws(() =>
    parseWeather({
      ...forecast,
      daily: { ...forecast.daily, precipitation_probability_max: [0, 170] },
    }),
  );
  const current = {
    time: "2026-10-15T12:00",
    temperature_2m: 35,
    relative_humidity_2m: 45,
    wind_speed_10m: 5,
  };
  const current_units = {
    temperature_2m: "°C",
    relative_humidity_2m: "%",
    wind_speed_10m: "km/h",
  };
  assert.equal(
    parseWeather({ ...forecast, current, current_units }).current
      ?.temperature_2m,
    35,
  );
  assert.throws(() =>
    parseWeather({
      ...forecast,
      current: { ...current, relative_humidity_2m: 101 },
      current_units,
    }),
  );
  assert.throws(() => parseWeather({ ...forecast, current }));
});

test("municipalities must belong to the requested state and contain official identifiers", () => {
  const rows = [
    {
      id: 5107925,
      nome: "Sorriso",
      microrregiao: { mesorregiao: { UF: { sigla: "MT" } } },
    },
  ];
  assert.equal(parseMunicipalities(rows, "MT")[0].nome, "Sorriso");
  assert.throws(() => parseMunicipalities(rows, "GO"));
  assert.throws(() => parseMunicipalities([], "MT"));
  assert.equal(validUf("ZZ"), false);
  assert.equal(validUf("MT"), true);
});

test("ENSO availability requires the bulletin identity, not a generic successful HTML response", () => {
  assert.equal(
    verifyEnsoBulletin("<html>Service temporarily unavailable</html>"),
    false,
  );
  assert.equal(
    verifyEnsoBulletin(
      "<h1>Climate Prediction Center</h1><h2>ENSO Diagnostic Discussion</h2>",
    ),
    true,
  );
});
