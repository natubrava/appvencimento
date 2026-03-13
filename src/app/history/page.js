'use client';

import { useState, useEffect } from 'react';
import { getExpiryRecords, deleteExpiryRecord } from '@/lib/supabase';
import { fetchProducts } from '@/lib/sheets';
import { formatDate, getStatusLabel, getExpiryStatus, formatPrice } from '@/lib/utils';

export default function HistoryPage() {
    const [records, setRecords] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        loadRecords();
    }, []);

    async function loadRecords() {
        try {
            setLoading(true);
            const [recordsData, productsData] = await Promise.all([
                getExpiryRecords(),
                fetchProducts()
            ]);
            setRecords(recordsData);
            setProducts(productsData);
        } catch (err) {
            console.error('Erro:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteRecord(id) {
        if (!window.confirm("Atenção!\n\nTem certeza que deseja apagar ESTE REGISTRO permanentemente do histórico?\n\nEsta ação NÃO PODE ser desfeita.")) {
            return;
        }

        try {
            setDeletingId(id);
            await deleteExpiryRecord(id);
            // Atualizar lista removendo o item deletado
            setRecords(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            alert('Erro ao deletar: ' + err.message);
        } finally {
            setDeletingId(null);
        }
    }

    // Calcula Resumo Financeiro
    const getProductPrice = (sku) => {
        const product = products.find(p => p.sku === sku);
        if (!product || !product.price) return 0;
        return parseFloat(String(product.price).replace('R$', '').replace(',', '.').trim()) || 0;
    };

    const financialSummary = records.reduce((acc, record) => {
        const price = getProductPrice(record.sku);
        const totalValue = price * (record.quantity || 1);

        if (record.status === 'sold') {
            acc.recovered += totalValue;
        } else if (record.status === 'discarded') {
            acc.loss += totalValue;
        }
        return acc;
    }, { recovered: 0, loss: 0 });

    const exportToCSV = () => {
        const headers = ['Produto', 'SKU', 'Lote', 'Vencimento', 'Status', 'Qtd', 'Preço Unit.', 'Valor Total', 'Observações', 'Criado em'];

        const csvRows = filteredRecords.map(record => {
            const price = getProductPrice(record.sku);
            const total = price * (record.quantity || 1);

            return [
                `"${record.product_name}"`,
                `"${record.sku}"`,
                `"${record.batch_label || ''}"`,
                `"${formatDate(record.expiry_date)}"`,
                `"${getStatusLabel(record.status)}"`,
                record.quantity,
                `"${formatPrice(price)}"`,
                `"${formatPrice(total)}"`,
                `"${record.notes || ''}"`,
                `"${formatDate(record.created_at?.split('T')[0])}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for excel BOM
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `historico_vencimentos_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredRecords = records.filter(r => {
        if (filter === 'all') return true;
        if (filter === 'active') return r.status === 'active';
        if (filter === 'resolved') return r.status !== 'active';
        return true;
    });

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Carregando histórico...</p>
            </div>
        );
    }

    return (
        <div className="history-page">
            <h1 className="page-title">Histórico</h1>
            <p className="page-subtitle">Todos os registros de vencimento</p>

            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card stat-ok">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <span className="stat-value">{formatPrice(financialSummary.recovered)}</span>
                        <span className="stat-label">Valor Recuperado (Vendidos)</span>
                    </div>
                </div>

                <div className="stat-card stat-expired">
                    <div className="stat-icon">📉</div>
                    <div className="stat-info">
                        <span className="stat-value">{formatPrice(financialSummary.loss)}</span>
                        <span className="stat-label">Prejuízo (Descartados)</span>
                    </div>
                </div>
            </div>

            <div className="filters-bar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="filter-group">
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="active">Ativos</option>
                        <option value="resolved">Resolvidos</option>
                        <option value="sold">Vendidos</option>
                        <option value="discarded">Descartados</option>
                    </select>
                </div>

                <button
                    className="btn btn-secondary"
                    onClick={exportToCSV}
                    disabled={filteredRecords.length === 0}
                >
                    📥 Exportar Excel (.csv)
                </button>
            </div>

            <div className="product-count">{filteredRecords.length} registros listados</div>

            {filteredRecords.length === 0 ? (
                <div className="empty-state">
                    <p>Nenhum registro encontrado.</p>
                </div>
            ) : (
                <div className="history-table-wrapper">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>SKU</th>
                                <th>Lote</th>
                                <th>Vencimento</th>
                                <th>Status</th>
                                <th>Qtd</th>
                                <th>Preço Unit.</th>
                                <th>Valor Total</th>
                                <th>Observações</th>
                                <th>Criado em</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map(record => {
                                const expiryStatus = record.status === 'active'
                                    ? getExpiryStatus(record.expiry_date, record.alert_yellow_days, record.alert_red_days)
                                    : null;

                                return (
                                    <tr key={record.id} className={record.status !== 'active' ? 'row-resolved' : ''}>
                                        <td className="td-name">{record.product_name}</td>
                                        <td>{record.sku}</td>
                                        <td>{record.batch_label || '-'}</td>
                                        <td>
                                            <span className={expiryStatus ? `text-${expiryStatus}` : ''}>
                                                {formatDate(record.expiry_date)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-pill status-${record.status}`}>
                                                {getStatusLabel(record.status)}
                                            </span>
                                        </td>
                                        <td>{record.quantity}</td>
                                        <td>{formatPrice(getProductPrice(record.sku))}</td>
                                        <td><strong>{formatPrice(getProductPrice(record.sku) * (record.quantity || 1))}</strong></td>
                                        <td className="td-notes">{record.notes || '-'}</td>
                                        <td>{formatDate(record.created_at?.split('T')[0])}</td>
                                        <td>
                                            <button
                                                className="btn btn-xs"
                                                onClick={() => handleDeleteRecord(record.id)}
                                                disabled={deletingId === record.id}
                                                style={{ color: '#dc3545', borderColor: 'transparent', backgroundColor: 'transparent', padding: '4px' }}
                                                title="Excluir Permanentemente"
                                            >
                                                {deletingId === record.id ? '⏳' : '🗑️'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
