'use client';

import { useState } from 'react';
import { updateExpiryStatus } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

export default function ActionModal({ record, onClose, onComplete }) {
    const [action, setAction] = useState('');
    const [notes, setNotes] = useState(record.notes || '');
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

        try {
            setSaving(true);
            setError('');
            await updateExpiryStatus(record.id, action, notes);
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
