'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/lib/supabase';

export default function SettingsPage() {
    const [settings, setSettings] = useState({ 
        default_alert_days: 30,
        alert_yellow_days: 90,
        alert_red_days: 60
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await getSettings();
            setSettings({
                default_alert_days: data.default_alert_days || 30,
                alert_yellow_days: data.alert_yellow_days || 90,
                alert_red_days: data.alert_red_days || 60
            });
        } catch (err) {
            console.error('Erro:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage('');
            await updateSettings({
                default_alert_days: parseInt(settings.default_alert_days),
                alert_yellow_days: parseInt(settings.alert_yellow_days),
                alert_red_days: parseInt(settings.alert_red_days)
            });
            setMessage('✅ Configurações salvas com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('❌ Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <h1 className="page-title">Configurações</h1>
            <p className="page-subtitle">Ajuste as preferências do sistema</p>

            <div className="settings-card">
                <h2 className="settings-section-title">🔔 Alertas de Vencimento</h2>

                <form onSubmit={handleSave}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label htmlFor="alert_yellow_days" style={{ color: '#d4ac0d' }}>
                            🟡 Nível de Atenção (Amarelo)
                        </label>
                        <p className="form-hint">
                            Dias antes do vencimento para o card ficar amarelo.
                        </p>
                        <div className="settings-input-row">
                            <input
                                type="number"
                                id="alert_yellow_days"
                                value={settings.alert_yellow_days}
                                onChange={e => setSettings({ ...settings, alert_yellow_days: e.target.value })}
                                min="1"
                                max="365"
                                className="form-input settings-input"
                            />
                            <span className="settings-unit">dias</span>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label htmlFor="alert_red_days" style={{ color: '#e74c3c' }}>
                            🔴 Nível Urgente (Vermelho)
                        </label>
                        <p className="form-hint">
                            Dias antes do vencimento para o card ficar vermelho.
                        </p>
                        <div className="settings-input-row">
                            <input
                                type="number"
                                id="alert_red_days"
                                value={settings.alert_red_days}
                                onChange={e => setSettings({ ...settings, alert_red_days: e.target.value })}
                                min="1"
                                max="365"
                                className="form-input settings-input"
                            />
                            <span className="settings-unit">dias</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="default_alert_days">
                            Dias de antecedência padrão ao cadastrar
                        </label>
                        <p className="form-hint">
                            Ao registrar um novo vencimento, este será o valor sugerido.
                        </p>
                        <div className="settings-input-row">
                            <input
                                type="number"
                                id="default_alert_days"
                                value={settings.default_alert_days}
                                onChange={e => setSettings({ ...settings, default_alert_days: e.target.value })}
                                min="1"
                                max="365"
                                className="form-input settings-input"
                            />
                            <span className="settings-unit">dias</span>
                        </div>
                    </div>

                    {message && (
                        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
                            {message}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </form>
            </div>

            <div className="settings-card">
                <h2 className="settings-section-title">🔔 Regras de Notificação</h2>
                <div className="settings-about">
                    <p>Configure quando e como você quer ser avisado sobre os vencimentos dos produtos.</p>
                    <p style={{ marginTop: '8px' }}>
                        Defina regras como &quot;avisar 180 dias antes&quot;, &quot;avisar 7 dias antes&quot;, &quot;avisar no dia do vencimento&quot; e mais.
                    </p>
                </div>
                <a
                    href="/appvencimento/settings/notifications"
                    className="btn btn-primary"
                    style={{ marginTop: '16px', display: 'inline-block', textDecoration: 'none' }}
                >
                    ⚙️ Configurar Regras de Notificação
                </a>
            </div>

            <div className="settings-card">
                <h2 className="settings-section-title">ℹ️ Sobre o Sistema</h2>
                <div className="settings-about">
                    <p><strong>NatuBrava - Controle de Vencimentos</strong></p>
                    <p>Versão 1.1 (com Notificações)</p>
                    <p className="text-muted">
                        Os produtos são carregados automaticamente da planilha Google Sheets.
                        Os dados de vencimento são armazenados no Supabase.
                    </p>
                </div>
            </div>
        </div>
    );
}
