import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL e Anon Key são obrigatórios. Configure o .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===== EXPIRY RECORDS =====

export async function getExpiryRecords(filters = {}) {
    let query = supabase
        .from('expiry_records')
        .select('*')
        .order('expiry_date', { ascending: true });

    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    if (filters.sku) {
        query = query.eq('sku', filters.sku);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function getExpiryRecordsBySku(sku) {
    const { data, error } = await supabase
        .from('expiry_records')
        .select('*')
        .eq('sku', sku)
        .order('expiry_date', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function createExpiryRecord(record) {
    const { data, error } = await supabase
        .from('expiry_records')
        .insert([{
            sku: record.sku,
            product_name: record.product_name,
            batch_label: record.batch_label || '',
            expiry_date: record.expiry_date,
            quantity: record.quantity || 1,
            alert_days: record.alert_days || 30,
            notes: record.notes || '',
            notify_channels: record.notify_channels || 'all',
            status: 'active'
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateExpiryRecord(id, record) {
    const updateData = {
        expiry_date: record.expiry_date,
        batch_label: record.batch_label || '',
        quantity: record.quantity || 1,
        alert_days: record.alert_days || 30,
        notes: record.notes || '',
        notify_channels: record.notify_channels || 'all'
    };

    const { data, error } = await supabase
        .from('expiry_records')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateExpiryStatus(id, status, notes = '') {
    const updateData = { status };
    if (notes) updateData.notes = notes;

    const { data, error } = await supabase
        .from('expiry_records')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function resolveAllExpiriesForSku(sku, status, notes = '') {
    const updateData = { status };
    if (notes) updateData.notes = notes;

    const { data, error } = await supabase
        .from('expiry_records')
        .update(updateData)
        .eq('sku', sku)
        .eq('status', 'active')
        .select();

    if (error) throw error;
    return data;
}

export async function deleteExpiryRecord(id) {
    const { error } = await supabase
        .from('expiry_records')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function getDashboardStats() {
    const { data, error } = await supabase
        .from('expiry_records')
        .select('*')
        .eq('status', 'active');

    if (error) throw error;

    const records = data || [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let expired = 0;
    let expiring = 0;
    let ok = 0;

    records.forEach(record => {
        const expiryDate = new Date(record.expiry_date + 'T00:00:00');
        const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            expired++;
        } else if (diffDays <= record.alert_days) {
            expiring++;
        } else {
            ok++;
        }
    });

    return {
        total: records.length,
        expired,
        expiring,
        ok,
        records
    };
}

// ===== SETTINGS =====

export async function getSettings() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        // Se não existe, retorna padrão
        return { default_alert_days: 30, alert_yellow_days: 90, alert_red_days: 60 };
    }
    return data;
}

export async function updateSettings(settings) {
    // Pega o registro existente
    const current = await getSettings();

    const newSettings = {
        default_alert_days: settings.default_alert_days ?? current.default_alert_days,
        alert_yellow_days: settings.alert_yellow_days ?? current.alert_yellow_days,
        alert_red_days: settings.alert_red_days ?? current.alert_red_days
    };

    if (current.id) {
        const { data, error } = await supabase
            .from('settings')
            .update(newSettings)
            .eq('id', current.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase
            .from('settings')
            .insert([newSettings])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
