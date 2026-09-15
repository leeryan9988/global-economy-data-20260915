import { writeFile } from "node:fs/promises";
import { countries } from "../lib/catalog/countries";
import { indicators, worldBankSource } from "../lib/catalog/indicators";

const literal = (value: string | number) => typeof value === "number" ? String(value) : `'${value.replaceAll("'", "''")}'`;
const rows = (values: (string | number)[][]) => values.map((row) => `  (${row.map(literal).join(", ")})`).join(",\n");
const sql = `-- Generated from the TypeScript catalog. Immutable seed migration; do not overwrite.\nBEGIN;\n\nINSERT INTO public.countries (id, iso2, iso3, slug, name_en, name_zh, flag, region) VALUES\n${rows(countries.map((row) => [row.id, row.iso2, row.iso3, row.slug, row.name_en, row.name_zh, row.flag, row.region]))};\n\nINSERT INTO public.indicators (id, name_zh, name_en, api_code, unit, source, source_id, source_url, description, decimal_places) VALUES\n${rows(indicators.map((row) => [row.id, row.name_zh, row.name_en, row.api_code, row.unit, worldBankSource.source, worldBankSource.source_id, worldBankSource.indicatorBaseUrl + row.api_code, row.description, row.decimal_places]))};\n\nCOMMIT;\n`;
await writeFile(new URL("../supabase/migrations/202609150002_catalog_seed.sql", import.meta.url), sql, { flag: "wx" });
console.log("Created seed migration without replacing existing files.");
