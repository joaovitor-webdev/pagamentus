CREATE TABLE IF NOT EXISTS client_documents (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  exercise VARCHAR(4),
  competence VARCHAR(7),
  type VARCHAR(100) NOT NULL,
  process VARCHAR(255),
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(255),
  file_size INTEGER NOT NULL,
  file_content BYTEA NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'recebido',
  uploaded_by VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_document_requests (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  exercise VARCHAR(4),
  competence VARCHAR(7),
  type VARCHAR(100) NOT NULL,
  process VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  comments TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pendente',
  document_id BIGINT REFERENCES client_documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_document_audit (
  id BIGSERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  client_id INTEGER,
  document_id BIGINT,
  user_name VARCHAR(150) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  result VARCHAR(30) NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_client_documents_org_client
  ON client_documents (organization_id, client_id);
CREATE INDEX IF NOT EXISTS ix_client_documents_filters
  ON client_documents (organization_id, client_id, exercise, competence, type, process);
CREATE INDEX IF NOT EXISTS ix_client_document_requests_org_client
  ON client_document_requests (organization_id, client_id, status);
