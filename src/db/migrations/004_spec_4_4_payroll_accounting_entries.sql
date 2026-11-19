-- Registra os totais contábeis vinculados ao cálculo da folha.
CREATE TABLE IF NOT EXISTS payroll_accounting_entries (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  payroll_run_id INTEGER NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  competencia VARCHAR(7) NOT NULL,
  dados_lancamento JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_payroll_accounting_entry_org_run UNIQUE (organization_id, payroll_run_id)
);
