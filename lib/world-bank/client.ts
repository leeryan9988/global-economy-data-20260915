import { countries, type CountryCode } from "@/lib/catalog/countries";
import type { Indicator } from "@/lib/catalog/indicators";
import type { WorldBankDataset, WorldBankObservation } from "./types";

const DEFAULT_BASE_URL = "https://api.worldbank.org/v2";
const ISO3_TO_COUNTRY = new Map<string, (typeof countries)[number]>(
  countries.map((country) => [country.iso3, country]),
);

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
type Sleep = (milliseconds: number) => Promise<void>;

export interface FetchWorldBankOptions {
  fetchImpl?: FetchLike;
  sleep?: Sleep;
  baseUrl?: string;
  timeoutMs?: number;
  maxAttempts?: number;
  perPage?: number;
}

interface PageMetadata {
  page: number;
  pages: number;
  total: number;
  lastupdated: string | null;
}

interface ParsedPage {
  metadata: PageMetadata;
  observations: WorldBankObservation[];
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`World Bank ${label} is not an object.`);
  }
  return value as Record<string, unknown>;
}

function integer(value: unknown, label: string, minimum = 0): number {
  const parsed = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  if (!Number.isInteger(parsed) || (parsed as number) < minimum) {
    throw new Error(`World Bank ${label} is not a valid integer.`);
  }
  return parsed as number;
}

function sourceDate(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("World Bank lastupdated is not an ISO date.");
  }
  return value;
}

function decimal(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("World Bank value is not finite.");
    return String(value);
  }
  if (typeof value === "string" && /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) {
    return value;
  }
  throw new Error("World Bank value is neither a finite number nor null.");
}

export function parseWorldBankPage(
  payload: unknown,
  indicator: Indicator,
  requestedCountryCodes: readonly CountryCode[],
  fromYear: number,
  toYear: number,
): ParsedPage {
  if (!Array.isArray(payload) || payload.length !== 2) {
    const message = object(payload, "error response").message;
    throw new Error(`World Bank returned an error response${message ? `: ${JSON.stringify(message)}` : "."}`);
  }
  const metadataValue = object(payload[0], "metadata");
  const metadata: PageMetadata = {
    page: integer(metadataValue.page, "page", 1),
    pages: integer(metadataValue.pages, "pages", 1),
    total: integer(metadataValue.total, "total"),
    lastupdated: sourceDate(metadataValue.lastupdated),
  };
  if (metadata.page > metadata.pages) throw new Error("World Bank page exceeds page count.");
  if (!Array.isArray(payload[1])) throw new Error("World Bank observations are not an array.");

  const allowed = new Set(requestedCountryCodes);
  const seen = new Set<string>();
  const observations = payload[1].map((value, index) => {
    const row = object(value, `observation ${index}`);
    const indicatorValue = object(row.indicator, `indicator for observation ${index}`);
    if (indicatorValue.id !== indicator.api_code) {
      throw new Error(`World Bank returned unexpected indicator ${String(indicatorValue.id)}.`);
    }
    if (typeof row.countryiso3code !== "string") throw new Error("World Bank countryiso3code is invalid.");
    const country = ISO3_TO_COUNTRY.get(row.countryiso3code);
    if (!country || !allowed.has(country.iso2)) {
      throw new Error(`World Bank returned unexpected country ${row.countryiso3code}.`);
    }
    const year = integer(row.date, "observation year", fromYear);
    if (year > toYear) throw new Error(`World Bank returned out-of-range year ${year}.`);
    const key = `${country.iso2}:${year}`;
    if (seen.has(key)) throw new Error(`World Bank returned duplicate observation ${key}.`);
    seen.add(key);
    return {
      countryCode: country.iso2,
      countryIso3: country.iso3,
      indicatorId: indicator.id,
      indicatorCode: indicator.api_code,
      year,
      value: decimal(row.value),
    } satisfies WorldBankObservation;
  });
  return { metadata, observations };
}

function retryDelay(response: Response | null, attempt: number): number {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter && /^\d+$/.test(retryAfter)) return Math.min(Number(retryAfter) * 1000, 30_000);
  return Math.min(500 * 2 ** attempt, 4_000);
}

async function requestJson(url: URL, options: Required<Pick<FetchWorldBankOptions, "fetchImpl" | "sleep" | "timeoutMs" | "maxAttempts">>): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt < options.maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
    let response: Response | null = null;
    try {
      response = await options.fetchImpl(url, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (response.ok) return await response.json();
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`World Bank request failed with HTTP ${response.status}.`);
      }
      lastError = new Error(`World Bank request failed with retryable HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
      if (error instanceof Error && /^World Bank request failed with HTTP/.test(error.message)) throw error;
    } finally {
      clearTimeout(timeout);
    }
    if (attempt + 1 < options.maxAttempts) await options.sleep(retryDelay(response, attempt));
  }
  throw lastError instanceof Error ? lastError : new Error("World Bank request failed.");
}

export async function fetchWorldBankIndicator(
  indicator: Indicator,
  requestedCountryCodes: readonly CountryCode[],
  fromYear: number,
  toYear: number,
  options: FetchWorldBankOptions = {},
): Promise<WorldBankDataset> {
  if (!Number.isInteger(fromYear) || !Number.isInteger(toYear) || fromYear < 1960 || toYear < fromYear || toYear > 2100) {
    throw new Error("Invalid World Bank year range.");
  }
  const requested = [...new Set(requestedCountryCodes)];
  if (requested.length === 0 || requested.length !== requestedCountryCodes.length) throw new Error("Country list must be non-empty and unique.");
  const knownCodes = new Set(countries.map((country) => country.iso2));
  if (requested.some((code) => !knownCodes.has(code))) throw new Error("Country list contains an unsupported country.");

  const config = {
    fetchImpl: options.fetchImpl ?? fetch,
    sleep: options.sleep ?? ((milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))),
    timeoutMs: options.timeoutMs ?? 20_000,
    maxAttempts: options.maxAttempts ?? 3,
  };
  const perPage = options.perPage ?? 1000;
  const endpoint = `${options.baseUrl ?? DEFAULT_BASE_URL}/country/${requested.join(";")}/indicator/${indicator.api_code}`;
  const all: WorldBankObservation[] = [];
  let page = 1;
  let pages = 1;
  let total = 0;
  let lastupdated: string | null = null;
  do {
    const url = new URL(endpoint);
    url.searchParams.set("source", "2");
    url.searchParams.set("format", "json");
    url.searchParams.set("date", `${fromYear}:${toYear}`);
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));
    const parsed = parseWorldBankPage(await requestJson(url, config), indicator, requested, fromYear, toYear);
    if (parsed.metadata.page !== page) throw new Error(`World Bank returned page ${parsed.metadata.page} while page ${page} was requested.`);
    if (page === 1) {
      pages = parsed.metadata.pages;
      total = parsed.metadata.total;
      lastupdated = parsed.metadata.lastupdated;
    } else if (parsed.metadata.pages !== pages || parsed.metadata.total !== total || parsed.metadata.lastupdated !== lastupdated) {
      throw new Error("World Bank pagination metadata changed during the request.");
    }
    all.push(...parsed.observations);
    page++;
  } while (page <= pages);

  const unique = new Set(all.map((row) => `${row.countryCode}:${row.year}`));
  if (unique.size !== all.length) throw new Error("World Bank returned duplicate observations across pages.");
  if (all.length !== total) throw new Error(`World Bank total mismatch: expected ${total}, received ${all.length}.`);
  return { indicatorId: indicator.id, indicatorCode: indicator.api_code, sourceUpdatedAt: lastupdated, pageCount: pages, total, observations: all };
}
