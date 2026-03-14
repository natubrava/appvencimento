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
                        A planilha informa que o estoque deste produto é de <strong>{product.stock || 0} unidade(s)</strong>, mas o App possui <strong>{recordsCount} unidade(s)</strong> nos vencimentos ativos.
                    </p>
                    <p style={{ marginBottom: '20px', fontSize: '0.9em', color: '#b45309', fontWeight: 'bold' }}>
                        ⚠️ Diferença encontrada: {recordsCount - (product.stock || 0)} unidade(s) a mais no App.
                    </p>
                    <p style={{ marginBottom: '20px', fontSize: '0.9em', color: '#666' }}>
                        Para corrigir, feche este aviso e utilize os botões ✏️ (Editar) ou ✓ (Resolver) nos itens da lista para dar baixa apenas nas unidades que saíram do estoque físico.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={onClose} 
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            Entendi, vou ajustar individualmente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
