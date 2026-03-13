'use client';

import { useState } from 'react';
import { resolveAllExpiriesForSku } from '@/lib/supabase';

export default function ZeroStockModal({ product, recordsCount, onClose, onComplete }) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notes, setNotes] = useState('');

    async function handleResolveAll(status) {
        if (!window.confirm(`Tem certeza que deseja marcar TODOS os ${recordsCount} registros de '${product.name}' como ${status === 'sold' ? 'VENDIDOS' : 'DESCARTADOS'}?`)) {
            return;
        }

        try {
            setSaving(true);
            setError('');
            await resolveAllExpiriesForSku(product.sku, status, notes);
            onComplete();
        } catch (err) {
            setError('Erro ao atualizar: ' + err.message);
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>⚠️ Resolver Pendências (${product.sku})</h3>
                    <button className="modal-close" onClick={onClose} disabled={saving}>✕</button>
                </div>

                <div className="modal-body">
                    <p style={{ marginBottom: '15px' }}>
                        A planilha informa que o estoque deste produto está zerado, mas o App possui <strong>{recordsCount} registro(s) ativo(s)</strong> dele.
                    </p>
                    <p style={{ marginBottom: '20px', fontSize: '0.9em', color: '#666' }}>
                        O que aconteceu com esses produtos que saíram do estoque?
                    </p>

                    <div className="form-group">
                        <label className="form-label">Observações sobre a saída (Opcional)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: Lote devolvido, Vendido no balcão..."
                            disabled={saving}
                        />
                    </div>

                    {error && <div className="form-error">{error}</div>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            onClick={() => handleResolveAll('sold')} 
                            disabled={saving}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            {saving ? 'Atualizando...' : '💰 Foram todos Vendidos'}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={() => handleResolveAll('discarded')} 
                            disabled={saving}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            {saving ? 'Atualizando...' : '🗑️ Foram todos Descartados'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
