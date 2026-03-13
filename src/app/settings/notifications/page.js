'use client';

import { useState, useEffect } from 'react';
import { getNotificationRules, updateNotificationRule } from '@/lib/notifications';

export default function NotificationSettingsPage() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadRules();
    }, []);

    async function loadRules() {
        try {
            setLoading(true);
            const data = await getNotificationRules();
            setRules(data);
        } catch (err) {
            console.error('Erro ao carregar regras:', err);
            setMessage('❌ Erro ao carregar regras. Verifique se as tabelas foram criadas no Supabase.');
        } finally {
            setLoading(false);
        }
    }

    async function handleToggle(rule, field) {
        const newValue = !rule[field];
        try {
            setSaving(rule.id);
            await updateNotificationRule(rule.id, { [field]: newValue });
            setRules(prev =>
                prev.map(r => r.id === rule.id ? { ...r, [field]: newValue } : r)
            );
            setMessage('');
        } catch (err) {
            setMessage('❌ Erro ao salvar: ' + err.message);
        } finally {
            setSaving(null);
        }
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Carregando regras de notificação...</p>
            </div>
        );
    }

    return (
        <div className="settings-page" style={{ maxWidth: '700px' }}>
            <h1 className="page-title">Regras de Notificação</h1>
            <p className="page-subtitle">
                Configure quando você quer ser avisado sobre os vencimentos
            </p>

            {message && (
                <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
                    {message}
                </div>
            )}

            <div className="settings-card">
                <h2 className="settings-section-title">⏰ Alertas Programados</h2>
                <p className="form-hint" style={{ marginBottom: '20px' }}>
                    Escolha em quais momentos você quer receber alertas. Cada regra pode ser
                    configurada para aparecer no app e/ou enviar por e-mail.
                </p>

                <div className="notification-rules-list">
                    <div className="notification-rules-header">
                        <span className="rules-col-label">Regra</span>
                        <span className="rules-col-toggle">Ativo</span>
                        <span className="rules-col-toggle">No App</span>
                        <span className="rules-col-toggle">E-mail</span>
                    </div>

                    {rules.map(rule => (
                        <div
                            key={rule.id}
                            className={`notification-rule-row ${!rule.enabled ? 'rule-disabled' : ''}`}
                        >
                            <span className="rule-label">
                                <span className="rule-icon">
                                    {rule.days_before < 0 ? '🔴' : rule.days_before === 0 ? '⚠️' : rule.days_before <= 7 ? '🟡' : rule.days_before <= 30 ? '🟠' : '🔵'}
                                </span>
                                {rule.label}
                            </span>

                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={rule.enabled}
                                    onChange={() => handleToggle(rule, 'enabled')}
                                    disabled={saving === rule.id}
                                />
                                <span className="toggle-slider"></span>
                            </label>

                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={rule.notify_in_app}
                                    onChange={() => handleToggle(rule, 'notify_in_app')}
                                    disabled={saving === rule.id || !rule.enabled}
                                />
                                <span className="toggle-slider"></span>
                            </label>

                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={rule.notify_email}
                                    onChange={() => handleToggle(rule, 'notify_email')}
                                    disabled={saving === rule.id || !rule.enabled}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="settings-card">
                <h2 className="settings-section-title">ℹ️ Como funciona</h2>
                <div className="settings-about">
                    <p><strong>🔔 No App:</strong> Os alertas aparecem no sino na barra lateral. Ao abrir o app, o sistema verifica automaticamente todos os itens e gera as notificações correspondentes.</p>
                    <p style={{ marginTop: '8px' }}><strong>📧 E-mail:</strong> Um resumo diário é enviado automaticamente com os itens que atingiram as regras ativas. <em>(Requer configuração de e-mail no servidor)</em></p>
                    <p style={{ marginTop: '8px' }}><strong>🎯 Regras globais:</strong> As regras valem para todos os itens cadastrados. Regras com dias positivos indicam antecedência ao vencimento. Dias negativos indicam após o vencimento.</p>
                </div>
            </div>

            <div style={{ marginTop: '12px' }}>
                <a href="/appvencimento/settings" className="btn btn-secondary">
                    ← Voltar às Configurações
                </a>
            </div>
        </div>
    );
}
