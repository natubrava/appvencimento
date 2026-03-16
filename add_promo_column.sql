-- 1) Crie o arquivo no Dashboard do Supabase (SQL Editor -> New Query)
-- 2) Cole este código e clique em RUN.

ALTER TABLE expiry_records ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT FALSE;
