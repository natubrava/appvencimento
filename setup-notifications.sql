-- =============================================
-- Schema: Notificações - Controle de Vencimento NatuBrava
-- =============================================

-- Tabela de regras de notificação (configuração global)
CREATE TABLE IF NOT EXISTS notification_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  days_before INTEGER NOT NULL,        -- positivo = antes, negativo = após vencimento
  label TEXT NOT NULL,                  -- ex: "180 dias antes", "No dia do vencimento"
  enabled BOOLEAN DEFAULT true,
  notify_in_app BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,        -- para ordenação na tela
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de log de notificações (histórico + estado de cada alerta)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expiry_record_id UUID REFERENCES expiry_records(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES notification_rules(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('app', 'email')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  seen BOOLEAN DEFAULT false,
  seen_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notification_log_expiry ON notification_log(expiry_record_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_seen ON notification_log(seen);
CREATE INDEX IF NOT EXISTS idx_notification_log_channel ON notification_log(channel);

-- Habilitar Row Level Security (com policy pública para MVP sem auth)
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on notification_rules" ON notification_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on notification_log" ON notification_log FOR ALL USING (true) WITH CHECK (true);

-- Inserir regras padrão
INSERT INTO notification_rules (days_before, label, enabled, notify_in_app, notify_email, sort_order) VALUES
  (180, '180 dias antes', true, true, false, 1),
  (90,  '90 dias antes',  true, true, false, 2),
  (60,  '60 dias antes',  true, true, true,  3),
  (30,  '30 dias antes',  true, true, true,  4),
  (15,  '15 dias antes',  true, true, true,  5),
  (7,   '7 dias antes',   true, true, true,  6),
  (0,   'No dia do vencimento', true, true, true, 7),
  (-1,  '1 dia após vencido',   true, true, true, 8);
