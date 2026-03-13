import { supabase } from './supabase';

// ===== NOTIFICATION RULES =====

export async function getNotificationRules() {
    const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function updateNotificationRule(id, updates) {
    const { data, error } = await supabase
        .from('notification_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ===== NOTIFICATION LOG =====

export async function getUnseenNotifications() {
    const { data, error } = await supabase
        .from('notification_log')
        .select(`
            *,
            expiry_records!inner (
                id, sku, product_name, expiry_date, batch_label, quantity, status
            ),
            notification_rules (
                label, days_before
            )
        `)
        .eq('channel', 'app')
        .eq('seen', false)
        .order('sent_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getAllNotifications(limit = 50) {
    const { data, error } = await supabase
        .from('notification_log')
        .select(`
            *,
            expiry_records (
                id, sku, product_name, expiry_date, batch_label, quantity, status
            ),
            notification_rules (
                label, days_before
            )
        `)
        .eq('channel', 'app')
        .order('sent_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

export async function markNotificationSeen(id) {
    const { error } = await supabase
        .from('notification_log')
        .update({ seen: true, seen_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
}

export async function markAllNotificationsSeen() {
    const { error } = await supabase
        .from('notification_log')
        .update({ seen: true, seen_at: new Date().toISOString() })
        .eq('channel', 'app')
        .eq('seen', false);

    if (error) throw error;
}

// ===== MOTOR DE VERIFICAÇÃO (roda no client) =====

export async function checkAndGenerateNotifications() {
    // 1. Buscar regras habilitadas para in-app
    const { data: rules, error: rulesError } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('enabled', true)
        .eq('notify_in_app', true);

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) return [];

    // 2. Buscar registros ativos de vencimento
    const { data: records, error: recordsError } = await supabase
        .from('expiry_records')
        .select('*')
        .eq('status', 'active');

    if (recordsError) throw recordsError;
    if (!records || records.length === 0) return [];

    // 3. Buscar notificações já geradas hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: existingLogs, error: logsError } = await supabase
        .from('notification_log')
        .select('expiry_record_id, rule_id')
        .eq('channel', 'app')
        .gte('sent_at', todayISO);

    if (logsError) throw logsError;

    // Set para verificação rápida de duplicatas
    const existingSet = new Set(
        (existingLogs || []).map(l => `${l.expiry_record_id}_${l.rule_id}`)
    );

    // 4. Gerar notificações novas
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const newNotifications = [];

    for (const record of records) {
        const expiryDate = new Date(record.expiry_date + 'T00:00:00');
        const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        // Respeitar preferência de canal do item
        const channels = record.notify_channels || 'all';
        if (channels === 'none' || channels === 'email') continue; // Pular se não quer no app

        for (const rule of rules) {
            // days_before positivo = X dias ANTES do vencimento
            // days_before negativo = X dias APÓS o vencimento
            // days_before 0 = no dia do vencimento
            const shouldNotify = diffDays === rule.days_before;

            if (shouldNotify) {
                const key = `${record.id}_${rule.id}`;
                if (!existingSet.has(key)) {
                    newNotifications.push({
                        expiry_record_id: record.id,
                        rule_id: rule.id,
                        channel: 'app',
                        seen: false
                    });
                    existingSet.add(key);
                }
            }
        }
    }

    // 5. Inserir novas notificações
    if (newNotifications.length > 0) {
        const { error: insertError } = await supabase
            .from('notification_log')
            .insert(newNotifications);

        if (insertError) throw insertError;
    }

    return newNotifications;
}

// ===== CONTAGEM RÁPIDA =====

export async function getUnseenCount() {
    const { count, error } = await supabase
        .from('notification_log')
        .select('*', { count: 'exact', head: true })
        .eq('channel', 'app')
        .eq('seen', false);

    if (error) return 0;
    return count || 0;
}
