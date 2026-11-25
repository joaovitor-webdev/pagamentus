-- ============================================================================
-- PAGAMENTUS - Migration 0008: Deduplicação de Empregados e UNIQUE (empresa_id, cpf)
-- ============================================================================

WITH empregados_mantidos AS (
  SELECT DISTINCT ON (empresa_id, cpf)
    id AS id_mantido,
    empresa_id,
    cpf
  FROM public.empregados
  ORDER BY empresa_id, cpf, criado_em ASC, id ASC
),
duplicados AS (
  SELECT e.id AS id_duplicado, m.id_mantido
  FROM public.empregados e
  JOIN empregados_mantidos m
    ON m.empresa_id = e.empresa_id AND m.cpf = e.cpf
  WHERE e.id <> m.id_mantido
)
UPDATE public.eventos_folha ev
SET empregado_id = d.id_mantido
FROM duplicados d
WHERE ev.empregado_id = d.id_duplicado;

WITH empregados_mantidos AS (
  SELECT DISTINCT ON (empresa_id, cpf)
    id AS id_mantido,
    empresa_id,
    cpf
  FROM public.empregados
  ORDER BY empresa_id, cpf, criado_em ASC, id ASC
),
duplicados AS (
  SELECT e.id AS id_duplicado, m.id_mantido
  FROM public.empregados e
  JOIN empregados_mantidos m
    ON m.empresa_id = e.empresa_id AND m.cpf = e.cpf
  WHERE e.id <> m.id_mantido
)
DELETE FROM public.folha_calculos fc
USING duplicados d
WHERE fc.empregado_id = d.id_duplicado;

WITH empregados_mantidos AS (
  SELECT DISTINCT ON (empresa_id, cpf)
    id AS id_mantido,
    empresa_id,
    cpf
  FROM public.empregados
  ORDER BY empresa_id, cpf, criado_em ASC, id ASC
)
DELETE FROM public.empregados e
WHERE NOT EXISTS (
  SELECT 1 FROM empregados_mantidos m WHERE m.id_mantido = e.id
);

ALTER TABLE public.empregados
  DROP CONSTRAINT IF EXISTS empregados_empresa_cpf_unique;

ALTER TABLE public.empregados
  ADD CONSTRAINT empregados_empresa_cpf_unique UNIQUE (empresa_id, cpf);
