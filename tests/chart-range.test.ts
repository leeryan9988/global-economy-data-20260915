import assert from "node:assert/strict";
import { test } from "node:test";
import { formatChartAxisValue, selectChartRange } from "../lib/charts/range";
import type { AnnualObservation } from "../lib/series/types";

const observations: AnnualObservation[] = Array.from({ length: 10 }, (_, index) => ({
  year: 2016 + index,
  value: index === 9 ? null : String(index),
}));

test("chart ranges anchor to the latest non-null year", () => {
  assert.deepEqual(selectChartRange(observations, "5y").map((item) => item.year), [2020, 2021, 2022, 2023, 2024]);
  assert.equal(selectChartRange(observations, "10y").length, 9);
  assert.equal(selectChartRange(observations, "all"), observations);
});

test("empty chart series still provides a bounded recent range", () => {
  const empty = observations.map((item) => ({ ...item, value: null }));
  assert.deepEqual(selectChartRange(empty, "5y").map((item) => item.year), [2021, 2022, 2023, 2024, 2025]);
});

test("axis labels use units that match each indicator", () => {
  assert.equal(formatChartAxisValue("gdp", 2_500_000_000_000), "2.5万亿");
  assert.equal(formatChartAxisValue("population", 1_400_000_000), "14.0亿");
  assert.equal(formatChartAxisValue("inflation", -0.25), "-0.3%");
});
