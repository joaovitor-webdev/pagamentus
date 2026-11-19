-- Registra o resultado das operações de aprovação da folha.
ALTER TABLE payroll_approval_logs
  ADD COLUMN IF NOT EXISTS resultado VARCHAR(20) NOT NULL DEFAULT 'sucesso';
