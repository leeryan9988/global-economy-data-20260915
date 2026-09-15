-- Apply once to a new Supabase/PostgreSQL database with Supabase roles present.
-- No existing tables or records are dropped or replaced.
BEGIN;

CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iso2 varchar(2) NOT NULL UNIQUE CHECK (iso2 ~ '^[A-Z]{2}$'),
  iso3 varchar(3) NOT NULL UNIQUE CHECK (iso3 ~ '^[A-Z]{3}$'),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z]+(-[a-z]+)*$'),
  name_en text NOT NULL CHECK (length(name_en) > 0),
  name_zh text NOT NULL CHECK (length(name_zh) > 0),
  flag text,
  region text
);

CREATE TABLE public.indicators (
  id text PRIMARY KEY CHECK (id IN ('gdp', 'gdp-per-capita', 'population', 'inflation', 'unemployment', 'lending-rate')),
  name_zh text NOT NULL,
  name_en text NOT NULL,
  api_code text NOT NULL UNIQUE,
  unit text NOT NULL CHECK (unit IN ('USD', 'USD/person', 'people', 'percent')),
  source text NOT NULL DEFAULT 'World Bank' CHECK (source = 'World Bank'),
  source_id integer NOT NULL DEFAULT 2 CHECK (source_id = 2),
  source_url text NOT NULL CHECK (source_url LIKE 'https://data.worldbank.org/indicator/%'),
  description text NOT NULL,
  decimal_places smallint NOT NULL CHECK (decimal_places BETWEEN 0 AND 6)
);

CREATE TABLE public.data_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'World Bank' CHECK (source = 'World Bank'),
  indicator_id text NOT NULL REFERENCES public.indicators(id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed', 'skipped')),
  rows_received integer NOT NULL DEFAULT 0 CHECK (rows_received >= 0),
  rows_inserted integer NOT NULL DEFAULT 0 CHECK (rows_inserted >= 0),
  rows_unchanged integer NOT NULL DEFAULT 0 CHECK (rows_unchanged >= 0),
  revisions_pending integer NOT NULL DEFAULT 0 CHECK (revisions_pending >= 0),
  missing_count integer NOT NULL DEFAULT 0 CHECK (missing_count >= 0),
  error text,
  UNIQUE (id, indicator_id),
  CHECK ((status = 'running' AND finished_at IS NULL) OR (status <> 'running' AND finished_at IS NOT NULL)),
  CHECK (finished_at IS NULL OR finished_at >= started_at)
);

CREATE INDEX data_sync_logs_run_idx ON public.data_sync_logs (run_id);
CREATE INDEX data_sync_logs_success_idx ON public.data_sync_logs (indicator_id, finished_at DESC)
  WHERE status = 'success';

CREATE TABLE public.indicator_values (
  country_id uuid NOT NULL REFERENCES public.countries(id) ON DELETE RESTRICT,
  indicator_id text NOT NULL REFERENCES public.indicators(id) ON DELETE RESTRICT,
  year smallint NOT NULL CHECK (year BETWEEN 1960 AND 2100),
  value numeric CHECK (value NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)),
  source text NOT NULL DEFAULT 'World Bank' CHECK (source = 'World Bank'),
  source_updated_at date,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  sync_log_id uuid NOT NULL,
  PRIMARY KEY (country_id, indicator_id, year),
  FOREIGN KEY (sync_log_id, indicator_id) REFERENCES public.data_sync_logs(id, indicator_id) ON DELETE RESTRICT
);

COMMENT ON COLUMN public.indicator_values.source_updated_at IS
  'World Bank dataset lastupdated date, not the publication date of this individual observation.';
COMMENT ON COLUMN public.indicator_values.value IS
  'Raw numeric value; NULL means missing. Do not round to display precision or replace NULL with zero.';

CREATE INDEX indicator_values_ranking_idx ON public.indicator_values (indicator_id, year, value DESC NULLS LAST);
CREATE INDEX indicator_values_latest_idx ON public.indicator_values (country_id, indicator_id, year DESC)
  WHERE value IS NOT NULL;

CREATE TABLE public.indicator_value_revision_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL,
  indicator_id text NOT NULL,
  year smallint NOT NULL,
  old_value numeric CHECK (old_value NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)),
  proposed_value numeric CHECK (proposed_value NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)),
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  source_updated_at date,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  sync_log_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  approved_at timestamptz,
  approval_reference text,
  UNIQUE (country_id, indicator_id, year, payload_hash),
  FOREIGN KEY (country_id, indicator_id, year)
    REFERENCES public.indicator_values(country_id, indicator_id, year) ON DELETE RESTRICT,
  FOREIGN KEY (sync_log_id, indicator_id)
    REFERENCES public.data_sync_logs(id, indicator_id) ON DELETE RESTRICT,
  CHECK (old_value IS DISTINCT FROM proposed_value),
  CHECK (status NOT IN ('approved', 'applied') OR
    (approved_at IS NOT NULL AND approval_reference IS NOT NULL AND length(btrim(approval_reference)) > 0))
);

CREATE INDEX revision_pending_idx ON public.indicator_value_revision_proposals (fetched_at)
  WHERE status = 'pending';

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicator_value_revision_proposals ENABLE ROW LEVEL SECURITY;

-- Supabase may grant broad table privileges by default: explicitly narrow them.
REVOKE ALL ON public.countries, public.indicators, public.indicator_values,
  public.data_sync_logs, public.indicator_value_revision_proposals
  FROM PUBLIC, anon, authenticated, service_role;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.countries, public.indicators, public.indicator_values TO anon, authenticated;
CREATE POLICY countries_public_read ON public.countries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY indicators_public_read ON public.indicators FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY observations_public_read ON public.indicator_values FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.countries, public.indicators TO service_role;
GRANT SELECT, INSERT ON public.indicator_values TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.data_sync_logs, public.indicator_value_revision_proposals TO service_role;

-- No public RPCs and no service-role UPDATE/DELETE on observations.
-- Approved source revisions will need a separately reviewed, transactional path.
COMMIT;
