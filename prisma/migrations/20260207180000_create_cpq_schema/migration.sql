-- CreateSchema: cpq (cotizaciones CPQ)
CREATE SCHEMA IF NOT EXISTS cpq;

COMMENT ON SCHEMA cpq IS 'Módulo CPQ (Configure, Price, Quote)';

-- CreateTable: cpq.quotes
CREATE TABLE cpq.quotes (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  client_name TEXT,
  valid_until DATE,
  notes TEXT,
  total_positions INTEGER NOT NULL DEFAULT 0,
  total_guards INTEGER NOT NULL DEFAULT 0,
  monthly_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT cpq_quotes_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX cpq_quotes_code_key ON cpq.quotes(code);
CREATE INDEX idx_cpq_quotes_tenant ON cpq.quotes(tenant_id);
CREATE INDEX idx_cpq_quotes_status ON cpq.quotes(status);
CREATE INDEX idx_cpq_quotes_created_desc ON cpq.quotes(created_at DESC);

-- CreateTable: cpq.puestos_trabajo
CREATE TABLE cpq.puestos_trabajo (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT cpq_puestos_trabajo_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX cpq_puestos_trabajo_name_key ON cpq.puestos_trabajo(name);
CREATE INDEX idx_cpq_puestos_active ON cpq.puestos_trabajo(active);

-- CreateTable: cpq.cargos
CREATE TABLE cpq.cargos (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT cpq_cargos_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX cpq_cargos_name_key ON cpq.cargos(name);
CREATE INDEX idx_cpq_cargos_active ON cpq.cargos(active);

-- CreateTable: cpq.roles
CREATE TABLE cpq.roles (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT cpq_roles_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX cpq_roles_name_key ON cpq.roles(name);
CREATE INDEX idx_cpq_roles_active ON cpq.roles(active);

-- CreateTable: cpq.positions
CREATE TABLE cpq.positions (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL,
  puesto_trabajo_id UUID NOT NULL,
  custom_name TEXT,
  description TEXT,
  weekdays TEXT[] NOT NULL DEFAULT '{}',
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  num_guards INTEGER NOT NULL DEFAULT 1,
  cargo_id UUID NOT NULL,
  rol_id UUID NOT NULL,
  base_salary NUMERIC(12, 2) NOT NULL,
  afp_name TEXT NOT NULL DEFAULT 'modelo',
  health_system TEXT NOT NULL DEFAULT 'fonasa',
  health_plan_pct NUMERIC(5, 4),
  employer_cost NUMERIC(12, 2) NOT NULL,
  net_salary NUMERIC(12, 2),
  monthly_position_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payroll_snapshot JSONB,
  payroll_version_id UUID,
  calculated_at TIMESTAMPTZ(6),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT cpq_positions_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_cpq_positions_quote ON cpq.positions(quote_id);
CREATE INDEX idx_cpq_positions_puesto ON cpq.positions(puesto_trabajo_id);
CREATE INDEX idx_cpq_positions_cargo ON cpq.positions(cargo_id);
CREATE INDEX idx_cpq_positions_rol ON cpq.positions(rol_id);

ALTER TABLE cpq.positions
  ADD CONSTRAINT cpq_positions_quote_fkey
  FOREIGN KEY (quote_id) REFERENCES cpq.quotes(id) ON DELETE CASCADE;

ALTER TABLE cpq.positions
  ADD CONSTRAINT cpq_positions_puesto_fkey
  FOREIGN KEY (puesto_trabajo_id) REFERENCES cpq.puestos_trabajo(id);

ALTER TABLE cpq.positions
  ADD CONSTRAINT cpq_positions_cargo_fkey
  FOREIGN KEY (cargo_id) REFERENCES cpq.cargos(id);

ALTER TABLE cpq.positions
  ADD CONSTRAINT cpq_positions_rol_fkey
  FOREIGN KEY (rol_id) REFERENCES cpq.roles(id);
