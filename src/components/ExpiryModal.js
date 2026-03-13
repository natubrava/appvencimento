'use client';

import { useState, useEffect } from 'react';
import { createExpiryRecord, updateExpiryRecord, deleteExpiryRecord } from '@/lib/supabase';
import { daysUntilExpiry, getExpiryStatus, getExpiryStatusLabel } from '@/lib/utils';

export default function ExpiryModal({ product, initialData = null, defaultAlertDays = 30, onClose, onComplete }) {
    const isEditing = !!initialData;

    const [formData, setFormData] = useState({
        expiry_date: initialData ? initialData.expiry_date : '',
        batch_label: initialData ? (initialData.batch_label || '') : '',
        quantity: initialData ? (initialData.quantity || 1) : 1,
        alert_days: initialData ? (initialData.alert_days || defaultAlertDays) : defaultAlertDays,
        notes: initialData ? (initialData.notes || '') : '',
        notify_channels: initialData ? (initialData.notify_channels || 'all') : 'all'
    });
    
    const [dateInput, setDateInput] = useState(() => {
        if (initialData && initialData.expiry_date) {
            const [y, m, d] = initialData.expiry_date.split('-');
            return `${d}/${m}/${y}`;
        }
        return '';
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const [dynamicDays, setDynamicDays] = useState(null);

    useEffect(() => {
        if (formData.expiry_date) {
            const days = daysUntilExpiry(formData.expiry_date);
            const status = getExpiryStatus(formData.expiry_date, parseInt(formData.alert_days) || defaultAlertDays, 60); // Using 60 as default red alert fallback
            setDynamicDays({ days, status });
        } else {
            setDynamicDays(null);
        }
    }, [formData.expiry_date, formData.alert_days, defaultAlertDays]);

    function handleDateChange(e) {
        let val = e.target.value.replace(/\D/g, ''); // Mantém apenas números
        if (val.length > 8) val = val.slice(0, 8);
        
        let formatted = val;
        if (val.length > 4) {
            formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
        } else if (val.length > 2) {
            formatted = `${val.slice(0, 2)}/${val.slice(2)}`;
        }
        
        setDateInput(formatted);

        // Atualiza a data interna pro envio se tiver exatos 8 números digitados (DDMMAAAA)
        if (val.length === 8) {
            const y = val.slice(4, 8);
            const m = val.slice(2, 4);
            const d = val.slice(0, 2);
            setFormData(prev => ({ ...prev, expiry_date: `${y}-${m}-${d}` }));
        } else {
             // Limpa a data forte caso não esteja completa para o banco de dados
             setFormData(prev => ({ ...prev, expiry_date: '' }));
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!formData.expiry_date) {
            setError('Data de vencimento é obrigatória');
            return;
        }

        try {
            setSaving(true);
            setError('');

            if (isEditing) {
                await updateExpiryRecord(initialData.id, {
                    expiry_date: formData.expiry_date,
                    batch_label: formData.batch_label,
                    quantity: parseInt(formData.quantity) || 1,
                    alert_days: parseInt(formData.alert_days) || defaultAlertDays,
                    notes: formData.notes,
                    notify_channels: formData.notify_channels
                });
            } else {
                await createExpiryRecord({
                    sku: product.sku,
                    product_name: product.name,
                    batch_label: formData.batch_label,
                    expiry_date: formData.expiry_date,
                    quantity: parseInt(formData.quantity) || 1,
                    alert_days: parseInt(formData.alert_days) || defaultAlertDays,
                    notes: formData.notes,
                    notify_channels: formData.notify_channels
                });
            }

            onComplete();
        } catch (err) {
            setError('Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteConfirmed() {
        if (!window.confirm("Atenção!\n\nTem certeza que deseja apagar ESTE REGISTRO permanentemente do banco de dados?\n\nEle NÃO aparecerá no histórico.\nEsta ação NÃO PODE ser desfeita.")) {
            return;
        }

        try {
            setDeleting(true);
            setError('');
            await deleteExpiryRecord(initialData.id);
            onComplete();
        } catch (err) {
            setError('Erro ao deletar: ' + err.message);
            setDeleting(false);
        }
    }

    const channelOptions = [
        { value: 'all', label: '🔔📧 App + E-mail', desc: 'Receber alerta no app e por e-mail' },
        { value: 'app', label: '🔔 Só no App', desc: 'Receber alerta apenas no app' },
        { value: 'email', label: '📧 Só E-mail', desc: 'Receber alerta apenas por e-mail' },
        { value: 'none', label: '🔕 Desativado', desc: 'Não receber notificações deste item' }
    ];

    return (
        <div className="modal-overlay">
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEditing ? 'Editar Vencimento' : 'Registrar Vencimento'}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-product-info">
                    <strong>{product.name}</strong>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '4px', fontSize: '0.9rem' }}>
                        <span className="text-muted">SKU: {product.sku}</span>
                        <span className="text-muted" style={{ fontWeight: '600', color: '#15803d' }}>
                            Estoque: {product.stock ? (product.isGranel ? `${product.stock.toFixed(1)}kg` : product.stock) : '0'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="expiry_date">Data de Vencimento *</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="tel"
                                id="expiry_date"
                                value={dateInput}
                                onChange={handleDateChange}
                                placeholder="DD/MM/AAAA"
                                required
                                className="form-input"
                                style={{ flex: 1 }}
                            />
                            <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                                <input 
                                    type="date" 
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setFormData(prev => ({ ...prev, expiry_date: e.target.value }));
                                            const [y, m, d] = e.target.value.split('-');
                                            setDateInput(`${d}/${m}/${y}`);
                                        }
                                    }}
                                    style={{ 
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                        opacity: 0, cursor: 'pointer', zIndex: 2
                                    }} 
                                />
                                <div style={{ 
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: '#f3f4f6', borderRadius: '6px', fontSize: '1.4rem',
                                    border: '1px solid #d1d5db', zIndex: 1
                                }}>
                                    📅
                                </div>
                            </div>
                        </div>
                        {dynamicDays && (
                            <div style={{ 
                                marginTop: '6px', 
                                fontSize: '0.85rem', 
                                fontWeight: 'bold',
                                color: dynamicDays.status === 'expired' ? '#dc3545' : 
                                       dynamicDays.status === 'urgent' ? '#e74c3c' : 
                                       dynamicDays.status === 'warning' ? '#d4ac0d' : '#15803d'
                            }}>
                                ↳ {dynamicDays.status === 'expired' ? `Vencido há ${Math.abs(dynamicDays.days)} dias` : 
                                   `Vence em ${dynamicDays.days} dias (${getExpiryStatusLabel(dynamicDays.status)})`}
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="batch_label">Lote (opcional)</label>
                            <input
                                type="text"
                                id="batch_label"
                                value={formData.batch_label}
                                onChange={e => setFormData({ ...formData, batch_label: e.target.value })}
                                placeholder="Ex: L2026-03"
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="quantity">Quantidade</label>
                            <input
                                type="number"
                                id="quantity"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                min="1"
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="alert_days">Alertar com antecedência de (dias)</label>
                        <input
                            type="number"
                            id="alert_days"
                            value={formData.alert_days}
                            onChange={e => setFormData({ ...formData, alert_days: e.target.value })}
                            min="1"
                            max="365"
                            className="form-input"
                        />
                        <div className="quick-buttons" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button type="button" className="btn btn-sm" onClick={() => setFormData({ ...formData, alert_days: 30 })}>
                                30 dias (1 Mês)
                            </button>
                            <button type="button" className="btn btn-sm" onClick={() => setFormData({ ...formData, alert_days: 60 })}>
                                60 dias (2 Meses)
                            </button>
                            <button type="button" className="btn btn-sm" onClick={() => setFormData({ ...formData, alert_days: 90 })}>
                                90 dias (3 Meses)
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Notificação</label>
                        <p className="form-hint">Como você quer ser avisado sobre este vencimento?</p>
                        <div className="notify-channel-options">
                            {channelOptions.map(opt => (
                                <label
                                    key={opt.value}
                                    className={`notify-channel-option ${formData.notify_channels === opt.value ? 'notify-channel-selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="notify_channels"
                                        value={opt.value}
                                        checked={formData.notify_channels === opt.value}
                                        onChange={e => setFormData({ ...formData, notify_channels: e.target.value })}
                                    />
                                    <div>
                                        <span className="notify-channel-label">{opt.label}</span>
                                        <span className="notify-channel-desc">{opt.desc}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="notes">Observações (opcional)</label>
                        <textarea
                            id="notes"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Anotações sobre este lote..."
                            className="form-input form-textarea"
                            rows="2"
                        />
                    </div>

                    {parseFloat(product.stock) <= 0 && (
                        <div className="alert alert-warning" style={{ margin: '10px 0', padding: '10px', fontSize: '0.9rem' }}>
                            <strong>⚠️ Atenção:</strong> O estoque atual deste item no sistema consta como ZERO. Certifique-se de ajustá-mo no seu sistema físico.
                        </div>
                    )}

                    {parseFloat(product.stock) > 0 && parseFloat(formData.quantity) > parseFloat(product.stock) && (
                        <div className="alert alert-warning" style={{ margin: '10px 0', padding: '10px', fontSize: '0.9rem' }}>
                            <strong>⚠️ Estoque Insuficiente:</strong> Você está registrando {formData.quantity} unidades, mas o estoque atual é de apenas {product.stock}.
                        </div>
                    )}

                    {error && <div className="form-error">{error}</div>}

                    <div className="modal-actions" style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
                        <div>
                            {isEditing && (
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={handleDeleteConfirmed}
                                    disabled={saving || deleting}
                                    style={{ color: '#dc3545', borderColor: '#dc3545', backgroundColor: 'transparent' }}
                                    title="Excluir Permanentemente"
                                >
                                    {deleting ? 'Excluindo...' : '🗑️ Excluir Permanentemente'}
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving || deleting}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving || deleting}>
                                {saving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Salvar Vencimento')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

