'use client';

import { useState } from 'react';
import { updateExpiryStatus } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

export default function ActionModal({ record, onClose, onComplete }) {
    const [action, setAction] = useState('');
    const [notes, setNotes] = useState(record.notes || '');
    const [quantityToResolve, setQuantityToResolve] = useState(record.quantity || 1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const actions = [
        { value: 'sold', label: '💰 Vendido', description: 'Produto foi vendido antes de vencer' },
        { value: 'discarded', label: '🗑️ Descartado', description: 'Produto foi descartado/retirado' },
        { value: 'resolved', label: '✅ Resolvido', description: 'Situação resolvida de outra forma' }
    ];

    async function handleSubmit(e) {
        e.preventDefault();

        if (!action) {
            setError('Selecione uma ação');
            return;
        }

        if (quantityToResolve <= 0 || quantityToResolve > record.quantity) {
            setError(`Quantidade inválida. Escolha entre 1 e ${record.quantity}`);
            return;
        }

        try {
            setSaving(true);
            setError('');
            
            if (quantityToResolve < record.quantity) {
                // Resolução parcial
                await import('@/lib/supabase').then(m => m.resolvePartialQuantity(record.id, quantityToResolve, action, notes));
            } else {
                // Resolução total
                await updateExpiryStatus(record.id, action, notes);
            }
            
            onComplete();
        } catch (err) {
            setError('Erro ao atualizar: ' + err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Resolver Vencimento</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-product-info">
                    <strong>{record.product_name}</strong>
                    <span className="text-muted">
                        SKU: {record.sku} • Vence: {formatDate(record.expiry_date)}
                        {record.batch_label && ` • Lote: ${record.batch_label}`}
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>O que aconteceu com este item?</label>
                        <div className="action-options">
                            {actions.map(a => (
                                <label
                                    key={a.value}
                                    className={`action-option ${action === a.value ? 'action-selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="action"
                                        value={a.value}
                                        checked={action === a.value}
                                        onChange={e => setAction(e.target.value)}
                                    />
                                    <div>
                                        <span className="action-label">{a.label}</span>
                                        <span className="action-desc">{a.description}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {record.quantity > 1 && (
                        <div className="form-group" style={{ marginTop: '15px' }}>
                            <label htmlFor="resolve-qty">Quantas unidades saíram? (Max: {record.quantity})</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                    id="resolve-qty"
                                    type="number"
                                    min="1"
                                    max={record.quantity}
                                    className="form-control"
                                    value={quantityToResolve}
                                    onChange={(e) => setQuantityToResolve(parseInt(e.target.value) || 1)}
                                    style={{ width: '80px' }}
                                    disabled={saving}
                                />
                                <span style={{ fontSize: '0.9em', color: '#666' }}>
                                    unidade(s) de um total de {record.quantity}
                                </span>
                            </div>
                            {quantityToResolve < record.quantity && (
                                <p style={{ fontSize: '0.85em', color: '#b45309', marginTop: '5px' }}>
                                    ℹ️ Restarão {record.quantity - quantityToResolve} unidades ativas para este vencimento.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="action-notes">Observações (opcional)</label>
                        <textarea
                            id="action-notes"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Alguma anotação sobre essa ação..."
                            className="form-input form-textarea"
                            rows="2"
                        />
                    </div>

                    {error && <div className="form-error">{error}</div>}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving || !action}>
                            {saving ? 'Salvando...' : 'Confirmar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
