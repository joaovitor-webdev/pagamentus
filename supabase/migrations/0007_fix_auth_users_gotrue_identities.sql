-- ============================================================================
-- PAGAMENTUS - Migration 0007: Corrige colunas GoTrue em auth.users e
-- garante registros correspondentes em auth.identities para login por e-mail.
-- ============================================================================

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE email IN (
  'admin@pagamentus.test',
  'contador@pagamentus.test',
  'rh@pagamentus.test',
  'financeiro@pagamentus.test',
  'cliente@pagamentus.test'
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  u.id::text,
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email IN (
  'admin@pagamentus.test',
  'contador@pagamentus.test',
  'rh@pagamentus.test',
  'financeiro@pagamentus.test',
  'cliente@pagamentus.test'
)
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i
  WHERE i.user_id = u.id AND i.provider = 'email'
);
