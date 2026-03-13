-- =============================================
-- Schema: Controle de Vencimento NatuBrava
-- =============================================

-- Tabela de registros de vencimento
CREATE TABLE IF NOT EXISTS expiry_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  batch_label TEXT DEFAULT '',
  expiry_date DATE NOT NULL,
  quantity INTEGER DEFAULT 1,
  alert_days INTEGER DEFAULT 30,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'discarded', 'resolved')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_expiry_sku ON expiry_records(sku);
CREATE INDEX IF NOT EXISTS idx_expiry_status ON expiry_records(status);
CREATE INDEX IF NOT EXISTS idx_expiry_date ON expiry_records(expiry_date);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  default_alert_days INTEGER DEFAULT 30,
  alert_yellow_days INTEGER DEFAULT 90,
  alert_red_days INTEGER DEFAULT 60,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO settings (default_alert_days, alert_yellow_days, alert_red_days) VALUES (30, 90, 60);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expiry_records_updated_at
  BEFORE UPDATE ON expiry_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Habilitar Row Level Security (com policy pública para MVP sem auth)
ALTER TABLE expiry_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on expiry_records" ON expiry_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
